import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const quizSearchSchema = z.object({
  pdf_id: z.number().optional(),
});

export const Route = createFileRoute("/_auth/quizzes/")({
  component: RouteComponent,
  validateSearch: quizSearchSchema,
});

function RouteComponent() {
  const { pdf_id } = Route.useSearch();
  console.log(pdf_id);

  return <div>{pdf_id}</div>;
}
