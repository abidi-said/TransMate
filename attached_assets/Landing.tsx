
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Stepper } from '@/components/ui/stepper';
import { PaymentMethods } from '@/components/payment/PaymentMethods';
import { PricingPlans } from '@/components/pricing/PricingPlans';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  plan: z.enum(['free', 'pro', 'team', 'enterprise'])
});

export default function Landing() {
  const [step, setStep] = React.useState(1);
  const form = useForm({
    resolver: zodResolver(signupSchema)
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-5xl font-bold mb-6">
            Powerful Translation Management System
          </h1>
          <p className="text-xl mb-8">
            Streamline your localization workflow with AI-powered translations
          </p>
          <Button size="lg" variant="secondary">
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6">
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Auth Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto">
          <Tabs defaultValue="signup">
            <TabsList>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <Card className="p-6">
                <Stepper 
                  steps={['Account', 'Plan', 'Payment']} 
                  currentStep={step}
                />
                
                {step === 1 && (
                  <form onSubmit={form.handleSubmit(() => setStep(2))}>
                    {/* Account details form */}
                  </form>
                )}

                {step === 2 && (
                  <PricingPlans 
                    onSelect={(plan) => {
                      form.setValue('plan', plan);
                      setStep(3);
                    }}
                  />
                )}

                {step === 3 && (
                  <PaymentMethods 
                    plan={form.getValues('plan')}
                    onComplete={() => {
                      // Handle signup completion
                    }}
                  />
                )}
              </Card>
            </TabsContent>

            <TabsContent value="login">
              <Card className="p-6">
                {/* Login form */}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: 'AI-Powered Translations',
    description: 'Get accurate translations with advanced AI technology'
  },
  {
    title: 'Git Integration',
    description: 'Seamlessly sync with GitHub, GitLab and Bitbucket'
  },
  {
    title: 'Collaboration Tools',
    description: 'Work together with your team in real-time'
  }
];
