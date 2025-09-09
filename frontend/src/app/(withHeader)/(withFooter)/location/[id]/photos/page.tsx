// In frontend/src/app/location/[id]/photos/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { ImageGallery } from "@/components/components/ImageGallery";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

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

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const fetchLocationData = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${baseUrl}/api/locations/${encodeURIComponent(id)}`,
          {
            credentials: "include",
            signal,
          }
        );
        if (!res.ok)
          throw new Error(`Failed to fetch location data: ${res.status}`);
        const data: LocationData = await res.json();
        setLocation(data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error(error);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id, baseUrl]
  );

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetchLocationData(controller.signal);
    return () => controller.abort();
  }, [id, fetchLocationData]);

  const handleDeleteImage = async (imageId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(
        `${baseUrl}/api/images/${encodeURIComponent(imageId)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchLocationData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete image.");
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
