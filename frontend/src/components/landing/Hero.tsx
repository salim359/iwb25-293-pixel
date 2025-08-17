import { Button } from "../ui/button";
import { Link } from "@tanstack/react-router";
import logo from "../../assets/logo.svg";

export default function Hero() {
  return (
    <section
      className="min-h-[70vh] mt-8 flex flex-col items-center justify-center px-0 py-20 gap-16 w-full"
      id="hero"
    >
      {/* Content Section */}
      <div className="w-full space-y-10 text-center flex flex-col items-center">
        {/* Social Proof (modern badge) */}
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex items-center px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow border border-border">
            <span className="mr-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            10,000+ flashcards generated with Pixel AI
          </span>
        </div>

        {/* Logo */}
        <img src={logo} alt="Pixel AI Logo" className="size-24 xl:size-48" />

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight text-foreground">
            Supercharge Your <span className="text-primary">Study</span> with
            Pixel AI
          </h1>
          <div className="h-1 w-16 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-xl mx-auto">
          Unlock your learning potential with{" "}
          <span className="font-semibold text-primary">Pixel AI</span>—generate
          flashcards, quizzes, and exam predictions instantly for any subject,
          powered by advanced AI.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/">
            <Button className="h-12 sm:h-14 w-full sm:w-auto px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow">
              Generate with Pixel AI
            </Button>
          </Link>
          <Link to="/">
            <Button
              variant="outline"
              className="h-12 sm:h-14 w-full sm:w-auto px-8 text-lg font-semibold border-2 border-border hover:border-primary hover:text-primary hover:bg-accent transition-all duration-300"
            >
              Try Exam Predictions
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 bg-accent px-3 py-2 rounded-full border border-border">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            <span className="font-medium">AI Flashcards</span>
          </div>
          <div className="flex items-center gap-2 bg-accent px-3 py-2 rounded-full border border-border">
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
            <span className="font-medium">Quiz Generator</span>
          </div>
          <div className="flex items-center gap-2 bg-accent px-3 py-2 rounded-full border border-border">
            <span className="w-2 h-2 bg-destructive rounded-full"></span>
            <span className="font-medium">Exam Prediction</span>
          </div>
        </div>
      </div>
    </section>
  );
}
