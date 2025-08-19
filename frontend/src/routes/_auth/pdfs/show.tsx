import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

  const generateExamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/pixel/pdfs/${pdf_id}/examquestions`
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Exam generated successfully! Redirecting to exam...");
      setTimeout(() => {
        navigate({ to: "/exams", search: { pdf_id } });
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Error generating exam:", error);
      toast.error("Failed to generate exam. Please try again.");
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
      <Summary pdf_id={pdf_id} />

      <Topics pdf_id={pdf_id} />

      {/* Join Exam Button Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-400">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Ready to Test Your Knowledge?
                </h2>
              </div>
            </div>
            <Link to="/exams" search={{ pdf_id }}>
              <Button>Predicted Exam Questions</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
