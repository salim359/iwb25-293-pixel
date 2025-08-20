import Question from "@/components/exams/Question";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { log } from "console";
import { ArrowLeft, BookOpen, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";

const quizSearchSchema = z.object({
  pdf_id: z.number().optional(),
});

export const Route = createFileRoute("/_auth/exams/")({
  component: RouteComponent,
  validateSearch: quizSearchSchema,
});

function RouteComponent() {
  const { pdf_id } = Route.useSearch();
  const { history } = useRouter();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [questions, setQuestions] = useState<any[]>([]);

  const examQuery = useQuery({
    queryKey: ["exam", pdf_id],
    queryFn: async () => {
      const response = await apiClient.get(
        `/pixel/pdfs/${pdf_id}/examquestions`
      );
      console.log(response.data);

      return response.data;
    },
    retry: false,
    enabled: !!pdf_id,
  });

  const generateExamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/pixel/pdfs/${pdf_id}/examquestions`
      );
      return response.data;
    },
    onError: (error) => {
      console.error("Error generating questions:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exam", pdf_id],
      });
    },
  });

  const evaluateMutations = useMutation({
    mutationFn: async () => {
      const requests = [];

      for (const questionId in answers) {
        requests.push(
          apiClient.post(`/pixel/pdfs/${pdf_id}/evaluatequestion`, {
            questionId: parseInt(questionId),
            answer: answers[questionId],
          })
        );
      }

      const responses = await Promise.all(requests);

      return responses.map((response) => response.data);
    },
    onError: (error) => {
      console.error("Error evaluating exam:", error);
    },
    onSuccess: (data) => {
      console.log("All evaluations completed:", data);
      setQuestions((prev) =>
        prev.map((question, questionIndex) => {
          const result = data.find(
            (_, resultIndex) => resultIndex === questionIndex
          );
          return result ? { ...question, ...result } : question;
        })
      );

      queryClient.invalidateQueries({
        queryKey: ["exam", pdf_id],
      });
    },
  });

  useEffect(() => {
    if (examQuery.isSuccess) {
      console.log("ffff", examQuery.data);

      setQuestions(examQuery.data);
    }
  }, [examQuery.isSuccess, examQuery.data]);

  function handleSubmit() {
    console.log("exam submitting");
    evaluateMutations.mutate();
  }

  if (!pdf_id) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">PDF Required</h3>
              <p className="text-muted-foreground">
                Please select a PDF to view questions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examQuery.isLoading) {
    return <Loading message="Loading exam..." />;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No Questions Available
              </h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any questions for this topics.
              </p>
              <Button
                onClick={() => generateExamMutation.mutate()}
                disabled={generateExamMutation.isPending}
              >
                {generateExamMutation.isPending && (
                  <Loader2Icon className="animate-spin" />
                )}
                Generate Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex">
        <Button variant="outline" onClick={() => history.go(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      <div className="space-y-6">
        {questions.map((question: any) => (
          <Question
            key={question.id}
            question={question}
            answers={answers}
            setAnswers={setAnswers}
          />
        ))}

        <div className="flex justify-end">
          <Button
            onClick={() => handleSubmit()}
            disabled={
              examQuery.data.length !== Object.keys(answers).length ||
              evaluateMutations.isPending
            }
          >
            {evaluateMutations.isPending && (
              <Loader2Icon className="animate-spin" />
            )}
            Submit Exam
          </Button>
        </div>
      </div>
    </div>
  );
}
