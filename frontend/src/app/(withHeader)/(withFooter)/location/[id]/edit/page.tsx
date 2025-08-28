// In frontend/src/app/location/[id]/edit/page.tsx
"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Marker,
  MapRef,
  GeolocateControl,
  NavigationControl,
} from "react-map-gl/mapbox";
import { DeepBlueMapPin } from "@/components/icons/MapPin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-provider";
import { AddressSearch } from "@/components/components/AddressSearch";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";

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

  // State for all form fields
  const [name, setName] = useState("");
  const [pin, setPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");

  const debouncedLat = useDebounce(latInput, 500);
  const debouncedLng = useDebounce(lngInput, 500);

  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapRef>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `http://localhost:3002/api/reverse-geocode?longitude=${lng}&latitude=${lat}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setAddressQuery(data.place_name);
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    }
  };

  // Fetch the existing campground data on initial load
  useEffect(() => {
    async function fetchLocation() {
      try {
        const response = await fetch(
          `http://localhost:3002/api/locations/${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch location data.");
        const data: LocationData = await response.json();

        if (user && data.created_by_user_id !== user.id) {
          router.push(`/location/${id}`);
          return;
        }

        const [longitude, latitude] = data.coordinates.coordinates;

        // Populate all state variables
        setName(data.name);
        setPin({ latitude, longitude });
        setLatInput(latitude.toFixed(6));
        setLngInput(longitude.toFixed(6));

        // Also fetch the initial address
        reverseGeocode(longitude, latitude);
      } catch (err) {
        toast.error("Could not load campground data.");
      } finally {
        setLoading(false);
      }
    }
    if (id && user) {
      fetchLocation();
    }
  }, [id, user, router]);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = event.lngLat;
    setPin({ longitude: lng, latitude: lat });
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    reverseGeocode(lng, lat);
  };

  const handleAddressSelect = (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setPin(coords);
    setLatInput(coords.latitude.toFixed(6));
    setLngInput(coords.longitude.toFixed(6));
    mapRef.current?.flyTo({
      center: [coords.longitude, coords.latitude],
      zoom: 14,
    });
  };

  // Update map when debounced coordinates change
  useEffect(() => {
    const lat = parseFloat(debouncedLat);
    const lng = parseFloat(debouncedLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setPin({ latitude: lat, longitude: lng });
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });
      reverseGeocode(lng, lat);
    }
  }, [debouncedLat, debouncedLng]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pin) {
      toast.error("Please select a location on the map.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3002/api/locations/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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

      toast.success("Campground updated successfully!");
      router.push(`/location/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Oops! Something went wrong.");
    }
  };

  if (loading || isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] w-screen">
      <div className="w-full md:w-[450px] flex-shrink-0 bg-white dark:bg-gray-900 md:overflow-y-auto">
        <div className="w-full max-w-md mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Edit Campground</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Update the details for your campground below.
            </p>
          </div>
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
            <div className="grid gap-2">
              <Label>Address</Label>
              <AddressSearch
                query={addressQuery}
                setQuery={setAddressQuery}
                onSelect={handleAddressSelect}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
      <div className="relative w-full h-96 md:h-[calc(100vh-56px)] md:flex-1">
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
          projection="mercator"
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" />
          {pin && (
            <Marker longitude={pin.longitude} latitude={pin.latitude}>
              <DeepBlueMapPin className="h-10 w-10 hover:scale-110 transition-transform cursor-pointer drop-shadow-md" />
            </Marker>
          )}
        </Map>
      </div>
    </div>
  );
}
