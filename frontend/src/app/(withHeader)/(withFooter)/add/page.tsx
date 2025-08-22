// In frontend/src/app/add/page.tsx
"use client";

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
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, MapRef } from "react-map-gl/mapbox";
import { DeepBlueMapPin } from "@/components/icons/MapPin";
import { AddressSearch } from "@/components/components/AddressSearch";

interface NewPin {
  latitude: number;
  longitude: number;
}

export default function AddCampgroundPage() {
  const [name, setName] = useState("");
  const [newPin, setNewPin] = useState<NewPin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [addressQuery, setAddressQuery] = useState("");

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleAddressSelect = (coords: NewPin) => {
    setNewPin(coords);
    // Fly the map to the selected location
    mapRef.current?.flyTo({
      center: [coords.longitude, coords.latitude],
      zoom: 14,
    });
  };

  const handleMapClick = async (event: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = event.lngLat;
    setNewPin({ longitude: lng, latitude: lat });

    try {
      const response = await fetch(
        `http://localhost:3002/api/reverse-geocode?longitude=${lng}&latitude=${lat}`
      );
      const data = await response.json();
      if (response.ok) {
        // update the address search box text
        setAddressQuery(data.place_name);
      } else {
        setAddressQuery("Address not found");
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
      setAddressQuery("Could not fetch address");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // check if the user has selected a location on the map
    if (!newPin) {
      setError("Please select a location on the map.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3002/api/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          latitude: newPin.latitude,
          longitude: newPin.longitude,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to add campground.");

      setSuccess(`Successfully added ${data.name}!`);
      setName("");
      setNewPin(null); // 提交成功后清空图钉
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-gray-100 dark:bg-gray-950 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Add a New Campground</CardTitle>
          <CardDescription>
            Search for an address or click on the map to place a pin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Campground Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Butter Pot Provincial Park"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <AddressSearch
                query={addressQuery}
                setQuery={setAddressQuery}
                onSelect={handleAddressSelect}
              />
            </div>

            {/* 交互式地图 */}
            <div className="h-96 w-full rounded-md overflow-hidden border">
              <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                  longitude: -98.5795,
                  latitude: 50,
                  zoom: 3,
                }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                onClick={handleMapClick} // 现在这个函数会调用 API
              >
                {newPin && (
                  <Marker
                    longitude={newPin.longitude}
                    latitude={newPin.latitude}
                  >
                    <DeepBlueMapPin className="h-10 w-10 hover:scale-110 transition-transform cursor-pointer drop-shadow-md" />
                  </Marker>
                )}
              </Map>
            </div>

            <Button type="submit" className="w-full">
              Add Campground
            </Button>
            {success && (
              <p className="text-sm text-green-500 text-center">{success}</p>
            )}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
