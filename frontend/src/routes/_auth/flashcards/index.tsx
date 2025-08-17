import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";
import {
  BookOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Brain,
  Target,
  Trophy,
} from "lucide-react";
import Generate from "@/components/flashcards/GenerateFlashcards";

const quizSearchSchema = z.object({
  topic_id: z.number().optional(),
});

export const Route = createFileRoute("/_auth/flashcards/")({
  component: RouteComponent,
  validateSearch: quizSearchSchema,
});

function RouteComponent() {
  const { topic_id } = Route.useSearch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());

  const flashcardQuery = useQuery({
    queryKey: ["flashcards", topic_id],
    queryFn: async () => {
      const response = await apiClient.get(
        `pixel/topics/${topic_id}/flashcards`
      );
      return response.data;
    },
    enabled: !!topic_id,
  });

  const flashcards = flashcardQuery.data || [];
  const currentCard = flashcards[currentIndex];

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped && currentCard) {
      setStudiedCards((prev) => new Set([...prev, currentCard.id]));
    }
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudiedCards(new Set());
  };

  if (!topic_id) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Select a Topic
            </h2>
            <p className="text-gray-600">
              Please choose a topic to start studying with flashcards.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flashcardQuery.isLoading) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loading message="Loading your flashcards..." />
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No Flashcards Found
            </h2>
            <p className="text-gray-600">
              There are no flashcards available for this topic yet.
            </p>
            <div className="mt-3">
              <Generate topic_id={topic_id} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = Math.round(
    (studiedCards.size / flashcards.length) * 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">
              Flashcard Study Session
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Master Your Knowledge
          </h1>
          <p className="text-gray-600">
            Click cards to reveal answers and track your progress
          </p>
        </div>

        {/* Progress Stats */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Progress</div>
                <div className="font-bold text-gray-800">
                  {studiedCards.size}/{flashcards.length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-sm text-gray-600">Completion</div>
                <div className="font-bold text-gray-800">
                  {progressPercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white/50 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Main Flashcard */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-2xl">
            <Card
              className={`
                w-full h-80 cursor-pointer border-0 shadow-2xl transition-all duration-700 ease-in-out transform-gpu
                ${isFlipped ? "rotate-y-180" : ""} 
                hover:shadow-3xl hover:-translate-y-1
                bg-gradient-to-br from-white to-gray-50
              `}
              onClick={flipCard}
              style={{
                transformStyle: "preserve-3d",
                background: isFlipped
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              <CardContent className="h-full flex items-center justify-center p-8 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full" />
                  <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/20 rounded-full" />
                </div>

                <div className="text-center transition-opacity duration-300">
                  {!isFlipped ? (
                    <div>
                      <div className="text-sm uppercase tracking-wider text-white/80 mb-4">
                        Term
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {currentCard?.term}
                      </h2>
                      <div className="mt-6 text-white/70 text-sm">
                        Click to reveal definition
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm uppercase tracking-wider text-white/80 mb-4">
                        Definition
                      </div>
                      <p className="text-lg md:text-xl text-white leading-relaxed">
                        {currentCard?.definition}
                      </p>
                      <div className="mt-6 text-white/70 text-sm">
                        Click to return to term
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Counter */}
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    {currentIndex + 1} / {flashcards.length}
                  </span>
                </div>

                {/* Studied Indicator */}
                {studiedCards.has(currentCard?.id) && (
                  <div className="absolute top-4 left-4 bg-green-500/20 backdrop-blur-sm rounded-full p-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <Button
            onClick={previousCard}
            disabled={currentIndex === 0}
            variant="outline"
            size="lg"
            className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          <Button
            onClick={resetProgress}
            variant="outline"
            size="lg"
            className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>

          <Button
            onClick={nextCard}
            disabled={currentIndex === flashcards.length - 1}
            variant="outline"
            size="lg"
            className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Completion Message */}
        {studiedCards.size === flashcards.length && (
          <div className="text-center">
            <Card className="max-w-md mx-auto border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
                <p className="text-green-100">
                  You've studied all {flashcards.length} flashcards in this
                  topic!
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
