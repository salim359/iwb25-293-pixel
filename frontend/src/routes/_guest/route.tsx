import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated()) {
      console.log("you are authenticated");

      throw redirect({
        to: "/pdfs",
      });
    }
  },
});

function RouteComponent() {
  return <Outlet />;
}
