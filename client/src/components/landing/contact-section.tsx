import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

export function ContactSection() {
  return (
    <section className="py-16 bg-gray-50" id="contact">
      <div className="container px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Get in Touch</h2>
            <p className="text-gray-500 mb-8">
              Questions about our services? Ready to get started? Drop us a message and our team will get back to you shortly.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-primary mt-1 mr-3" />
                <div>
                  <h3 className="font-medium">Our Location</h3>
                  <p className="text-gray-500">Technopark El Ghazela, Ariana, Tunisia</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-primary mt-1 mr-3" />
                <div>
                  <h3 className="font-medium">Email Us</h3>
                  <p className="text-gray-500">contact@transmate.com</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="w-5 h-5 text-primary mt-1 mr-3" />
                <div>
                  <h3 className="font-medium">Call Us</h3>
                  <p className="text-gray-500">+216 70 123 456</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                  <Input id="name" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input id="email" type="email" placeholder="Your email" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                <Input id="subject" placeholder="How can we help?" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Message</label>
                <Textarea
                  id="message"
                  placeholder="Your message"
                  rows={5}
                />
              </div>
              
              <Button className="w-full">Send Message</Button>
              
              <p className="text-xs text-gray-500 text-center">
                By submitting this form, you agree to our <a href="#" className="text-primary hover:underline">Privacy Policy</a> and <a href="#" className="text-primary hover:underline">Terms of Service</a>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}