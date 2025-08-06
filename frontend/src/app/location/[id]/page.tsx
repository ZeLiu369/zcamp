// In frontend/src/app/location/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker } from "react-map-gl/mapbox";
import { Star, Trash2, Pencil } from "lucide-react";
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

// Define the types for the data we expect from our API
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
  user_id: string;
}

interface LocationDetail {
  id: string;
  name: string;
  osm_tags: any;
  coordinates: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  reviews: Review[];
}

export default function LocationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, token } = useAuth();

  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedRating, setEditedRating] = useState(0);
  const [editedComment, setEditedComment] = useState("");

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  async function fetchLocationDetail() {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/locations/${id}`);
      if (!response.ok) {
        throw new Error("Location not found");
      }
      const data: LocationDetail = await response.json();
      setLocation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!token) {
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to delete review.");

        // Refresh the location data to show the updated review list
        fetchLocationDetail();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
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
    if (!token || !editingReview) return;

    try {
      const response = await fetch(
        `http://localhost:3002/api/reviews/${editingReview.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: editedRating,
            comment: editedComment,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update review.");

      setIsEditDialogOpen(false);
      fetchLocationDetail(); // Refresh data
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchLocationDetail();
  }, [id]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{location.name}</h1>

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
