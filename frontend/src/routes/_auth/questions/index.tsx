import Loading from "@/components/Loading";
import Question from "@/components/questions/Question";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import z from "zod";

const quizSearchSchema = z.object({
  topic_id: z.number().optional(),
});

export const Route = createFileRoute("/_auth/questions/")({
  component: RouteComponent,
  validateSearch: quizSearchSchema,
});

function RouteComponent() {
  const { topic_id } = Route.useSearch();
  const { history } = useRouter();
  const queryClient = useQueryClient();
  const [score, setScore] = useState<number | null>(null);
  const [numberOfQuestionsAnswered, setNumberOfQuestionsAnswered] =
    useState<number>(0);

  const questionsQuery = useQuery({
    queryKey: ["questions", { topic_id }],
    queryFn: async () => {
      const response = await apiClient.get(`pixel/topics/${topic_id}/quizzes`);
      console.log(response.data);

      return response.data;
    },
    retry: false,
    enabled: !!topic_id,
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`pixel/topics/${topic_id}/quizzes`);
      return response.data;
    },
    onError: (error) => {
      console.error("Error generating questions:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions", { topic_id }],
      });
    },
  });

  if (!topic_id) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Topic Required</h3>
              <p className="text-muted-foreground">
                Please select a topic to view questions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questionsQuery.isLoading) {
    return <Loading message="Loading questions..." />;
  }

  if (questionsQuery.isError) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No Questions Available
              </h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any questions for this topic.
              </p>
              <Button
                onClick={() => generateQuestionsMutation.mutate()}
                disabled={generateQuestionsMutation.isPending}
              >
                Generate Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Beautiful Score Section */}
      <Card className="mb-8 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Quiz Progress
              </h2>
              <p className="text-sm text-muted-foreground">
                Track your performance
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {numberOfQuestionsAnswered || 0}/{questionsQuery.data.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Questions Answered
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Score</span>
              <span className="font-medium text-primary">
                {Math.round(((score || 0) / questionsQuery.data.length) * 100)}%
              </span>
            </div>
            <Progress
              value={((score || 0) / questionsQuery.data.length) * 100}
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {questionsQuery.data.map((question: any) => (
          <Question
            key={question.id}
            question={question}
            topic_id={topic_id}
            setScore={setScore}
            setNumberOfQuestionsAnswered={setNumberOfQuestionsAnswered}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button onClick={() => history.go(-1)}>Try Other Topics</Button>
      </div>
    </div>
  );
}
