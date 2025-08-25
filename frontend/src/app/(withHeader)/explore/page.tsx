"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  MapRef,
  Popup,
} from "react-map-gl/mapbox";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import useSupercluster from "use-supercluster";
import { Star } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Define a type for our location data for TypeScript safety
type Location = {
  id: string;
  name: string;
  coords: string;
  avg_rating: string | null; // The average rating can be null
  image_url: string | null; // The image URL can be null
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
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const [locations, setLocations] = useState<Location[]>([]);
  const [bounds, setBounds] = useState<
    [number, number, number, number] | undefined
  >(undefined);
  const [zoom, setZoom] = useState(3);

  const [popupInfo, setPopupInfo] = useState<Location | null>(null);
  const hidePopupTimer = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialLng = searchParams.get("lng")
    ? Number(searchParams.get("lng"))
    : -98.5795;
  const initialLat = searchParams.get("lat")
    ? Number(searchParams.get("lat"))
    : 50;
  const initialZoom = searchParams.get("zoom")
    ? Number(searchParams.get("zoom"))
    : 3;

  const [viewport, setViewport] = useState({
    longitude: initialLng,
    latitude: initialLat,
    zoom: initialZoom,
  });

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

  useEffect(() => {
    const lng = searchParams.get("lng");
    const lat = searchParams.get("lat");
    const zoom = searchParams.get("zoom");

    if (lng && lat && zoom && mapRef.current) {
      // 如果 URL 中有坐标，就命令地图飞过去
      mapRef.current.flyTo({
        center: [Number(lng), Number(lat)],
        zoom: Number(zoom),
        duration: 2000, // 飞行动画持续时间（毫秒）
      });
    }
  }, [searchParams]); // 依赖项是 searchParams

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

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 40, maxZoom: 16 },
  });

  const handleMoveEnd = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    const { lng, lat } = map.getCenter();
    const newZoom = map.getZoom();

    // 使用 replace 而不是 push，这样不会在浏览器历史中产生一大堆记录
    const newUrl = `${pathname}?lng=${lng.toFixed(4)}&lat=${lat.toFixed(
      4
    )}&zoom=${newZoom.toFixed(2)}`;
    router.replace(newUrl, { scroll: false });

    // 更新边界以获取新数据
    setBounds([
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth(),
    ]);

    setViewport({ longitude: lng, latitude: lat, zoom: newZoom });
  };

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

  // after mouse move outside the popup, after 200ms, the popup will be hidden
  const handleMouseEnterMarker = (location: Location) => {
    // If there's a timer to hide the popup, cancel it
    if (hidePopupTimer.current) {
      clearTimeout(hidePopupTimer.current);
    }
    // Show the popup for the hovered marker
    setPopupInfo(location);
  };

  const handleMouseLeaveMarker = () => {
    // When the mouse leaves the marker, schedule the popup to hide after a short delay (e.g., 200ms)
    hidePopupTimer.current = setTimeout(() => {
      setPopupInfo(null);
    }, 200);
  };

  const handleMouseEnterPopup = () => {
    // If the mouse enters the popup, it means the user is interacting with it,
    // so we must cancel any scheduled "hide" action.
    if (hidePopupTimer.current) {
      clearTimeout(hidePopupTimer.current);
    }
  };

  const handleMouseLeavePopup = () => {
    // When the mouse leaves the popup, we hide it immediately.
    setPopupInfo(null);
  };

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500 font-bold">
          Error: Mapbox access token is not configured. Please check your .env
          file.
        </p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      {/* <div className="container"> */}
      {/* <h1 className="absolute top-5 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md text-2xl font-bold">
        Explore All Campgrounds
      </h1> */}

      {/* <div className="max-w-full mx-auto h-[100vh] border border-gray-300 rounded-xl overflow-hidden shadow-xl"> */}
      <div className="w-full h-full relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={viewport}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          projection="mercator"
          //onMoveEnd={updateMapState}
          onMoveEnd={handleMoveEnd}
          onLoad={updateMapState}
        >
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" />

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

            const locationData = locations.find(
              (loc) => loc.id === cluster.properties.locationId
            );

            // If it's a single point, display the original marker
            return (
              <Marker
                key={`location-${cluster.properties.locationId}`}
                latitude={latitude}
                longitude={longitude}
              >
                <Link
                  href={`/location/${cluster.properties.locationId}`}
                  className="inline-block h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-md
             focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  onMouseEnter={() =>
                    locationData && handleMouseEnterMarker(locationData)
                  }
                  onMouseLeave={handleMouseLeaveMarker}
                  onFocus={() => locationData && setPopupInfo(locationData)}
                  onBlur={() => setPopupInfo(null)}
                />
              </Marker>
            );
          })}

          {popupInfo && (
            <Popup
              longitude={parseCoords(popupInfo.coords)![0]}
              latitude={parseCoords(popupInfo.coords)![1]}
              onClose={() => setPopupInfo(null)}
              closeOnClick={false}
              anchor="bottom"
              offset={10}
              maxWidth="320px"
              closeButton={false}
            >
              <div
                role="tooltip"
                onMouseEnter={handleMouseEnterPopup}
                onMouseLeave={handleMouseLeavePopup}
              >
                <div className="flex gap-4">
                  {/* Left side: Image */}
                  <div className="w-24 flex-shrink-0 relative overflow-hidden rounded">
                    {popupInfo.image_url ? (
                      <Image
                        src={popupInfo.image_url}
                        alt={popupInfo.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Right side: Details */}
                  <div className="flex flex-col">
                    <h3 className="font-bold text-md mb-1">{popupInfo.name}</h3>
                    <div className="flex items-center mb-2">
                      {popupInfo.avg_rating ? (
                        <>
                          {[1, 2, 3, 4, 5].map((starValue) => (
                            <Star
                              key={`popup-star-${starValue}`}
                              className={`h-4 w-4 ${
                                starValue <=
                                Math.round(Number(popupInfo.avg_rating))
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-xs text-gray-600">
                            {Number(popupInfo.avg_rating).toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">
                          No reviews yet
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/location/${popupInfo.id}`}
                      className="text-sm text-blue-600 hover:underline mt-auto"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
