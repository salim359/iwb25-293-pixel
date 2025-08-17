import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/exam/exam')({
  beforeLoad: () => {
    throw redirect({ to: '/exam' })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Redirecting...</div>
}
