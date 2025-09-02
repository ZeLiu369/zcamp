// In frontend/src/app/add/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Marker,
  MapRef,
  GeolocateControl,
  NavigationControl,
} from "react-map-gl/mapbox";
import { DeepBlueMapPin } from "@/components/icons/MapPin";
import { AddressSearch } from "@/components/components/AddressSearch";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";

interface NewPin {
  latitude: number;
  longitude: number;
}

export default function AddCampgroundPage() {
  const [name, setName] = useState("");
  const [newPin, setNewPin] = useState<NewPin | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");

  // Use debounce to prevent frequent map updates
  const debouncedLat = useDebounce(latInput, 500);
  const debouncedLng = useDebounce(lngInput, 500);

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef>(null);

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reverse-geocode?longitude=${lng}&latitude=${lat}`
      );
      const data = await response.json();
      if (response.ok) {
        setAddressQuery(data.place_name);
      } else {
        setAddressQuery("Address not found for these coordinates");
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
      setAddressQuery("Could not fetch address");
    }
  };

  const handleMapClick = async (event: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = event.lngLat;
    setNewPin({ longitude: lng, latitude: lat });

    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    reverseGeocode(lng, lat);

    // try {
    //   const response = await fetch(
    //     `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reverse-geocode?longitude=${lng}&latitude=${lat}`
    //   );
    //   const data = await response.json();
    //   if (response.ok) {
    //     // update the address search box text
    //     setAddressQuery(data.place_name);
    //   } else {
    //     setAddressQuery("Address not found");
    //   }
    // } catch (error) {
    //   console.error("Reverse geocoding failed", error);
    //   setAddressQuery("Could not fetch address");
    // }
  };

  const handleAddressSelect = (coords: NewPin) => {
    setNewPin(coords);
    setLatInput(coords.latitude.toFixed(6));
    setLngInput(coords.longitude.toFixed(6));
    // Fly the map to the selected location
    mapRef.current?.flyTo({
      center: [coords.longitude, coords.latitude],
      zoom: 14,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // check if the user has selected a location on the map
    if (!newPin) {
      toast.error("Please select a location on the map.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/locations`,
        {
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
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to add campground.");

      toast.success(`Successfully added "${data.name}"!`);
      setName("");
      setNewPin(null); // Clear pin after successful submission

      // 1. Get the ID of the newly created campground from the returned data
      const newLocationId = data.id;

      // 2. After a brief delay, use router to navigate to the new detail page
      setTimeout(() => {
        router.push(`/location/${newLocationId}`);
      }, 1500); // 1.5 second delay to let user see success message
    } catch (err: unknown) {
      toast.error("Oops! Something went wrong.");
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const lat = parseFloat(debouncedLat);
    const lng = parseFloat(debouncedLng);

    if (!isNaN(lat) && !isNaN(lng)) {
      setNewPin({ latitude: lat, longitude: lng });
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });
      reverseGeocode(lng, lat);
    }
  }, [debouncedLat, debouncedLng]);

  // ... All hooks and functions in your component remain unchanged ...

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    // 1. Main container:
    // - Mobile (default): Height is min-h-[...], meaning it can be pushed higher by content, allowing page scrolling.
    // - Desktop (md:): Height becomes fixed h-[...], content will be limited within this container.
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] w-screen">
      {/* 2. Left/top panel: Form area */}
      {/*
      - Mobile (default): Height adaptive, no longer needs scrollbar as it will push the main container down.
      - Desktop (md:): Since main container height is fixed, overflow-y-auto is needed here to handle content overflow.
    */}
      <div className="w-full md:w-[450px] flex-shrink-0 bg-white dark:bg-gray-900 md:overflow-y-auto">
        <div className="w-full max-w-md mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Add a New Campground</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Search for an address or click on the map to place a pin.
            </p>
          </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  placeholder="e.g., 47.564"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  placeholder="e.g., -52.709"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                />
              </div>
            </div>

            {/* Map is now removed from the form */}

            <Button type="submit" className="w-full">
              Add Campground
            </Button>
          </form>
        </div>
      </div>

      {/* 3. Right/bottom panel: Map area */}
      {/*
      - Mobile (default): Maintain fixed height of h-96.
      - Desktop (md:): Restore flex-grow and let height adapt.
    */}
      <div className="relative w-full h-96 md:h-[calc(100vh-56px)] md:flex-1">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: -98.5795,
            latitude: 50,
            zoom: 3,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick}
          projection="mercator"
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" />
          {newPin && (
            <Marker longitude={newPin.longitude} latitude={newPin.latitude}>
              <DeepBlueMapPin className="h-10 w-10 hover:scale-110 transition-transform cursor-pointer drop-shadow-md" />
            </Marker>
          )}
        </Map>
      </div>
    </div>
  );
}
