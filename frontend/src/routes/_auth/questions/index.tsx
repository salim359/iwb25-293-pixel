import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  RotateCcw,
  Play,
} from "lucide-react";
import { useState } from "react";
import z from "zod";

interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: string[];
  correct_answer: string;
  created_at: string;
}

interface QuizAttempt {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

const quizSearchSchema = z.object({
  topic_id: z.number().optional(),
});

export const Route = createFileRoute("/_auth/questions/")({
  component: RouteComponent,
  validateSearch: quizSearchSchema,
});

function RouteComponent() {
  const { topic_id } = Route.useSearch();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questionsQuery = useQuery({
    queryKey: ["questions", { topic_id }],
    queryFn: async () => {
      const response = await apiClient.get(`pixel/topics/${topic_id}/quizzes`);
      return response.data;
    },
    retry: false,
    enabled: !!topic_id,
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
              <Button>Generate Questions</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questionsQuery.data[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questionsQuery.data.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(
              ((currentQuestionIndex + 1) / questionsQuery.data.length) * 100
            )}
            % Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questionsQuery.data.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion?.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {currentQuestion?.options?.map((option: string, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto p-4 text-wrap"
                // onClick={() => handleAnswerSelect(option)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswers[currentQuestionIndex]}
              className="px-6"
            >
              {currentQuestionIndex === questions.length - 1
                ? "Complete Quiz"
                : "Next Question"}
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
