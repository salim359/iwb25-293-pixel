import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import {
  FileText,
  BookOpen,
  Brain,
  PenTool,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useContext } from "react";

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated()) {
      console.log("User is not authenticated, redirecting to home page");
      throw redirect({
        to: "/",
      });
    }
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);
  function handleLogout() {
    logout();
    navigate({
      to: "/",
    });
  }
  return (
    <div>
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Pixel AI
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Smart Learning Platform
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile Section */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-full px-4 py-2 border border-border/50 shadow-sm">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xs font-semibold text-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-foreground leading-none">
                    {user?.email?.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 shadow-sm hover:shadow-md group"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
