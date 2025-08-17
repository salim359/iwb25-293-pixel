import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/flashcards")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.user?.permissions.includes("flashcards:*")) {
      console.log("you have no flashcards permission");
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
