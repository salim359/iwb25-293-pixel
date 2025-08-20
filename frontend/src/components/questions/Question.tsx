import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { CheckCircle, CircleOff } from "lucide-react";

export default function Question(props: {
  question: any;
  topic_id: number;
}) {
  const [isDirty, setIsDirty] = useState(!!props.question?.user_answer);
  const [answer, setAnswer] = useState(props.question?.user_answer || "");


  const isCorrect = !!props.question?.is_user_answer_correct;

  const queryClient = useQueryClient();

  const answerMutation = useMutation({
    mutationFn: async () => {
      console.log({
        questionId: props.question?.id,
        answer,
      });

      const response = await apiClient.post(`/pixel/quizzes/evaluate`, {
        questionId: props.question?.id,
        answer,
      });
      return response.data;
    },

    onError: (error) => {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer");
    },

    onSuccess: (data: any) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["questions", props.topic_id] });
      setIsDirty(true);
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl leading-relaxed">
          {props.question?.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          {props.question?.question_type === "MCQ" ? (
            <>
              <RadioGroup
                disabled={isDirty}
                value={answer}
                onValueChange={setAnswer}
              >
                {props.question?.options?.map((option: any, index: number) => (
                  <div className="flex items-center space-x-2" key={index}>
                    <RadioGroupItem
                      value={option}
                      id={`${props.question.id}-option-${index}`}
                    />
                    <Label htmlFor={`${props.question.id}-option-${index}`}>
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </>
          ) : (
            <div>
              <Textarea
                disabled={isDirty}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer here..."
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => answerMutation.mutate()}
            disabled={answerMutation.isPending || isDirty}
          >
            Submit Answer
          </Button>
          {
            <div>
              {props.question?.answer && isDirty && (
                <p className="text-sm text-muted-foreground">
                  {props.question?.answer}
                </p>
              )}
            </div>
          }
        </div>
        <div>
          {isCorrect && isDirty && <CheckCircle className="text-green-500" />}
          {!isCorrect && isDirty && <CircleOff className="text-red-500" />}
        </div>
      </CardFooter>
    </Card>
  );
}
