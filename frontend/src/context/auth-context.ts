"use client";

import { createContext } from 'react';

// You can move your type definition here too for better organization
export interface AuthContextType {
  user: { id: string; username: string } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create and export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);