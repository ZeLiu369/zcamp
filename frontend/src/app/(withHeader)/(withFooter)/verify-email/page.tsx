// In frontend/src/app/verify-email/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

function VerificationComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your link.");
      return;
    }

    async function verifyToken() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Verification failed.");

        setStatus("success");
        setMessage(data.message);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "An unknown error occurred."
        );
      }
      setTimeout(() => router.push("/login"), 3000);
    }
    verifyToken();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            Please wait while we verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && <p>{message}</p>}
          {status === "success" && (
            <div className="flex flex-col items-center gap-2 text-green-600">
              <CheckCircle2 className="h-12 w-12" />
              <p className="font-semibold">{message}</p>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-2 text-red-600">
              <XCircle className="h-12 w-12" />
              <p className="font-semibold">{message}</p>
            </div>
          )}
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Next.js requires Suspense for pages that use useSearchParams
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <VerificationComponent />
    </Suspense>
  );
}
