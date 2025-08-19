import { Button } from "../ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users, Briefcase } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
export default function CTA() {
const { isAuthenticated } = useContext(AuthContext);
  return (
    <div className="mt-24 lg:mx-24 mx-2">
      <div className="relative overflow-hidden rounded-3xl bg-card p-8 lg:p-16 text-foreground border border-border shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-primary/30"></div>
          <div className="absolute top-32 right-20 w-16 h-16 rounded-full bg-accent/30"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 rounded-full bg-primary/20"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-accent/20"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Study Smarter with Pixel AI
              </span>
            </div>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
            Ready to boost your <span className="text-primary">learning</span>{" "}
            with Pixel AI?
          </h2>

          <p className="text-xl lg:text-2xl mb-12 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
            Join thousands of students and lifelong learners using{" "}
            <span className="font-semibold text-primary">Pixel AI</span> to
            generate flashcards, quizzes, and exam predictions—instantly, for
            any subject.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-primary/20">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">10,000+</div>
              <div className="text-muted-foreground">
                Flashcards Generated with Pixel AI
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-primary/20">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">5,000+</div>
              <div className="text-muted-foreground">
                Quizzes & Questions Created
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">98%</div>
              <div className="text-muted-foreground">
                User Satisfaction Rate
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
          { isAuthenticated() ? (
          <>
            <Link to="/pdfs">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground h-14 !px-8 text-lg font-semibold rounded-full shadow-lg duration-200 group border border-primary hover:bg-primary/90"
              >
                Generate with Pixel AI
              </Button>
            </Link>
             <Link to="/pdfs">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-accent text-primary hover:text-primary h-14 px-8 text-lg font-semibold rounded-full bg-background backdrop-blur-sm"
              >
                Try Quiz Generator
              </Button>
            </Link>
            </>
          ) : (
            <>
            <Link to="/login">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground h-14 !px-8 text-lg font-semibold rounded-full shadow-lg duration-200 group border border-primary hover:bg-primary/90"
              >
                Generate with Pixel AI
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-accent text-primary hover:text-primary h-14 px-8 text-lg font-semibold rounded-full bg-background backdrop-blur-sm"
              >
                Try Quiz Generator
              </Button>
            </Link>
            </>
          )}
          </div>

          <p className="text-muted-foreground text-sm mt-6">
            No credit card required • Free to start • Powered by Pixel AI
          </p>
        </div>
      </div>
    </div>
  );
}
