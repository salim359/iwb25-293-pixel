import { Button } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Loading from "../Loading";

export default function GenerateFlashcards(props: { topic_id: number }) {
  const queryClient = useQueryClient();

  const generateFlashcardsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `pixel/topics/${props.topic_id}/flashcards`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["flashcards", props.topic_id],
      });
    },
  });

  return (
    <div>
      <Button
        onClick={() => generateFlashcardsMutation.mutate()}
        disabled={generateFlashcardsMutation.isPending}
      >
        Generate Now
      </Button>
      {generateFlashcardsMutation.isPending && (
        <Loading message="Generating flashcards..." />
      )}
    </div>
  );
}
