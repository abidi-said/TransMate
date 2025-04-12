import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { log, error, debug } from "../utils/logger";

// Check for Stripe API key
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeApiKey) {
  stripe = new Stripe(stripeApiKey, {
    apiVersion: "2023-10-16",
  });
} else {
  console.warn("STRIPE_SECRET_KEY environment variable not set. Stripe payments will be unavailable.");
}

export function setupStripePayment(app: Express) {
  if (!stripe) {
    return;
  }

  // Create a payment intent for one-time purchases
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { amount, planId, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user.id.toString(),
          planId: planId || "",
          description: description || "Transmate one-time payment"
        }
      });

      // Record payment in database
      await storage.createPayment({
        userId: req.user.id,
        amount: Math.round(amount * 100),
        currency: "usd",
        status: "pending",
        provider: "stripe",
        providerPaymentId: paymentIntent.id,
        details: {
          description: description || "Transmate one-time payment",
          planId: planId || null
        }
      });

      // Return client secret for frontend
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (err: any) {
      error(`Stripe payment intent creation error: ${err.message}`);
      res.status(500).json({
        message: `Payment processing error: ${err.message}`
      });
    }
  });

  // Create subscription
  app.post("/api/create-subscription", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const user = req.user;

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId && user.subscriptionStatus === "active") {
        return res.status(400).json({ message: "User already has an active subscription" });
      }

      // Get or create customer
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        // Create new customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || user.username,
          metadata: {
            userId: user.id.toString()
          }
        });

        customerId = customer.id;

        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"]
      });

      // Get the latest invoice
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      // Update user's subscription info
      await storage.updateUserStripeInfo(user.id, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });

      // Record payment in database
      await storage.createPayment({
        userId: user.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: "pending",
        provider: "stripe",
        providerPaymentId: paymentIntent.id,
        details: {
          description: "Transmate subscription",
          subscriptionId: subscription.id,
          priceId: priceId
        }
      });

      // Return client secret for frontend
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret
      });
    } catch (err: any) {
      error(`Stripe subscription creation error: ${err.message}`);
      res.status(500).json({
        message: `Subscription creation error: ${err.message}`
      });
    }
  });

  // Get subscription details
  app.get("/api/subscription", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user;

      // Check if user has a subscription
      if (!user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No subscription found" });
      }

      // Get subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      res.json({
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        items: subscription.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          productId: item.price.product,
          amount: item.price.unit_amount,
          currency: item.price.currency,
          interval: item.price.recurring?.interval
        }))
      });
    } catch (err: any) {
      error(`Stripe subscription retrieval error: ${err.message}`);
      res.status(500).json({
        message: `Subscription retrieval error: ${err.message}`
      });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", async (req: Request, res: Response) => {
    try {
      // Authenticate user
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user;

      // Check if user has a subscription
      if (!user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No subscription found" });
      }

      // Cancel subscription (at period end to honor the current billing cycle)
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      res.json({
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });
    } catch (err: any) {
      error(`Stripe subscription cancellation error: ${err.message}`);
      res.status(500).json({
        message: `Subscription cancellation error: ${err.message}`
      });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhook/stripe", async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      debug("Stripe webhook secret not configured");
      return res.status(400).json({ message: "Webhook secret not configured" });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      error(`Stripe webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleSuccessfulPayment(paymentIntent);
        break;

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice;
        await handleSuccessfulInvoice(invoice);
        break;

      case "subscription.updated":
      case "subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;

      default:
        debug(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  });
}

/**
 * Handle successful Stripe payment
 * 
 * @param paymentIntent - The Stripe PaymentIntent object
 */
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find payment in database by provider payment ID
    const payments = await storage.getPaymentsByProviderPaymentId("stripe", paymentIntent.id);
    
    if (payments.length === 0) {
      debug(`No payment record found for PaymentIntent ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    for (const payment of payments) {
      await storage.updatePaymentStatus(payment.id, "succeeded", paymentIntent.id);
      debug(`Updated payment ${payment.id} status to succeeded`);
    }
  } catch (err: any) {
    error(`Error handling successful payment: ${err.message}`);
  }
}

/**
 * Handle successful Stripe invoice payment
 * 
 * @param invoice - The Stripe Invoice object
 */
async function handleSuccessfulInvoice(invoice: Stripe.Invoice) {
  try {
    // Check if this is a subscription invoice
    if (!invoice.subscription) {
      return;
    }

    // Find user by customer ID
    const user = await storage.getUserByStripeCustomerId(invoice.customer as string);
    
    if (!user) {
      debug(`No user found for Stripe customer ${invoice.customer}`);
      return;
    }

    // Update user's subscription status
    await storage.updateUser(user.id, {
      subscriptionStatus: "active"
    });

    // Record payment
    await storage.createPayment({
      userId: user.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
      provider: "stripe",
      providerPaymentId: invoice.payment_intent as string,
      details: {
        subscriptionId: invoice.subscription as string,
        description: "Subscription payment"
      }
    });

    debug(`Recorded subscription payment for user ${user.id}`);
  } catch (err: any) {
    error(`Error handling successful invoice: ${err.message}`);
  }
}

/**
 * Handle Stripe subscription updates
 * 
 * @param subscription - The Stripe Subscription object
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    // Find user by subscription ID
    const user = await storage.getUserByStripeSubscriptionId(subscription.id);
    
    if (!user) {
      debug(`No user found for subscription ${subscription.id}`);
      return;
    }

    // Update user's subscription status
    let status: string;
    
    switch (subscription.status) {
      case "active":
        status = "active";
        break;
      case "canceled":
      case "unpaid":
      case "past_due":
        status = "inactive";
        break;
      default:
        status = subscription.status;
    }

    await storage.updateUser(user.id, {
      subscriptionStatus: status
    });

    debug(`Updated subscription status to ${status} for user ${user.id}`);
  } catch (err: any) {
    error(`Error handling subscription update: ${err.message}`);
  }
}
