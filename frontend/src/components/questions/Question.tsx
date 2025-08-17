import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dispatch, SetStateAction, useState } from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { set } from "zod";
import { Check, CheckCircle, CircleOff } from "lucide-react";

export default function Question(props: {
  question: any;
  topic_id: number;
  setScore: Dispatch<SetStateAction<number | null>>;
  setNumberOfQuestionsAnswered: Dispatch<SetStateAction<number>>;
}) {
  const [answer, setAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [suggestedAnswer, setSuggestedAnswer] = useState("");

  const queryClient = useQueryClient();

  const answerMutation = useMutation({
    mutationFn: async () => {
      console.log({
        questionId: props.question?.id,
        answer,
      });

      const response = await apiClient.post(`/pixel/quizzes/progress`, {
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

      if (data.status === "Correct") {
        setIsCorrect(true);
        props.setScore((prevScore) => (prevScore || 0) + 1);
      } else {
        setIsCorrect(false);
      }

      toast.success("Answer submitted successfully");
      setAnswered(true);
      props.setNumberOfQuestionsAnswered((prev) => prev + 1);
      setSuggestedAnswer(data.answer || "");
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
            <RadioGroup
              disabled={answered}
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
          ) : (
            <div>
              <Textarea
                disabled={answered}
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
            disabled={answerMutation.isPending || answered}
          >
            Submit Answer
          </Button>
          {
            <div>
              {suggestedAnswer && (
                <p className="text-sm text-muted-foreground">
                  {suggestedAnswer}
                </p>
              )}
            </div>
          }
        </div>
        <div>
          {isCorrect && answered && <CheckCircle className="text-green-500" />}
          {!isCorrect && answered && <CircleOff className="text-red-500" />}
        </div>
      </CardFooter>
    </Card>
  );
}
