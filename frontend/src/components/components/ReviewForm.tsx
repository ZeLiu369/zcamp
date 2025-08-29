"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useAuth } from "@/context/auth-provider";

interface ReviewFormProps {
  locationId: string;
  onReviewSubmit: () => void; // A function to tell the parent page to refetch reviews
}

export function ReviewForm({ locationId, onReviewSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // We will add the handleSubmit logic in the next step
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!user) {
      setError("You must be logged in to submit a review.");
      return;
    }

    try {
      const response = await fetch(
        "${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rating, comment, locationId }),
          credentials: "include",
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      // Reset form and refetch reviews on the parent page
      setRating(0);
      setComment("");
      onReviewSubmit();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-semibold">Your Rating</label>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 cursor-pointer transition-colors ${
                (hoverRating || rating) >= star
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="comment" className="font-semibold">
          Your Review
        </label>
        <Textarea
          id="comment"
          placeholder="What did you think of this campground?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-2"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit">Submit Review</Button>
    </form>
  );
}
