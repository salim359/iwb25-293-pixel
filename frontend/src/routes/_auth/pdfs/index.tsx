import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/apiClient";
import {
  FileText,
  Upload,
  BookOpen,
  Brain,
  PenTool,
  BarChart3,
  Zap,
  Plus,
  Eye,
  Download,
  Clock,
  TrendingUp,
  Users,
  ChevronRight,
  Sparkles,
  Target,
  Award,
  LogOut,
} from "lucide-react";
import { AuthContext } from "@/context/AuthContext";

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

interface Stats {
  totalPDFs: number;
  totalTopics: number;
  totalQuizzes: number;
  completionRate: number;
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

  const [stats] = useState<Stats>({
    totalPDFs: 12,
    totalTopics: 84,
    totalQuizzes: 156,
    completionRate: 73,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await apiClient.post("/pixel/pdfs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadProgress(100);

      // Add new PDF to list
      const newPdf: PDF = {
        id: Date.now(),
        filename: file.name,
        uploadDate: new Date().toISOString().split("T")[0],
        status: "processing",
        topics: 0,
        quizzes: 0,
        flashcards: 0,
      };

      setPdfs((prev) => [newPdf, ...prev]);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-900";
      case "processing":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-900";
      case "error":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready":
        return "Ready";
      case "processing":
        return "Processing...";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

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
        {/* Upload Section */}
        <Card className="mb-8 bg-muted/50 border-border">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Upload Your PDF
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Transform your documents into interactive learning materials
                  with AI-powered summaries, quizzes, and flashcards.
                </p>
              </div>

              {isUploading ? (
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Processing your document with AI
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={triggerFileInput}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Choose PDF File
                  </Button>
                  <p className="text-xs text-slate-500">
                    Supports PDF files up to 50MB
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PDFs Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Your Documents
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pdfs.map((pdf) => (
              <Card
                key={pdf.id}
                className="hover:shadow-lg transition-all duration-200 group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {pdf.filename}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {pdf.uploadDate}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pdf.status)}`}
                    >
                      {getStatusText(pdf.status)}
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

                  {pdf.status === "processing" && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span>AI is analyzing your document...</span>
                      </div>
                      <Progress value={65} className="h-1" />
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
    </div>
  );
}
