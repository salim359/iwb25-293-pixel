import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/exams")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.user?.permissions.includes("exams:*")) {
      console.log("you have no exams permission");
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
