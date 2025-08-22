// In frontend/src/components/ImageGallery.tsx
"use client";

import { useState, useRef } from "react";
import Lightbox, { ThumbnailsRef } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/context/auth-provider";
import Image from "next/image";

interface CampgroundImage {
  id: string;
  url: string;
  user_id: string;
}

interface ImageGalleryProps {
  images: CampgroundImage[];
  onDelete: (imageId: string) => void; // Pass the delete handler down
}

export function ImageGallery({ images, onDelete }: ImageGalleryProps) {
  const [index, setIndex] = useState(-1);
  const { user } = useAuth();
  const thumbnailsRef = useRef<ThumbnailsRef>(null);

  // Format the images for the lightbox
  const slides = images.map((img) => ({ src: img.url }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Photos</h2>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative w-full h-48 rounded-lg overflow-hidden group cursor-pointer"
            >
              <Image
                src={img.url}
                alt={`Photo of campground}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                priority={true}
                onClick={() => setIndex(i)}
              />
              {user && user.id === img.user_id && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(img.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No photos yet. Be the first to add one!</p>
      )}

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Thumbnails, Zoom]} // Enable thumbnails and zoom plugins
        thumbnails={{ ref: thumbnailsRef, showToggle: true }}
      />
    </div>
  );
}
