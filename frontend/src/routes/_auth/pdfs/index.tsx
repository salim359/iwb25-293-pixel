import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

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

  const pdfQuery = useQuery({
    queryKey: ["pdfs"],
    queryFn: async () => {
      const response = await apiClient.get("/pixel/pdfs");
      return response.data;
    },
  });

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

          {pdfQuery.isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pdfQuery.data.map((pdf: any) => (
                <Card
                  key={pdf.id}
                  className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-white via-gray-50/50 to-primary/5 dark:from-gray-900 dark:via-gray-800/50 dark:to-primary/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shadow-lg border border-primary/20">
                            <FileText className="w-7 h-7 text-primary" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors duration-200 mb-1">
                            {pdf.name}
                          </h3>
                          <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full inline-block">
                            Ready to study
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-md transition-all duration-200">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                              {pdf.topics || 0}
                            </div>
                            <div className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
                              Topics
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-md transition-all duration-200">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                              {pdf.quizzes || 0}
                            </div>
                            <div className="text-xs font-medium text-purple-600/80 dark:text-purple-400/80">
                              Quizzes
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-md transition-all duration-200">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                              <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                              {pdf.cards || 0}
                            </div>
                            <div className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                              Cards
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 relative z-10">
                    <div className="flex gap-3 w-full">
                      <Link
                        to="/quizzes"
                        search={{ pdf_id: pdf.id }}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Quizzes
                        </Button>
                      </Link>
                      <Link
                        to="/"
                        search={{ pdf_id: pdf.id }}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20 hover:bg-accent hover:text-accent-foreground transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Flashcards
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
