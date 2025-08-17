import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  BookOpen,
  Brain,
  PenTool,
  Eye,
  Download,
  Clock,
  ChevronRight,
  Sparkles,
  LogOut,
} from "lucide-react";
import { AuthContext } from "@/context/AuthContext";
import UploadPdf from "@/components/pdfs/UploadPdf";

export const Route = createFileRoute("/_auth/pdfs/")({
  component: RouteComponent,
});

interface PDF {
  id: number;
  filename: string;
  uploadDate: string;
  status: "processing" | "ready" | "error";
  summary?: string;
  topics?: number;
  quizzes?: number;
  flashcards?: number;
}

function RouteComponent() {
  const [pdfs, setPdfs] = useState<PDF[]>([
    {
      id: 1,
      filename: "Machine Learning Fundamentals.pdf",
      uploadDate: "2025-08-15",
      status: "ready",
      topics: 8,
      quizzes: 12,
      flashcards: 45,
    },
    {
      id: 2,
      filename: "Data Structures & Algorithms.pdf",
      uploadDate: "2025-08-14",
      status: "ready",
      topics: 15,
      quizzes: 25,
      flashcards: 78,
    },
    {
      id: 3,
      filename: "Python Programming Guide.pdf",
      uploadDate: "2025-08-13",
      status: "processing",
      topics: 0,
      quizzes: 0,
      flashcards: 0,
    },
  ]);

  // My
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  function handleLogout() {
    logout();
    navigate({
      to: "/",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Pixel AI
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Smart Learning Platform
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <UploadPdf />

        {/* PDFs Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Your Documents
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pdfs.map((pdf) => (
              <Card key={pdf.id}>
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-destructive" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {pdf.filename}
                        </h3>

                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {pdf.uploadDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {pdf.status === "ready" && (
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-primary/10 rounded-lg p-3">
                          <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
                          <div className="text-sm font-semibold text-foreground">
                            {pdf.topics}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Topics
                          </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <Brain className="w-5 h-5 text-secondary-foreground mx-auto mb-1" />
                          <div className="text-sm font-semibold text-foreground">
                            {pdf.quizzes}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quizzes
                          </div>
                        </div>
                        <div className="bg-accent/50 rounded-lg p-3">
                          <PenTool className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
                          <div className="text-sm font-semibold text-foreground">
                            {pdf.flashcards}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cards
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={pdf.status !== "ready"}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={pdf.status !== "ready"}
                    >
                      Study
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Link
        to="/quizes"
        search={{
          pdf_id: 1,
        }}
      >
        <Button>Quizes of PDF id 1</Button>
      </Link>
    </div>
  );
}
