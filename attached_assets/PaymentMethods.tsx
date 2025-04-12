
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StripePayment } from './providers/StripePayment';
import { PayPalPayment } from './providers/PayPalPayment';
import { TunisianPayment } from './providers/TunisianPayment';

interface PaymentMethodsProps {
  plan: string;
  onComplete: () => void;
}

export function PaymentMethods({ plan, onComplete }: PaymentMethodsProps) {
  return (
    <Tabs defaultValue="international">
      <TabsList>
        <TabsTrigger value="international">International</TabsTrigger>
        <TabsTrigger value="local">Tunisia</TabsTrigger>
      </TabsList>

      <TabsContent value="international">
        <div className="space-y-4">
          <StripePayment plan={plan} onComplete={onComplete} />
          <PayPalPayment plan={plan} onComplete={onComplete} />
        </div>
      </TabsContent>

      <TabsContent value="local">
        <TunisianPayment 
          methods={['D17', 'QPay', 'Flouci', 'E-DINAR']}
          plan={plan}
          onComplete={onComplete}
        />
      </TabsContent>
    </Tabs>
  );
}
