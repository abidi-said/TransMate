import { Helmet } from "react-helmet";
import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { ContactSection } from "@/components/landing/contact-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Transmate - Translation Management System</title>
        <meta name="description" content="Streamline your localization process with our AI-powered translation management system. Real-time collaboration, powerful analytics, and multiple payment options." />
        <meta name="keywords" content="translation management, localization, AI translation, collaborative translation, language management" />
        <meta property="og:title" content="Transmate - Translation Management System" />
        <meta property="og:description" content="Streamline your localization process with our AI-powered translation management system." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://transmate.com" />
        <meta property="og:image" content="https://transmate.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Transmate - Translation Management System" />
        <meta name="twitter:description" content="Streamline your localization process with our AI-powered translation management system." />
        <meta name="twitter:image" content="https://transmate.com/twitter-image.jpg" />
        <link rel="canonical" href="https://transmate.com" />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <FeaturesSection />
          <TestimonialsSection />
          <PricingSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
}