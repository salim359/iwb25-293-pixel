import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { BookOpen, Play, CheckCircle, X } from "lucide-react";

interface ExamQuestion {
  id: number;
  exam_id: number;
  question_text: string;
  answer_text: string;
  sequence: number;
}

interface ExamComponentProps {
  pdf_id: number | undefined;
}

export default function ExamComponent({ pdf_id }: ExamComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch existing exam questions
  const examQuery = useQuery({
    queryKey: ["exam", pdf_id],
    queryFn: async () => {
      if (!pdf_id) return [];
      const response = await apiClient.get(`/pixel/pdfs/${pdf_id}/examquestions`);
      return response.data;
    },
    enabled: !!pdf_id,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0, 
  });

  // Generate new exam questions
  const generateExamMutation = useMutation({
    mutationFn: async () => {
      if (!pdf_id) throw new Error("PDF ID is required");
      const response = await apiClient.post(`/pixel/pdfs/${pdf_id}/examquestions`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Exam generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["exam", pdf_id] });
    },
    onError: (error) => {
      console.error("Error generating exam:", error);
      toast.error("Failed to generate exam");
    },
  });

  const handleStartExam = () => {
    setExamStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowAnswers(false);
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (examQuery.data && currentQuestionIndex < examQuery.data.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishExam = () => {
    setShowAnswers(true);
  };

  const calculateScore = () => {
    if (!examQuery.data) return 0;
    let correct = 0;
    examQuery.data.forEach((question: ExamQuestion) => {
      const userAnswer = userAnswers[question.id] || "";
      if (isAnswerCorrect(userAnswer, question.answer_text, question.question_text)) {
        correct++;
      }
    });
    return Math.round((correct / examQuery.data.length) * 100);
  };

    const [answerEvaluations, setAnswerEvaluations] = useState<{ [key: number]: boolean | null }>({});
  const [evaluatingAnswers, setEvaluatingAnswers] = useState<{ [key: number]: boolean }>({});

  const evaluateAnswerMutation = useMutation({
    mutationFn: async ({ question, userAnswer }: { question: string; userAnswer: string }) => {
      const response = await apiClient.post(`/pixel/pdfs/${pdf_id}/evaluatequestion`, {
        question,
        userAnswer
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const questionId = examQuery.data?.find((q: ExamQuestion) => q.question_text === variables.question)?.id;
      if (questionId) {
        const isCorrect = data.toLowerCase().includes('yes');
        setAnswerEvaluations(prev => ({
          ...prev,
          [questionId]: isCorrect
        }));
      }
    },
    onError: (error) => {
      console.error('Error evaluating answer:', error);
      toast.error('Failed to evaluate answer');
    }
  });

  const isAnswerCorrect = (userAnswer: string, correctAnswer: string, questionText: string): boolean => {
    const questionId = examQuery.data?.find((q: ExamQuestion) => q.question_text === questionText)?.id;
    
    // If we have a cached evaluation result, use it
    if (questionId && answerEvaluations[questionId] !== null && answerEvaluations[questionId] !== undefined) {
      return answerEvaluations[questionId]!;
    }
    
    // If no cached result and we're not currently evaluating, start evaluation
    if (questionId && !evaluatingAnswers[questionId] && userAnswer.trim()) {
      setEvaluatingAnswers(prev => ({ ...prev, [questionId]: true }));
      evaluateAnswerMutation.mutate({
        question: questionText,
        userAnswer: userAnswer
      });
    }
    
    // Fallback to simple exact match while waiting for AI evaluation
    const user = userAnswer.toLowerCase().trim();
    const correct = correctAnswer.toLowerCase().trim();
    return user === correct;
  };

  if (!pdf_id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-16">
          <CardContent>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No PDF Selected</h2>
            <p className="text-gray-600">Please select a PDF to take an exam.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="min-h-[400px] flex items-center justify-center">
          <Loading message="Loading exam questions..." />
        </Card>
      </div>
    );
  }

  if (!examQuery.data || examQuery.data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-16">
          <CardContent>
            <div className="space-y-8">
              <div className="mx-auto w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No Exam Available</h2>
                <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
                  Generate an exam based on your PDF content to test your knowledge.
                </p>
              </div>
              <Button
                onClick={() => generateExamMutation.mutate()}
                disabled={generateExamMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {generateExamMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating Exam...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>Generate Exam</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div></div>
              <CardTitle className="text-2xl font-bold text-center">Exam Ready</CardTitle>
              <Button
                onClick={() => navigate({ to: "/pdfs/show", search: { pdf_id } })}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {examQuery.data.length} Questions Available
              </h3>
             
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Exam Instructions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Answer all questions to the best of your ability</li>
                <li>• You can navigate between questions using the buttons</li>
                <li>• Review your answers before finishing the exam</li>
                <li>• Your score will be calculated based on correct answers</li>
              </ul>
            </div>
            <Button
              onClick={handleStartExam}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = examQuery.data[currentQuestionIndex] as ExamQuestion;
  const totalQuestions = examQuery.data.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </CardTitle>
              <Button
                onClick={() => navigate({ to: "/pdfs/show", search: { pdf_id } })}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Progress: {Math.round(progress)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Question Navigation Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {examQuery.data.map((question: ExamQuestion, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-primary"
                    : userAnswers[question.id]
                    ? "bg-green-400"
                    : "bg-gray-300"
                }`}
                title={`Question ${index + 1}${userAnswers[question.id] ? " (Answered)" : " (Not answered)"}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentQuestion.question_text}
            </h3>
            <textarea
              value={userAnswers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {showAnswers && (
            <div className={`p-4 rounded-lg border ${
              isAnswerCorrect(userAnswers[currentQuestion.id] || "", currentQuestion.answer_text, currentQuestion.question_text)
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
                <h4 className={`font-semibold mb-3 ${
                  isAnswerCorrect(userAnswers[currentQuestion.id] || "", currentQuestion.answer_text, currentQuestion.question_text)
                    ? "text-green-900"
                    : "text-red-900"
                }`}>
                  {isAnswerCorrect(userAnswers[currentQuestion.id] || "", currentQuestion.answer_text, currentQuestion.question_text)
                    ? "✅ Your answer is correct!"
                    : "❌ Your answer is wrong"
                  }
                </h4>
                
                <div className="space-y-2">
                  
                  
                  {!isAnswerCorrect(userAnswers[currentQuestion.id] || "", currentQuestion.answer_text, currentQuestion.question_text) && (
                    <p className="text-sm text-red-700">
                      The correct answer is: <span className="font-semibold">"{currentQuestion.answer_text}"</span>
                    </p>
                  )}
                  
                  {isAnswerCorrect(userAnswers[currentQuestion.id] || "", currentQuestion.answer_text, currentQuestion.question_text) && (
                    <p className="text-sm text-green-700">
                      Well done! 
                    </p>
                  )}
                </div>
              </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {!showAnswers && (
                <Button
                  onClick={handleFinishExam}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Finish Exam
                </Button>
              )}
              {showAnswers && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    Score: {calculateScore()}%
                  </div>
                  <Button
                    onClick={() => {
                      setExamStarted(false);
                      setShowAnswers(false);
                      setUserAnswers({});
                    }}
                    variant="outline"
                  >
                    Take Exam Again
                  </Button>
                </div>
              )}
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
