import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import Summary from "@/components/pdfs/Summary";
import Topics from "@/components/pdfs/Topics";

const quizSearchSchema = z.object({
  pdf_id: z.number().optional(),
});

export const Route = createFileRoute("/_auth/pdfs/show")({
  component: RouteComponent,
  validateSearch: quizSearchSchema,
});

function RouteComponent() {
  const { pdf_id } = Route.useSearch();

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <div className="grid grid-cols-2 gap-4">
        <Summary pdf_id={pdf_id} />

        <Topics pdf_id={pdf_id} />
      </div>
    </div>
  );
}
