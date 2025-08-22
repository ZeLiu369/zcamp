// In frontend/src/app/location/[id]/photos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { ImageGallery } from "@/components/components/ImageGallery";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Re-using the same interfaces from the detail page
interface CampgroundImage {
  id: string;
  url: string;
  user_id: string;
}
interface LocationData {
  id: string;
  name: string;
  images: CampgroundImage[];
}

export default function PhotosPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocationData = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/locations/${id}`);
      if (!response.ok) throw new Error("Failed to fetch location data.");
      const data = await response.json();
      setLocation(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLocationData();
    }
  }, [id]);

  const handleDeleteImage = async (imageId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this image?")) {
      await fetch(`http://localhost:3002/api/images/${imageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchLocationData(); // Refetch after deletion
    }
  };

  if (loading) return <div className="text-center p-10">Loading photos...</div>;
  if (!location)
    return <div className="text-center p-10">Could not load photos.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/location/${id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold mb-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Campground Details
      </Link>
      <h1 className="text-3xl font-bold mb-6">Photos of {location.name}</h1>
      <ImageGallery images={location.images} onDelete={handleDeleteImage} />
    </div>
  );
}
