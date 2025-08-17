import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/pdfs")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.user?.permissions.includes("pdfs:*")) {
      console.log("you have no pdf permission");
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
