"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

// Define the types for the profile data
interface CreatedLocation {
  id: string;
  name: string;
}

interface UserReview {
  id: string;
  rating: number;
  comment: string;
  location_id: string;
}

interface ProfileData {
  username: string;
  email: string;
  created_at: string;
  created_locations: CreatedLocation[];
  user_reviews: UserReview[];
}

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");

  const handleDeleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) {
      toast.error("Password is required to delete your account.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/me`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to delete account.");

      toast.success("Account deleted successfully.");
      logout(); // Clear auth state from context
      router.push("/"); // Redirect to homepage
    } catch (error) {
      toast.error("Oops! Something went wrong.");
      console.log(error);
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      async function fetchProfile() {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/me`,
            {
              credentials: "include",
            }
          );
          if (!response.ok) throw new Error("Failed to fetch profile.");
          const data = await response.json();
          setProfileData(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
      fetchProfile();
    }
  }, [user]);

  if (isLoading || loading) {
    return <div className="text-center p-10">Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="text-center p-10">Could not load profile data.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Profile</h1>
      <p className="text-lg text-gray-600 mb-8">
        Welcome, {profileData.username}!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>My Campgrounds</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData.created_locations.length > 0 ? (
              <ul className="space-y-2">
                {profileData.created_locations.map((loc) => (
                  <li key={loc.id}>
                    <Link
                      href={`/location/${loc.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {loc.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven&apos;t added any campgrounds yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData.user_reviews.length > 0 ? (
              <ul className="space-y-2">
                {profileData.user_reviews.map((review) => (
                  <li key={review.id} className="text-sm">
                    <p>
                      <strong>Rating: {review.rating}/5</strong>
                    </p>
                    <p className="text-gray-700">{review.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven&apos;t written any reviews yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 max-w-lg">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Deleting your account is a permanent action and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete My Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <form onSubmit={handleDeleteAccount}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent. All of your reviews and uploaded
                      images will be deleted. To confirm, please type your
                      password.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="password-confirm">Password</Label>
                    <Input
                      id="password-confirm"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPassword("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction type="submit">
                      Permanently Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
