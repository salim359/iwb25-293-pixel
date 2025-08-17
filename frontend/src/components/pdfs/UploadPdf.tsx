import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/apiClient";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadResponse {
  id: number;
}

export default function UploadPdf() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/pixel/pdfs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
    onSuccess: (data, file) => {
      toast.success(`PDF "${file.name}" uploaded successfully!`);
      console.log("Upload response:", data);

      // Invalidate and refetch PDFs query to update the list
      queryClient.invalidateQueries({ queryKey: ["pdfs"] });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      console.error("Upload failed:", error);
      toast.error(
        error.response?.data?.message || "Upload failed. Please try again."
      );
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast.error("File size must be less than 50MB.");
      return;
    }

    uploadMutation.mutate(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
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
              Transform your documents into interactive learning materials with
              AI-powered summaries, quizzes, and flashcards.
            </p>
          </div>

          {uploadMutation.isPending ? (
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Uploading...</span>
                  <span>Processing</span>
                </div>
                <Progress value={undefined} className="h-2" />
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
                disabled={uploadMutation.isPending}
              />
              <Button
                onClick={triggerFileInput}
                size="lg"
                className="px-8 py-3"
                disabled={uploadMutation.isPending}
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose PDF File
              </Button>
              <p className="text-xs text-muted-foreground">
                Supports PDF files up to 50MB
              </p>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                {uploadMutation.error?.message ||
                  "An error occurred during upload"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
