"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

// The User interface remains the same
interface User {
  id: string;
  username: string;
}

// The context type changes: we no longer manage the token directly
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>; // Login now performs the API call
  logout: () => Promise<void>; // Logout now performs an API call
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This function checks with the backend to see if we have a valid session cookie
  // if user has loggin, get user information, name and id
  // if user has not logged in or  cookie is not valid, set user to null
  // check the auth status with the backend server and get user information to display on frontend
  // get called when the user is logged in or first render (come back)
  const checkAuthStatus = useCallback(async () => {
    try {
      // Get all information about the user, campgrounds, and reviews, username...
      const response = await fetch("http://localhost:3002/api/profile/me", {
        credentials: "include", // IMPORTANT: This tells fetch to send cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser({ id: data.id, username: data.username });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Could not verify auth status", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On initial load, check the user's auth status
  useEffect(() => {
    console.log("checkAuthStatus is rendering...");
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const response = await fetch("http://localhost:3002/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include", // IMPORTANT: Needed for the backend to set the cookie
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Login failed");
        }

        // After successful login, check the auth status again to get user data
        await checkAuthStatus();
      } catch (error) {
        console.error("An error occurred during the login api call:", error);
        // Re-throw the error so the login page can display it
        throw error;
      }
    },
    [checkAuthStatus]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("http://localhost:3002/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isLoading,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
