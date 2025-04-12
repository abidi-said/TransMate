import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { log, error, debug } from "../utils/logger";
import crypto from "crypto";
import axios from "axios";

// Environment variables for Tunisian payment gateways
const D17_API_KEY = process.env.D17_API_KEY;
const QPAY_MERCHANT_ID = process.env.QPAY_MERCHANT_ID;
const QPAY_SECRET_KEY = process.env.QPAY_SECRET_KEY;
const FLOUCI_API_KEY = process.env.FLOUCI_API_KEY;
const EDINAR_MERCHANT_ID = process.env.EDINAR_MERCHANT_ID;
const EDINAR_SECRET_KEY = process.env.EDINAR_SECRET_KEY;

export function setupTunisianPayment(app: Express) {
  // D17 Payment Gateway
  app.post("/api/payments/d17", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!D17_API_KEY) {
        return res.status(400).json({ message: "D17 payment gateway is not configured" });
      }

      const { amount, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create unique order reference
      const orderRef = `TM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create payment record in database
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount: Math.round(amount * 1000), // Convert to millimes
        currency: "tnd",
        status: "pending",
        provider: "d17",
        providerPaymentId: orderRef,
        details: {
          description: description || "Transmate payment via D17",
          orderRef
        }
      });

      // Make API call to D17 to create payment
      const response = await axios.post(
        "https://api.sandbox.d17.co/v1/payments",
        {
          amount: Math.round(amount * 1000), // Amount in millimes
          currency: "TND",
          order_reference: orderRef,
          success_url: `${req.protocol}://${req.get("host")}/api/payments/d17/success`,
          failure_url: `${req.protocol}://${req.get("host")}/api/payments/d17/failure`,
          merchant_reference: req.user.id.toString(),
          description: description || "Transmate payment"
        },
        {
          headers: {
            "Authorization": `Bearer ${D17_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Return payment URL and token
      res.json({
        paymentId: payment.id,
        paymentUrl: response.data.payment_url,
        paymentToken: response.data.payment_token
      });
    } catch (err: any) {
      error(`D17 payment creation error: ${err.message}`);
      res.status(500).json({
        message: `Payment processing error: ${err.message}`
      });
    }
  });

  // D17 Success callback
  app.get("/api/payments/d17/success", async (req: Request, res: Response) => {
    try {
      const { order_reference, payment_token } = req.query;

      if (!order_reference) {
        return res.status(400).json({ message: "Missing order reference" });
      }

      // Verify payment status with D17
      const response = await axios.get(
        `https://api.sandbox.d17.co/v1/payments/${payment_token}`,
        {
          headers: { "Authorization": `Bearer ${D17_API_KEY}` }
        }
      );

      if (response.data.status === "completed") {
        // Update payment status in database
        const payments = await storage.getPaymentsByProviderPaymentId("d17", order_reference as string);
        
        if (payments.length > 0) {
          await storage.updatePaymentStatus(
            payments[0].id, 
            "succeeded", 
            payment_token as string
          );
        }

        // Redirect to success page
        res.redirect("/payment-success");
      } else {
        res.redirect("/payment-failed");
      }
    } catch (err: any) {
      error(`D17 payment verification error: ${err.message}`);
      res.redirect("/payment-failed");
    }
  });

  // D17 Failure callback
  app.get("/api/payments/d17/failure", (req: Request, res: Response) => {
    res.redirect("/payment-failed");
  });

  // QPay Payment Gateway
  app.post("/api/payments/qpay", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!QPAY_MERCHANT_ID || !QPAY_SECRET_KEY) {
        return res.status(400).json({ message: "QPay payment gateway is not configured" });
      }

      const { amount, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create unique order reference
      const orderRef = `TM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Calculate signature
      const signatureData = `${QPAY_MERCHANT_ID}|${orderRef}|${Math.round(amount * 1000)}|TND`;
      const signature = crypto
        .createHmac("sha256", QPAY_SECRET_KEY)
        .update(signatureData)
        .digest("hex");

      // Create payment record in database
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount: Math.round(amount * 1000), // Convert to millimes
        currency: "tnd",
        status: "pending",
        provider: "qpay",
        providerPaymentId: orderRef,
        details: {
          description: description || "Transmate payment via QPay",
          orderRef
        }
      });

      // Return payment data for frontend to redirect
      res.json({
        paymentId: payment.id,
        qpayUrl: "https://sandbox.qpay.tn/payment",
        merchantId: QPAY_MERCHANT_ID,
        orderRef,
        amount: Math.round(amount * 1000),
        currency: "TND",
        signature,
        returnUrl: `${req.protocol}://${req.get("host")}/api/payments/qpay/return`
      });
    } catch (err: any) {
      error(`QPay payment creation error: ${err.message}`);
      res.status(500).json({
        message: `Payment processing error: ${err.message}`
      });
    }
  });

  // QPay Return callback
  app.post("/api/payments/qpay/return", async (req: Request, res: Response) => {
    try {
      const { orderRef, status, transactionId } = req.body;

      if (!orderRef || !status) {
        return res.status(400).json({ message: "Invalid callback data" });
      }

      // Update payment status
      const payments = await storage.getPaymentsByProviderPaymentId("qpay", orderRef);
      
      if (payments.length > 0) {
        await storage.updatePaymentStatus(
          payments[0].id, 
          status === "APPROVED" ? "succeeded" : "failed",
          transactionId
        );
      }

      res.json({ received: true });
    } catch (err: any) {
      error(`QPay callback error: ${err.message}`);
      res.status(500).json({ message: `Callback processing error: ${err.message}` });
    }
  });

  // Flouci Payment Gateway
  app.post("/api/payments/flouci", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!FLOUCI_API_KEY) {
        return res.status(400).json({ message: "Flouci payment gateway is not configured" });
      }

      const { amount, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create payment with Flouci API
      const response = await axios.post(
        "https://api.flouci.com/api/v1/payments",
        {
          app_token: FLOUCI_API_KEY,
          app_secret: "", // Not required for public API
          amount: amount,
          accept_card: true,
          session_timeout_secs: 1800,
          success_link: `${req.protocol}://${req.get("host")}/payment-success`,
          fail_link: `${req.protocol}://${req.get("host")}/payment-failed`,
          developer_tracking_id: req.user.id.toString()
        }
      );

      // Create payment record in database
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount: Math.round(amount * 1000), // Convert to millimes
        currency: "tnd",
        status: "pending",
        provider: "flouci",
        providerPaymentId: response.data.payment_id,
        details: {
          description: description || "Transmate payment via Flouci"
        }
      });

      // Return payment URL
      res.json({
        paymentId: payment.id,
        paymentUrl: response.data.link
      });
    } catch (err: any) {
      error(`Flouci payment creation error: ${err.message}`);
      res.status(500).json({
        message: `Payment processing error: ${err.message}`
      });
    }
  });

  // E-DINAR Payment Gateway
  app.post("/api/payments/edinar", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!EDINAR_MERCHANT_ID || !EDINAR_SECRET_KEY) {
        return res.status(400).json({ message: "E-DINAR payment gateway is not configured" });
      }

      const { amount, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create unique order reference
      const orderRef = `TM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create signature
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureData = `${EDINAR_MERCHANT_ID}|${orderRef}|${Math.round(amount * 1000)}|${timestamp}`;
      const signature = crypto
        .createHmac("sha256", EDINAR_SECRET_KEY)
        .update(signatureData)
        .digest("hex");

      // Create payment record in database
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount: Math.round(amount * 1000), // Convert to millimes
        currency: "tnd",
        status: "pending",
        provider: "edinar",
        providerPaymentId: orderRef,
        details: {
          description: description || "Transmate payment via E-DINAR",
          orderRef
        }
      });

      // Return payment data
      res.json({
        paymentId: payment.id,
        gateway: "edinar",
        merchantId: EDINAR_MERCHANT_ID,
        orderRef,
        amount: Math.round(amount * 1000),
        timestamp,
        signature,
        returnUrl: `${req.protocol}://${req.get("host")}/api/payments/edinar/callback`
      });
    } catch (err: any) {
      error(`E-DINAR payment creation error: ${err.message}`);
      res.status(500).json({
        message: `Payment processing error: ${err.message}`
      });
    }
  });

  // E-DINAR callback
  app.post("/api/payments/edinar/callback", async (req: Request, res: Response) => {
    try {
      const { order_ref, transaction_id, status } = req.body;

      if (!order_ref || !status) {
        return res.status(400).json({ message: "Invalid callback data" });
      }

      // Update payment status
      const payments = await storage.getPaymentsByProviderPaymentId("edinar", order_ref);
      
      if (payments.length > 0) {
        await storage.updatePaymentStatus(
          payments[0].id, 
          status === "SUCCESS" ? "succeeded" : "failed",
          transaction_id
        );
      }

      res.json({ received: true });
    } catch (err: any) {
      error(`E-DINAR callback error: ${err.message}`);
      res.status(500).json({ message: `Callback processing error: ${err.message}` });
    }
  });

  // Payment status check endpoint
  app.get("/api/payments/:id/status", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check if the payment belongs to the authenticated user
      if (payment.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        provider: payment.provider,
        createdAt: payment.createdAt
      });
    } catch (err: any) {
      error(`Payment status check error: ${err.message}`);
      res.status(500).json({ message: `Error checking payment status: ${err.message}` });
    }
  });
}
