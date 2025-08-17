import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import Summary from "@/components/pdfs/Summary";
import Topics from "@/components/pdfs/Topics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

const quizSearchSchema = z.object({
  pdf_id: z.number().optional(),
});

export const Route = createFileRoute("/_auth/pdfs/show")({
  component: RouteComponent,
  validateSearch: quizSearchSchema,
});

function RouteComponent() {
  const { pdf_id } = Route.useSearch();
  const navigate = useNavigate();

  // Generate exam mutation
  const generateExamMutation = useMutation({
    mutationFn: async () => {
      if (!pdf_id) throw new Error("PDF ID is required");
      const response = await apiClient.post(`/pixel/pdfs/${pdf_id}/examquestions`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Exam generated successfully! Redirecting to exam...");
      // Navigate to exam page after successful generation
      setTimeout(() => {
        navigate({ to: "/exam", search: { pdf_id } });
      }, 1500);
    },
              onError: (error: any) => {
            console.error("Error generating exam:", error);
            
            // Check for specific error messages
            let errorMessage = "Failed to generate exam. Please try again.";
            
            if (error?.response?.data?.message) {
              const message = error.response.data.message;
              if (message.includes("rate limit")) {
                errorMessage = "OpenAI rate limit exceeded. Please wait a moment and try again.";
              } else if (message.includes("authentication")) {
                errorMessage = "API authentication failed. Please contact support.";
              } else if (message.includes("server error")) {
                errorMessage = "Server error. Please try again later.";
              } else {
                errorMessage = message;
              }
            }
            
            toast.error(errorMessage);
          },
  });

  const handleJoinExam = () => {
    if (!pdf_id) {
      toast.error("PDF ID is required");
      return;
    }
    generateExamMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Join Exam Button Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-400">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Ready to Test Your Knowledge?</h2>
                
              </div>
            </div>
            <Button 
              onClick={handleJoinExam}
              disabled={generateExamMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium"
            >
              {generateExamMutation.isPending ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Exam...</span>
                </div>
              ) : (
                <span>Join Exam</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Summary pdf_id={pdf_id} />

        <Topics pdf_id={pdf_id} />
      </div>
    </div>
  );
}
