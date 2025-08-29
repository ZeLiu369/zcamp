"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

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
            "${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/me",
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
    </div>
  );
}
