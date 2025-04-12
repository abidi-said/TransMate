import { Languages, Zap, Globe, Users, GitBranch, LineChart } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Languages className="w-10 h-10 text-primary" />,
      title: "AI-Powered Translation",
      description: "Leverage advanced AI models to generate high-quality translations instantly, saving time and resources."
    },
    {
      icon: <Zap className="w-10 h-10 text-primary" />,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time. See who's editing what, make changes, and get instant feedback."
    },
    {
      icon: <Globe className="w-10 h-10 text-primary" />,
      title: "Multiple Payment Options",
      description: "Support for international payment methods (Stripe, PayPal) and Tunisia-specific methods (D17, QPay, Flouci, E-DINAR)."
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: "Role-based Access Control",
      description: "Define who can view, edit, or approve translations with our comprehensive permission system."
    },
    {
      icon: <GitBranch className="w-10 h-10 text-primary" />,
      title: "Version Control",
      description: "Track changes, revert to previous versions, and maintain a complete history of your translations."
    },
    {
      icon: <LineChart className="w-10 h-10 text-primary" />,
      title: "Analytics Dashboard",
      description: "Get insights on translation progress, quality metrics, and team performance to optimize your workflow."
    }
  ];

  return (
    <section className="py-16 bg-white" id="features">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Powerful Features
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
            Our Translation Management System offers everything you need to streamline your localization process
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}