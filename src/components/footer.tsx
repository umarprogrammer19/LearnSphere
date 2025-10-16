
"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto py-12 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-gray-600">
              Your gateway to personalized education.
            </p>
            <div className="flex space-x-4 mt-4">
               <a href="#" className="text-gray-400 hover:text-primary"><FaFacebook size={20} /></a>
               <a href="#" className="text-gray-400 hover:text-primary"><FaTwitter size={20} /></a>
               <a href="#" className="text-gray-400 hover:text-primary"><FaInstagram size={20} /></a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/#about" className="text-gray-600 hover:text-primary">About Us</Link></li>
              <li><Link href="/find-tutor" className="text-gray-600 hover:text-primary">Find a Tutor</Link></li>
              <li><Link href="/become-tutor" className="text-gray-600 hover:text-primary">Become a Tutor</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/contact" className="text-gray-600 hover:text-primary">Contact Us</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-primary">FAQs</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-600 hover:text-primary">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Stay Updated</h3>
            <p className="mt-4 text-sm text-gray-600">Subscribe to our newsletter for the latest updates.</p>
            {/* Newsletter form can be added here */}
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} LearnSphere. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
