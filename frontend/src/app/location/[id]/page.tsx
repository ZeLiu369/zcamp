// In frontend/src/app/location/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker } from "react-map-gl/mapbox";
import { MapPin, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the types for the data we expect from our API
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
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

  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!id) return;

    async function fetchLocationDetail() {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3002/api/locations/${id}`
        );
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
        <div className="md:col-span-2">
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
                  scrollZoom={false} // Disable scroll zoom on the small map
                >
                  <Marker longitude={longitude} latitude={latitude}>
                    <MapPin className="h-8 w-8 text-blue-800 fill-blue-500" />
                  </Marker>
                </Map>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {location.reviews.length > 0 ? (
                <ul>
                  {location.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="border-b last:border-b-0 py-2"
                    >
                      <p className="font-semibold">{review.username}</p>
                      <p className="text-sm text-gray-600">{review.comment}</p>
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
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">
                  No reviews yet. Be the first to write one!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
