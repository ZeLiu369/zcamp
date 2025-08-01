// In frontend/src/app/login/page.tsx
"use client"; // 表单需要客户端交互

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  // 为表单字段和消息创建 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 处理表单提交的函数
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      // Step 1: Send the form data to your backend login endpoint
      const response = await fetch("http://localhost:3002/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      // Step 2: On success, get the token from the response
      const { token } = data;
      if (token) {
        // Step 3: Store the token in the browser's localStorage
        localStorage.setItem("authToken", token);
        console.log("Login successful, token stored.");

        // Step 4: Redirect the user to the homepage
        router.push("/");
      } else {
        throw new Error("No token received from server.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm underline"
                prefetch={false}
              >
                Forgot your password?
              </Link>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>

            {/* 显示错误信息 */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
