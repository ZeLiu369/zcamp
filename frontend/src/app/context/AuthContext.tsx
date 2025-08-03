"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode"; // We need a library to decode the token

// Define the shape of the user object we get from the JWT
interface User {
  id: string;
  username: string;
}

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial load

  useEffect(() => {
    // On initial load, check if a token exists in localStorage
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      try {
        const decoded = jwtDecode<{ user: User }>(storedToken); // Decode the token payload, the payload expected to have a property that key is "user", value type is "User" (if not, it will throw an error during runtime)
        console.log("Decoded token:", decoded);
        setUser(decoded.user);
        setToken(storedToken);
      } catch (error) {
        console.error("Invalid token found, removing.", error);
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false); // Finished loading
  }, []);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<{ user: User }>(newToken);
      console.log("New Decoded token:", decoded);
      localStorage.setItem("authToken", newToken);
      setUser(decoded.user);
      setToken(newToken);
    } catch (error) {
      console.error("Failed to decode token on login", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setToken(null);
  };

  const value = { user, token, login, logout, isLoading };

  // value is context, shared data
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a custom hook to easily use the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
