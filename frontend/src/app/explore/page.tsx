"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl/mapbox";
import { Compass } from "lucide-react";
import { useEffect, useState } from "react";

// Define a type for our location data for TypeScript safety
type Location = {
  id: string;
  name: string;
  coords: string; // e.g., "POINT(-98.5795 39.8283)"
};

// A simple utility function to parse the coords string
function parseCoords(
  coords: string
): { longitude: number; latitude: number } | null {
  const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(coords);
  if (!match) return null;
  return {
    longitude: parseFloat(match[1]),
    latitude: parseFloat(match[2]),
  };
}

export default function ExplorePage() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch("http://localhost:3002/api/locations");
        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }
        const data: Location[] = await response.json();
        setLocations(data);
        console.log(`Fetched ${data.length} locations.`);
      } catch (error) {
        console.error(error);
      }
    }

    fetchLocations();
  }, []); // The empty array [] ensures this effect runs only once

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500 font-bold">
          Error: Mapbox access token is not configured. Please check your
          .env.local file.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Explore All Campgrounds
        </h1>
        <div className="max-w-full mx-auto h-[60vh] border border-gray-300 rounded-xl overflow-hidden shadow-xl">
          <Map
            mapboxAccessToken={mapboxToken}
            initialViewState={{
              longitude: -98.5795,
              latitude: 39.8283,
              zoom: 3,
            }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            projection="mercator"
          >
            <NavigationControl position="top-right" />
            <GeolocateControl />

            {/* Step 2: Loop over the fetched data and create a Marker for each location */}
            {locations.map((loc) => {
              const coords = parseCoords(loc.coords);
              if (!coords) return null;

              return (
                <Marker
                  key={loc.id}
                  longitude={coords.longitude}
                  latitude={coords.latitude}
                  anchor="bottom"
                >
                  {/* This is the visual pin on the map. We use a simple icon for now. */}
                  <Compass className="h-6 w-6 text-blue-600 cursor-pointer" />
                </Marker>
              );
            })}
          </Map>
        </div>
      </div>
    </div>
  );
}
