// In frontend/src/app/signup/page.tsx
"use client";

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
import { useRouter } from "next/navigation"; // Import the router for redirection
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  // Step 1: Create state variables to hold the form data and any messages
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter(); // Initialize the router
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Create a function to handle the form submission
  const handleSubmit = async (event: FormEvent) => {
    // Prevent the default browser behavior of refreshing the page
    event.preventDefault();
    setError(null); // Reset errors on new submission
    setSuccess(null);

    try {
      // Step 3: Send the form data to your backend API
      const response = await fetch(
        "${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email, password }),
        }
      );

      const data = await response.json();

      // Step 4: Handle the response from the server
      if (!response.ok) {
        // If the server returns an error (e.g., 409 Conflict), display it
        throw new Error(data.error || "Something went wrong");
      }

      // On success:
      setSuccess("Registration successful! Redirecting to login...");
      // Redirect to the login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Connect the handleSubmit function to the form's onSubmit event */}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              {/* Connect the input to the state using `value` and `onChange` */}
              <Input
                id="username"
                type="text"
                placeholder="Your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
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
            <div className="grid gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button" // Important: type="button" prevents form submission
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[28px] h-5 w-5 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <Button type="submit" className="w-full">
              Create an account
            </Button>

            {/* Display success or error messages to the user */}
            {success && (
              <p className="text-sm text-green-500 text-center">{success}</p>
            )}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
