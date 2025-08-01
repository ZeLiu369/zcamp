"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  MapRef,
} from "react-map-gl/mapbox";
import { useEffect, useState, useMemo, useRef } from "react";
import useSupercluster from "use-supercluster";

// Define a type for our location data for TypeScript safety
type Location = {
  id: string;
  name: string;
  coords: string; // e.g., "POINT(-98.5795 39.8283)"
};

// Define the structure for a GeoJSON point, which supercluster needs
type GeoJsonPoint = {
  type: "Feature";
  properties: {
    cluster: boolean;
    locationId: string;
    name: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

// A simple utility function to parse the coords string
function parseCoords(coords: string): [number, number] | null {
  const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(coords);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2])]; // [longitude, latitude]
}

function getClusterSizeClasses(pointCount: number): string {
  if (pointCount < 10) {
    return "w-8 h-8 text-sm"; // Small
  }
  if (pointCount < 100) {
    return "w-10 h-10 text-base"; // Medium
  }
  return "w-12 h-12 text-lg"; // Large
}

export default function ExplorePage() {
  const mapRef = useRef<MapRef>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [bounds, setBounds] = useState<
    [number, number, number, number] | undefined
  >(undefined);
  const [zoom, setZoom] = useState(3);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/locations`;
        console.log(`Fetching from: ${apiUrl}`);
        const response = await fetch(apiUrl);
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

  const points = useMemo(
    () =>
      locations
        .map((loc) => {
          const coords = parseCoords(loc.coords);
          if (!coords) return null;
          return {
            type: "Feature",
            properties: { cluster: false, locationId: loc.id, name: loc.name },
            geometry: { type: "Point", coordinates: coords },
          };
        })
        .filter((point): point is GeoJsonPoint => point !== null),
    [locations]
  );

  const updateMapState = () => {
    // Use optional chaining `?.` for safety in case the ref isn't ready
    const map = mapRef.current?.getMap();
    if (!map) return;

    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    // FIX: Manually construct the array to match the tuple type
    setBounds([
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth(),
    ]);
    setZoom(map.getZoom());
  };

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 40, maxZoom: 16 },
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500 font-bold">
          Error: Mapbox access token is not configured. Please check your
          .env file.
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
            ref={mapRef}
            mapboxAccessToken={mapboxToken}
            initialViewState={{ longitude: -98.5795, latitude: 50, zoom: 3 }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            projection="mercator"
            onMoveEnd={updateMapState}
            onLoad={updateMapState}
          >
            <NavigationControl />
            <GeolocateControl />

            {clusters.map((cluster) => {
              const [longitude, latitude] = cluster.geometry.coordinates;

              // If it's a cluster, display the cluster circle
              if ("point_count" in cluster.properties) {
                const pointCount = cluster.properties.point_count;

                const sizeClasses = getClusterSizeClasses(pointCount);

                return (
                  <Marker
                    key={`cluster-${cluster.id}`}
                    latitude={latitude}
                    longitude={longitude}
                  >
                    <button
                      type="button" // Good practice to specify the type
                      className={`bg-blue-500 text-white outline-4 font-bold rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-out ${sizeClasses}`}
                      // className="w-8 h-8 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (!supercluster || !cluster.id || !mapRef.current) {
                          return; // Exit if anything is missing
                        }

                        const expansionZoom = Math.min(
                          // FIX: Convert cluster.id to a number to match the expected type.
                          supercluster.getClusterExpansionZoom(
                            Number(cluster.id)
                          ),
                          20
                        );

                        if (mapRef.current) {
                          // Add a safety check for the ref
                          mapRef.current.getMap().easeTo({
                            center: [longitude, latitude],
                            zoom: expansionZoom,
                            duration: 500,
                          });
                        }
                      }}
                    >
                      {pointCount}
                    </button>
                  </Marker>
                );
              }

              // If it's a single point, display the original marker
              return (
                <Marker
                  key={`location-${cluster.properties.locationId}`}
                  latitude={latitude}
                  longitude={longitude}
                >
                  <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer" />
                </Marker>
              );
            })}
          </Map>
        </div>
      </div>
    </div>
  );
}
