import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/quizzes")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.user?.permissions.includes("quizzes:*")) {
      console.log("you have no quizes permission");
      throw redirect({
        to: "/",
      });
    }
  },
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
