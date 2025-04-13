import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "0",
      description: "For individuals and small projects",
      features: [
        "Up to 3 languages",
        "Basic translation management",
        "1 project",
        "2 team members",
        "AI translation: 5,000 chars/month",
        "Community support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "29",
      description: "For growing teams and businesses",
      features: [
        "Up to 15 languages",
        "Advanced translation management",
        "10 projects",
        "15 team members",
        "AI translation: 50,000 chars/month",
        "Priority support",
        "Version history",
        "Custom glossaries",
        "API access"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "99",
      description: "For large organizations and agencies",
      features: [
        "Unlimited languages",
        "Advanced translation management",
        "Unlimited projects",
        "Unlimited team members",
        "AI translation: 200,000 chars/month",
        "24/7 dedicated support",
        "Advanced analytics",
        "Custom integrations",
        "SLA guarantees",
        "Custom branding"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section className="py-16 bg-gray-50 flex justify-center" id="pricing">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
            Choose the plan that's right for your business. All plans include core features.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative bg-white rounded-xl shadow-sm overflow-hidden border ${plan.popular ? 'border-primary' : 'border-gray-200'}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">${plan.price}</span>
                  <span className="ml-1 text-xl text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-gray-500">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/auth?plan=" + plan.name.toLowerCase()}>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">Available Payment Methods</h3>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/stripe.svg" alt="Stripe" className="h-8 w-auto" />
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/paypal.svg" alt="PayPal" className="h-8 w-auto" />
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm font-medium">D17</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm font-medium">QPay</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm font-medium">Flouci</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm font-medium">E-DINAR</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}