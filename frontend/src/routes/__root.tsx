import { Toaster } from "@/components/ui/sonner";
import { AuthContextType } from "@/context/AuthContext";
import {
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";

interface RouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-gray-600">Please try again later.</p>
      </div>
    </div>
  ),
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
      {/* <TanStackRouterDevtools /> */}
    </>
  );
}
