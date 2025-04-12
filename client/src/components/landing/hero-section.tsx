import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-primary-50 to-white py-16 lg:py-24">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Translation Management System
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Streamline Your Global Content
            </h1>
            <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Manage translations across multiple languages with our powerful AI-assisted platform.
              Collaborate in real-time, track changes, and deliver consistent multilingual content.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Today
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px] h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-[420px] bg-white rounded-lg shadow-lg p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          <span className="font-medium">English</span>
                        </div>
                        <div className="text-xs text-gray-500">Original</div>
                      </div>
                      <div className="h-20 bg-gray-50 rounded p-3 text-sm">
                        Welcome to our platform. We are excited to help you manage your global content.
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium">French</span>
                        </div>
                        <div className="flex items-center text-xs text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-3.08"></path>
                            <path d="M18 14v4h4"></path>
                            <path d="M18 14l4 4"></path>
                          </svg>
                          AI Translated
                        </div>
                      </div>
                      <div className="h-20 bg-blue-50 rounded p-3 text-sm">
                        Bienvenue sur notre plateforme. Nous sommes ravis de vous aider à gérer votre contenu mondial.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}