// In frontend/src/app/location/[id]/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker } from "react-map-gl/mapbox";
import { Star, Trash2, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeepBlueMapPin } from "@/components/icons/MapPin";
import { ReviewForm } from "@/components/components/ReviewForm";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

// Define the types for the data we expect from our API
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
  user_id: string;
}

interface CampgroundImage {
  id: string;
  url: string;
  user_id: string;
}

interface LocationDetail {
  id: string;
  name: string;
  created_by_user_id: string | null;
  osm_tags: Record<string, string>;
  coordinates: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  reviews: Review[];
  images: CampgroundImage[];
}

export default function LocationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedRating, setEditedRating] = useState(0);
  const [editedComment, setEditedComment] = useState("");

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    fetchLocationDetail();
  }, [id]);

  async function fetchLocationDetail() {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/locations/${id}`);
      if (!response.ok) {
        throw new Error("Location not found");
      }
      const data: LocationDetail = await response.json();
      setLocation(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      alert("You must be logged in to delete a review.");
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete this review? It cannot be recovered! "
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:3002/api/reviews/${reviewId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to delete review.");

        // Refresh the location data to show the updated review list
        fetchLocationDetail();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      }
    }
  };
  const handleOpenEditDialog = (review: Review) => {
    setEditingReview(review);
    setEditedRating(review.rating);
    setEditedComment(review.comment || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !editingReview) return;

    try {
      const response = await fetch(
        `http://localhost:3002/api/reviews/${editingReview.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: editedRating,
            comment: editedComment,
          }),
          credentials: "include",
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update review.");

      setIsEditDialogOpen(false);
      fetchLocationDetail(); // Refresh data
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  const handleDeleteLocation = async () => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (
      confirm(
        "Are you sure you want to permanently delete this campground and all of its reviews? This action cannot be undone!"
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:3002/api/locations/${location?.id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to delete location.");

        alert("Campground deleted successfully.");
        router.push("/explore"); // Redirect to explore page after deletion
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;

      // --- 1. 定义最大文件数量 (Define the max file count) ---
      const maxFiles = 10;

      // --- 2. 检查文件总数 (Check the total file count) ---
      // It's best to check the count before checking individual file sizes.
      if (files.length > maxFiles) {
        toast.error(
          `You can only upload a maximum of ${maxFiles} photos at a time.`
        );
        e.target.value = ""; // Clear the invalid selection
        setSelectedFiles(null);
        return; // Stop the function
      }

      // --- 3. 检查每个文件的大小 (Check individual file sizes) ---
      // This part remains the same.
      const fiveMB = 5 * 1024 * 1024;
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > fiveMB) {
          toast.error(
            `File "${files[i].name}" is too large. Please select files smaller than 5MB.`
          );
          e.target.value = ""; // Clear the input
          setSelectedFiles(null);
          return;
        }
      }

      setSelectedFiles(files);
    }
  };

  const handleImageUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Please select files to upload.");
      return;
    }

    setUploading(true);
    const formData = new FormData();

    // Append all selected files to the FormData object
    // The key 'images' must match the one in upload.array('images', 5) on the backend
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("images", selectedFiles[i]);
    }

    try {
      const response = await fetch(
        `http://localhost:3002/api/locations/${id}/images`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to upload images.");

      setSelectedFiles(null);
      // This clears the file input visually for the user
      const fileInput = document.getElementById("picture") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchLocationDetail();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Upload failed: ${err.message}`);
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!user) {
      alert("You must be logged in to delete an image.");
      return;
    }

    if (confirm("Are you sure you want to delete this image?")) {
      try {
        const response = await fetch(
          `http://localhost:3002/api/images/${imageId}`,
          {
            method: "DELETE",
            credentials: "include", // Use this for cookie-based auth
          }
        );

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to delete image.");

        // Refresh the location data to show the updated image gallery
        fetchLocationDetail();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      }
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  if (!location) {
    return null;
  }

  const [longitude, latitude] = location.coordinates.coordinates;
  const isCreator = user && user.id === location.created_by_user_id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold">{location.name}</h1>
        {/* THE KEY CHANGE: Conditionally render the Delete button */}
        {isCreator && (
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/location/${location.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDeleteLocation}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Photos</h2>
        {location.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {location.images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt={`Photo of ${location.name}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {/* THE KEY CHANGE: Conditionally render the Delete button */}
                {user && user.id === img.user_id && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(img.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No photos yet. Be the first to add one!
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* --- 左侧主内容区 (2/3 宽度) --- */}
        <div className="md:col-span-2 space-y-8">
          {/* 地图卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full rounded-md overflow-hidden border">
                <Map
                  mapboxAccessToken={mapboxToken}
                  initialViewState={{ longitude, latitude, zoom: 13 }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  scrollZoom={false}
                >
                  <Marker
                    longitude={longitude}
                    latitude={latitude}
                    anchor="bottom"
                  >
                    <DeepBlueMapPin className="h-10 w-10 hover:scale-110 transition-transform cursor-pointer drop-shadow-md" />
                  </Marker>
                </Map>
              </div>
            </CardContent>
          </Card>

          {/* upload image section */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Upload a Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleImageUpload}
                  className="flex items-center gap-4"
                >
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="picture">Pictures</Label>
                    {/* Add the 'multiple' attribute to the input */}
                    <Input
                      id="picture"
                      type="file"
                      onChange={handleFileSelect}
                      multiple
                    />
                  </div>
                  <Button type="submit" disabled={uploading || !selectedFiles}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* "写评论" 卡片 (现在移到了左侧) */}
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  locationId={location.id}
                  onReviewSubmit={fetchLocationDetail}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  You must be{" "}
                  <Link href="/login" className="underline font-semibold">
                    logged in
                  </Link>{" "}
                  to write a review.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* --- 右侧评论区 (1/3 宽度) --- */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {location.reviews.length > 0 ? (
                <ul className="space-y-4">
                  {location.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="border-b last:border-b-0 pb-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{review.username}</p>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {user && user.id === review.user_id && (
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditDialog(review)}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {review.comment}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 编辑评论的弹窗 (Dialog) - 放在主布局的末尾通常更清晰 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
            <DialogDescription>
              Make changes to your rating and comment below. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateReview} className="space-y-4 py-4">
            <div>
              <label className="font-semibold">Your Rating</label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer transition-colors ${
                      editedRating >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    onClick={() => setEditedRating(star)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="editedComment" className="font-semibold">
                Your Review
              </label>
              <Textarea
                id="editedComment"
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
