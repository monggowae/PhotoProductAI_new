import React from 'react';
import { Camera, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold text-white">PhotoProductAI</span>
            </div>
            <p className="text-gray-400">
              Transform your product photos with the power of AI. Professional quality in seconds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-purple-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/login?mode=signup" className="hover:text-purple-400 transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-purple-400 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-purple-400 transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <a href="mailto:support@photoproductai.com" className="hover:text-purple-400 transition-colors">
                  support@photoproductai.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>123 AI Street, Digital City</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} PhotoProductAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}