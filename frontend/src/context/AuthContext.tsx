import Loading from "@/components/Loading";
import { UserResource, UserRole } from "@/types";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { jwtDecode, JwtPayload as DefaultJwtPayload } from "jwt-decode";

interface JwtPayload extends DefaultJwtPayload {
  user_id: string;
  email: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  permissions: string[];
}

export interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  signup: (userData: User) => void;
  isAuthenticated: () => boolean;
}

export const initialAuthContext: AuthContextType = {
  user: null,
  setUser: () => {},
  isLoading: true,
  login: () => {},
  logout: () => {},
  signup: () => {},
  isAuthenticated: () => false,
};

const permissions = ["pdfs:*", "quizzes:*"];

export const AuthContext = createContext<AuthContextType>(initialAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function login(token: string) {
    const decoded = jwtDecode<JwtPayload>(token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(decoded));
    setUser({
      id: decoded.user_id,
      name: "",
      email: decoded.email,
      permissions,
    });
  }

  function signup(userData: User) {
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  function isAuthenticated(): boolean {
    return user !== null;
  }

  useEffect(() => {
    (async () => {
      try {
        const user = localStorage.getItem("user");
        if (!user) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const userParsed = JSON.parse(user);
        setUser({
          id: userParsed.user_id,
          name: "",
          email: userParsed.email,
          permissions,
        });

        console.log("user from local storage", userParsed);
      } catch (error: any) {
        setUser(null);
        setIsLoading(false);
        console.error("Failed to fetch user from local storage", error);
        return;
      }

      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loading />

        {/* Loading Text */}
        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-700 animate-pulse">
            Getting things ready...
          </h3>
          <p className="text-sm text-yellow-600 mt-2">
            Our busy bee is preparing your workspace! 🍯
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        signup,
        isAuthenticated,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
