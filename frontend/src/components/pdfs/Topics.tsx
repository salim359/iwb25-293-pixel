import apiClient from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import z from "zod";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import Summary from "@/components/pdfs/Summary";
import { FileStack, Loader2Icon } from "lucide-react";

export default function Topics(props: { pdf_id: number | undefined }) {
  const queryClient = useQueryClient();

  const generateTopicsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/pixel/pdfs/${props.pdf_id}/topics`
      );
      return response.data;
    },
    onError: (error) => {
      console.error("Error generating topics:", error);
      toast.error("Failed to generate topics");
    },

    onSuccess: () => {
      toast.success("Topics generated successfully");
      queryClient.invalidateQueries({
        queryKey: ["topics", props.pdf_id],
      });
    },
  });

  const topicsQuery = useQuery({
    queryKey: ["topics", props.pdf_id],
    queryFn: async () => {
      const response = await apiClient.get(
        `/pixel/pdfs/${props.pdf_id}/topics`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(response.data);

      return response.data;
    },
    retry: false,
  });
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Topics</h1>
        <p className="text-gray-600">
          Generate and view AI-powered topics for your PDF content
        </p>
      </div>

      {topicsQuery.isLoading ? (
        <Card className="min-h-[400px] flex items-center justify-center">
          <Loading message="Loading your topics..." />
        </Card>
      ) : topicsQuery.data.length ? (
        <div>
          <div className="space-y-3">
            {topicsQuery.data.map((topic: any) => (
              <Card key={topic.id}>
                <CardContent>
                  <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                  {topic.description && (
                    <p className="text-gray-600 mt-2 text-xs">
                      {topic.description}
                    </p>
                  )}
                  <div className="mt-4 space-x-2">
                    <Link to="/flashcards" search={{ topic_id: topic.id }}>
                      <Button size="sm" className="rounded-sm">
                        Flashcards
                      </Button>
                    </Link>
                    <Link to="/questions" search={{ topic_id: topic.id }}>
                      <Button size="sm" className="rounded-sm">
                        Questions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-16 shadow-sm border border-gray-200 bg-white">
          <CardContent>
            <div className="space-y-8">
              <div className="mx-auto w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <FileStack className="size-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Topics Yet
                </h3>
                <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                  Generate AI-powered topics to organize and understand the key
                  themes of your PDF
                </p>
              </div>
              <Button
                onClick={() => generateTopicsMutation.mutate()}
                disabled={generateTopicsMutation.isPending}
              >
                {generateTopicsMutation.isPending && (
                  <Loader2Icon className="animate-spin" />
                )}
                Generate Topics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
