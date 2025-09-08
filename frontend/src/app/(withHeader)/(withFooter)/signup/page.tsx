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
import toast from "react-hot-toast";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { XIcon } from "@/components/icons/XIcon";

export default function SignUpPage() {
  // Step 1: Create state variables to hold the form data and any messages
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); // Initialize the router
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 2: Create a function to handle the form submission
  const handleSubmit = async (event: FormEvent) => {
    // Prevent the default browser behavior of refreshing the page
    event.preventDefault();
    setIsLoading(true);

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setIsLoading(false); // Stop the submission process
      return; // Exit the function
    }

    if (password.length > 20) {
      toast.error("Password must be less than 20 characters long.");
      setIsLoading(false); // Stop the submission process
      return; // Exit the function
    }

    try {
      // Step 3: Send the form data to your backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
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
      toast.success(
        "Registration successful! Please check your email for verification."
      );
      // Redirect to the login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
      console.error(error);
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
                autoComplete="username"
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
                disabled={isLoading}
                autoComplete="username"
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
                disabled={isLoading}
                autoComplete="current-password"
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create an account"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground dark:bg-black">
                Or continue with
              </span>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full">
            <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Sign in with Google
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/twitter`}
            >
              <XIcon className="mr-2 h-4 w-4" />
              Sign in with X
            </a>
          </Button>
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
