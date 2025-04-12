
import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function Checkout() {
  const [_, params] = useRoute("/checkout/:plan");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      toast({
        title: "Processing Payment",
        description: `Processing payment with ${selectedMethod}`,
      });
      // Add payment processing logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="card" className="w-full" onValueChange={setSelectedMethod}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card">Card</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="local">Local</TabsTrigger>
            </TabsList>

            <TabsContent value="card">
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <Input placeholder="Card Number" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM/YY" required />
                  <Input placeholder="CVC" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Processing..." : "Pay with Card"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="paypal">
              <Button 
                onClick={handlePayment} 
                className="w-full bg-[#0070ba] hover:bg-[#005ea6]"
                disabled={loading}
              >
                {loading ? "Processing..." : "Pay with PayPal"}
              </Button>
            </TabsContent>

            <TabsContent value="local">
              <div className="space-y-4">
                <RadioGroup onValueChange={setSelectedMethod} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="d17" id="d17" />
                    <Label htmlFor="d17">D17 (Dinars 17)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="qpay" id="qpay" />
                    <Label htmlFor="qpay">QPay</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flouci" id="flouci" />
                    <Label htmlFor="flouci">Flouci</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="edinar" id="edinar" />
                    <Label htmlFor="edinar">E-DINAR</Label>
                  </div>
                </RadioGroup>
                <Button 
                  onClick={handlePayment}
                  className="w-full"
                  disabled={loading || !selectedMethod}
                >
                  {loading ? "Processing..." : `Pay with ${selectedMethod.toUpperCase()}`}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
