import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dispatch, SetStateAction, useState } from "react";
import { CheckCircle, CircleOff } from "lucide-react";

export default function Question(props: {
  question: any;
  answers: Record<number, string>;
  setAnswers: Dispatch<SetStateAction<Record<number, string>>>;
}) {
  function handleChange(value: string) {
    props.setAnswers((prev) => ({
      ...prev,
      [props.question.id]: value,
    }));
  }

  const isCorrect = props.question.status === true;
  const isDirty = props.question["status"] !== undefined;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl leading-relaxed">
          {props.question?.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div>
            <Textarea
              value={props.answers[props.question.id] || ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Write your answer here..."
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-4">
          {
            <div>
              {isDirty && (
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
