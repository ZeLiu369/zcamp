"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { NavigationControl, GeolocateControl } from "react-map-gl/mapbox";

export default function ExplorePage() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

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
          </Map>
        </div>
      </div>
    </div>
  );
}
