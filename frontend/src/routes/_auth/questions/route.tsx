import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/questions")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.user?.permissions.includes("quizzes:*")) {
      console.log("you have no quizzes permission");
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
