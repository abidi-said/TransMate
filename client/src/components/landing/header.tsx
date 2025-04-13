import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 flex justify-center">
      <div className="container px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <span className="text-xl font-bold">Transmate</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-700 hover:text-primary">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-primary">Pricing</a>
            <a href="#testimonials" className="text-gray-700 hover:text-primary">Testimonials</a>
            <a href="#contact" className="text-gray-700 hover:text-primary">Contact</a>
          </nav>

          {/* Login/Register buttons (desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/auth?action=login">
              <Button variant="outline" className="cursor-pointer">Login</Button>
            </Link>
            <Link href="/auth?action=register">
              <Button className="cursor-pointer">Get Started</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
                Testimonials
              </a>
              <a href="#contact" className="text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
                Contact
              </a>
              <div className="flex flex-col space-y-3 pt-2 border-t border-gray-200">
                <Link href="/auth?action=login">
                  <Button variant="outline" className="w-full cursor-pointer" onClick={() => setMenuOpen(false)}>
                    Login
                  </Button>
                </Link>
                <Link href="/auth?action=register">
                  <Button className="w-full cursor-pointer" onClick={() => setMenuOpen(false)}>
                    Get Started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}