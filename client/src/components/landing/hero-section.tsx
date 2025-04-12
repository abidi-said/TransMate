import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Globe, CheckCircle } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Streamline Your <span className="text-primary">Translation</span> Workflow
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              The all-in-one translation management platform that combines AI-powered translations, real-time collaboration, and powerful analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/auth?action=register">
                <Button size="lg" className="text-base font-medium">
                  Start for Free
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="text-base font-medium">
                  View Pricing
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Free plan available</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10 bg-white p-4 rounded-lg shadow-xl">
              <div className="relative overflow-hidden rounded-md border border-gray-200">
                <div className="p-2 bg-gray-100 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-xs text-gray-500">Transmate Editor</div>
                </div>
                <div className="p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="text-sm font-medium">welcome.greeting</div>
                          <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Common</div>
                        </div>
                        <div className="mt-2 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 text-xs font-medium text-gray-500">EN</div>
                            <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                              Welcome to Transmate!
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 text-xs font-medium text-gray-500">FR</div>
                            <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                              Bienvenue à Transmate !
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 text-xs font-medium text-gray-500">ES</div>
                            <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                              ¡Bienvenido a Transmate!
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 text-xs font-medium text-gray-500">AR</div>
                            <div className="flex-1 p-2 bg-primary/5 border border-primary/20 rounded text-sm">
                              مرحبًا بك في Transmate!
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          AI Suggest
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          History
                        </Button>
                      </div>
                      <Button size="sm" className="text-xs">
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md max-h-md rounded-full bg-primary/20 blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}