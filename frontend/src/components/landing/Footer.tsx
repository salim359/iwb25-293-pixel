import { Link } from "@tanstack/react-router";
import {
  Twitter,
  Linkedin,
  Github,
  Mail,
  MapPin,
  Phone,
  Heart,
  Sparkles,
  Rocket,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-secondary text-secondary-foreground">
      <div className="lg:mx-24 mx-2 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-primary p-3 rounded-lg">
                <Rocket className="size-12 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">Pixel AI</span>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              AI-powered platform to generate flashcards, quizzes, and exam
              predictions for any subject—instantly, with Pixel AI.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com"
                className="bg-accent hover:bg-primary p-3 rounded-xl transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                className="bg-accent hover:bg-primary p-3 rounded-xl transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                className="bg-accent hover:bg-muted p-3 rounded-xl transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@pixelai.com"
                className="bg-accent hover:bg-primary p-3 rounded-xl transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Pixel AI Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Flashcard Generator (AI)
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Quiz Generator
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Exam Predictions (AI)
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Pixel AI Resources</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  AI Study Tips
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Pixel AI Success Stories
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Pixel AI API Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Contact Pixel AI</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-muted-foreground">
                  <div>123 Learning Lane</div>
                  <div>Colombo, Sri Lanka</div>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <a
                  href="tel:+1-555-0123"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  +1 (555) 0123
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <a
                  href="mailto:hello@pixelai.com"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  hello@pixelai.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="lg:mx-24 mx-2 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>© {currentYear} Pixel AI. Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>in Colombo</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Cookie Policy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
