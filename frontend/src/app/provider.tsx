// In frontend/src/app/providers.tsx
"use client";

import { AuthProvider } from "@/context/auth-provider";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthProvider>
      <Toaster />
      {children}
    </AuthProvider>
  );
}
