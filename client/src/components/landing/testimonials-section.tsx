import { Star } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "This platform has transformed how we manage our localization workflow. The AI translation suggestions save us countless hours, and the real-time collaboration feature keeps our team aligned.",
      name: "Sarah Johnson",
      title: "Localization Manager",
      company: "Global Tech Solutions"
    },
    {
      quote: "As a software company with users across 40 countries, maintaining consistent translations was a challenge until we found this platform. The version control and approval process have been game-changers.",
      name: "Marco Riviera",
      title: "Product Lead",
      company: "SoftStack Inc."
    },
    {
      quote: "The analytics dashboard gives me visibility into translation progress across all our projects. Being able to accept payments through local Tunisian methods has made it accessible for our entire organization.",
      name: "Leila Ben Ahmed",
      title: "Content Director",
      company: "CreativeMinds"
    },
  ];

  return (
    <section className="py-16 bg-white flex justify-center">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            What Our Customers Say
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
            Organizations around the world are streamlining their localization process with our platform
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <blockquote key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
              <footer className="mt-4">
                <div className="font-medium">{testimonial.name}</div>
                <div className="text-sm text-gray-500">{testimonial.title}, {testimonial.company}</div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}