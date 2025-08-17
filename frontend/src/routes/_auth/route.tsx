import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";
import {
  createFileRoute,
  Link,
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
import logo from "@/assets/logo.svg";

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
      <div className="flex items-center justify-between h-[10vh] mx-auto px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Link to="/pdfs">
              <div className="flex items-center">
                <img src={logo} alt="Pixel AI" className="size-16 -mr-2" />
                <div>
                  <span className="text-2xl font-bold">ixel AI</span>
                  <p className="text-sm text-muted-foreground">
                    Smart Learning Platform
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* User Profile Section */}
          <div className="flex items-center space-x-3">
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
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
          </Button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
