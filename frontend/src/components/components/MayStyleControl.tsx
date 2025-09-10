// In frontend/src/components/MapStyleControl.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Layers } from "lucide-react";

// Define the available map styles from Mapbox
const mapStyles = [
  { name: "Streets", url: "mapbox://styles/mapbox/streets-v12" },
  { name: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { name: "Outdoors", url: "mapbox://styles/mapbox/outdoors-v12" },
  { name: "Light", url: "mapbox://styles/mapbox/light-v11" },
  { name: "Dark", url: "mapbox://styles/mapbox/dark-v11" },
];

interface MapStyleControlProps {
  currentStyle: string;
  onStyleChange: (styleUrl: string) => void;
}

export function MapStyleControl({
  currentStyle,
  onStyleChange,
}: MapStyleControlProps) {
  return (
    <div className="absolute top-2 right-2.5 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="bg-white">
            <Layers className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuRadioGroup
            value={currentStyle}
            onValueChange={onStyleChange}
          >
            {mapStyles.map((style) => (
              <DropdownMenuRadioItem key={style.name} value={style.url}>
                {style.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
