"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import Image from "next/image";

interface CampgroundImage {
  id: string;
  url: string;
}

interface ImagePreviewProps {
  images: CampgroundImage[];
  locationId: string;
}

export function ImagePreview({ images, locationId }: ImagePreviewProps) {
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
        <p className="text-gray-500">No photos yet.</p>
      </div>
    );
  }

  const previewImages = images.slice(0, 3);
  const mainImage = previewImages.length > 0 ? previewImages.at(0) : null;
  const smallImages = previewImages.slice(1, 3);

  return (
    // Modification 1: Container defaults to regular div, only applies grid layout on md screens and above
    <div className="relative h-96 rounded-xl overflow-hidden md:grid md:grid-cols-5 md:gap-2">
      {/* Left: Main image */}
      {mainImage && (
        // Modification 2: On md screens and above, this container occupies 3 columns
        <div className="w-full h-full md:col-span-3 md:row-span-2 relative md:rounded-xl">
          <Image
            src={mainImage.url}
            alt="Main campground"
            fill
            className="object-cover rounded-xl md:rounded-xl" // Also have rounded corners on mobile
            priority={true}
            sizes="(max-width: 768px) 100vw, 60vw" // This logic is correct
          />
        </div>
      )}

      {/* Right: Small images */}
      {/* Modification 3: This container is hidden by default on mobile (hidden), only displays as grid (md:grid) on md screens and above */}
      <div className="hidden md:grid col-span-2 row-span-2 grid-rows-2 gap-2">
        {smallImages.map((img, index) => (
          <div key={img.id} className="relative overflow-hidden rounded-xl">
            <Image
              src={img.url}
              alt={`Campground thumbnail ${index + 1}`}
              fill
              className="object-cover" // object-cover in className is sufficient
              priority={true}
              // Modification 4: Add sizes attribute for small images too, improve performance
              // On desktop, they occupy 2/5 of the width, i.e. 40vw
              sizes="(max-width: 768px) 0px, 40vw"
            />
          </div>
        ))}
        {smallImages.length < 2 && <div />}
      </div>

      {/* "Show all photos" button */}
      {/* Modification 5: Move button to bottom right corner, this is a more common UI pattern on both mobile and desktop */}
      <div className="absolute bottom-4 right-4">
        <Button asChild>
          <Link href={`/location/${locationId}/photos`}>
            <Camera className="mr-2 h-4 w-4" /> Show all photos
          </Link>
        </Button>
      </div>
    </div>
  );
}
