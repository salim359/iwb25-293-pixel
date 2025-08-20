import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import z from "zod";
import Summary from "@/components/pdfs/Summary";
import Topics from "@/components/pdfs/Topics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trophy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
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

  const progressQuery = useQuery({
    queryKey: ["userProgress", pdf_id],
    queryFn: async () => {
      const response = await apiClient.get(`/pixel/users/progress/${pdf_id}`);
      return response.data;
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full flex items-center justify-center shadow-md">
                <BookOpen className="w-7 h-7 text-purple-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Ready to Test Your Knowledge?
                </h2>
                <p className="text-sm text-gray-500">
                  Challenge yourself with AI-predicted exam questions and track
                  your progress below.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 min-w-[160px]">
              {progressQuery.isLoading ? (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-blue-700 font-medium">
                    Loading progress...
                  </span>
                </div>
              ) : (
                progressQuery.data && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-purple-700 font-semibold">
                      Your Progress
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-16 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-blue-400"
                          style={{
                            width: `${Math.min(progressQuery.data.count ?? 0, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-700 font-bold">
                        {(progressQuery.data.count ?? 0).toFixed(0)}%
                      </span>
                    </div>
                    {/* Optionally show last completed date or more info here */}
                  </div>
                )
              )}
              <Link to="/exams" search={{ pdf_id }}>
                <Button className="mt-2">Predicted Exam Questions</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
