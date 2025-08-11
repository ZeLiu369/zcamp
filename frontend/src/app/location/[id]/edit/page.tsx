"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, MapRef } from "react-map-gl/mapbox";
import { DeepBlueMapPin } from "@/components/icons/MapPin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/context/AuthContext";

interface LocationData {
  name: string;
  coordinates: {
    type: "Point";
    coordinates: [number, number];
  };
  created_by_user_id: string;
}

export default function EditCampgroundPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [pin, setPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapRef>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Fetch the existing campground data
  useEffect(() => {
    async function fetchLocation() {
      try {
        const response = await fetch(
          `http://localhost:3002/api/locations/${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch location data.");
        const data: LocationData = await response.json();

        // Security check: ensure the editor is the creator
        if (user && data.created_by_user_id !== user.id) {
          router.push(`/location/${id}`); // Redirect if not the owner
          return;
        }

        setName(data.name);
        const [longitude, latitude] = data.coordinates.coordinates;
        setPin({ latitude, longitude });
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
    if (id && user) {
      // Only fetch if we have an ID and a logged-in user
      fetchLocation();
    }
  }, [id, user, router]);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      void router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = event.lngLat;
    setPin({ longitude: lng, latitude: lat });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pin) {
      setError("Please select a location on the map.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3002/api/locations/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            latitude: pin.latitude,
            longitude: pin.longitude,
          }),
          credentials: "include",
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update.");

      router.push(`/location/${id}`); // Redirect back to the detail page on success
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  if (loading || isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Campground</CardTitle>
          <CardDescription>
            Update the details for your campground below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Campground Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="h-96 w-full rounded-md overflow-hidden border">
              <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                  longitude: pin?.longitude || -98,
                  latitude: pin?.latitude || 50,
                  zoom: pin ? 13 : 3,
                }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                onClick={handleMapClick}
              >
                {pin && (
                  <Marker
                    longitude={pin.longitude}
                    latitude={pin.latitude}
                    anchor="bottom"
                  >
                    <DeepBlueMapPin className="h-10 w-10 hover:scale-110 transition-transform cursor-pointer drop-shadow-md" />
                  </Marker>
                )}
              </Map>
            </div>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
