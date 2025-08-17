import apiClient from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function Summary(props: { pdf_id: number | undefined }) {
  const queryClient = useQueryClient();

  const summeryQuery = useQuery({
    queryKey: ["summery", props.pdf_id],
    queryFn: async () => {
      const response = await apiClient.get(
        `/pixel/pdfs/${props.pdf_id}/summaries`
      );
      return response.data;
    },
    retry: false,
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/pixel/pdfs/${props.pdf_id}/summaries`
      );
      return response.data;
    },
    onError: (error) => {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    },

    onSuccess: () => {
      toast.success("Summary generated successfully");
      queryClient.invalidateQueries({
        queryKey: ["summery", props.pdf_id],
      });
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Summary</h1>
        <p className="text-gray-600">
          Generate and view AI-powered summaries for your PDF content
        </p>
      </div>

      {summeryQuery.isLoading ? (
        <Card className="min-h-[400px] flex items-center justify-center">
          <Loading message="Loading your summary..." />
        </Card>
      ) : summeryQuery.data ? (
        <Card>
          <CardContent>
            <div className="prose max-w-none">
              <Markdown>{summeryQuery.data.summary}</Markdown>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-16 shadow-sm border border-gray-200 bg-white">
          <CardContent>
            <div className="space-y-8">
              <div className="mx-auto w-24 h-24 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                <svg
                  className="w-10 h-10 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Summary Yet
                </h3>
                <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                  Generate an AI-powered summary to quickly understand the key
                  points of your PDF
                </p>
              </div>
              <Button
                onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending}
              >
                {generateSummaryMutation.isPending && (
                  <Loader2Icon className="animate-spin" />
                )}
                Generate Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
