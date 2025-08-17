import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import ExamComponent from '@/components/exam/ExamComponent'

const examSearchSchema = z.object({
  pdf_id: z.number().optional(),
});

export const Route = createFileRoute('/_auth/exam')({
  component: RouteComponent,
  validateSearch: examSearchSchema,
})

function RouteComponent() {
  const { pdf_id } = Route.useSearch();
  
  return <ExamComponent pdf_id={pdf_id} />;
}
