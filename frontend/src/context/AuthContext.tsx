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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  isLoading: boolean;
  login: (userData: UserResource, role: UserRole) => void;
  logout: () => void;
  signup: (userData: User) => void;
  isAuthenticated: () => boolean;
}

const rolePermissions: Record<UserRole, string[]> = {
  admin: ["profiles:*"],
  candidate: [""],
  recruiter: ["profiles:*"],
  superAdmin: ["users:*"],
  acc_manager: ["companies:*"],
};

export const initialAuthContext: AuthContextType = {
  user: null,
  setUser: () => {},
  isLoading: true,
  login: () => {},
  logout: () => {},
  signup: () => {},
  isAuthenticated: () => false,
};

export const AuthContext = createContext<AuthContextType>(initialAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function login(userData: UserResource, role: UserRole) {
    const user: User = {
      id: userData.id,
      name: userData.attributes.name,
      email: userData.attributes.email,
      role: role,
      permissions: rolePermissions[role] || [],
    };
    setUser(user);
  }

  function signup(userData: User) {
    setUser(userData);
  }

  function logout() {
    setUser(null);
  }

  function isAuthenticated(): boolean {
    return user !== null;
  }

  useEffect(() => {
    (async () => {
      let user: UserResource;
      try {
        user = await profileApi.getProfie();
        // TODO: Remove this delay in production
        await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate loading delay
        setUser({
          id: user.id,
          name: user.attributes.name,
          email: user.attributes.email,
          role: user.attributes.role,
          permissions: rolePermissions[user.attributes.role] || [],
        });
      } catch (error: any) {
        if (error.status === 401) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        console.error("Failed to fetch user profile:", error);
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
