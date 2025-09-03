"use client";

import { useState, useEffect } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";

// Define the shape of a suggestion from our backend
interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

interface AddressSearchProps {
  query: string;
  setQuery: (query: string) => void;
  onSelect: (coords: { latitude: number; longitude: number }) => void;
}

function parseCoordinates(
  input: string
): { latitude: number; longitude: number } | null {
  // 这个正则表达式会匹配 "lat, lng" 或 "lat lng" 格式的坐标
  const regex = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
  const match = input.match(regex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    // 基础的有效性检查
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

export function AddressSearch({
  query,
  setQuery,
  onSelect,
}: AddressSearchProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Use our custom hook to debounce the search query
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // --- 这是被修改的核心逻辑 ---
    // 1. 尝试将用户的输入解析为坐标
    const coords = parseCoordinates(debouncedQuery);

    if (coords) {
      // 2. 如果成功解析为坐标，直接调用 onSelect，并关闭建议列表
      onSelect(coords);
      setSuggestions([]);
      setIsOpen(false);
    } else if (debouncedQuery.length >= 3) {
      // 3. 如果不是坐标，并且长度足够，则执行地址搜索
      fetchAddressSuggestions();
    } else {
      // 4. 否则，清空建议
      setSuggestions([]);
    }
    // --- 结束修改部分 ---

    async function fetchAddressSuggestions() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/api/geocode?query=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Failed to fetch address suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [debouncedQuery, onSelect]); // onSelect 现在是依赖项

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.place_name); // Update input with full address
    setSuggestions([]); // Close the suggestion list
    setIsOpen(false); // Close the list on selection
    onSelect({
      longitude: suggestion.center[0],
      latitude: suggestion.center[1],
    });
  };

  const handleInputChange = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.length > 2) {
      setIsOpen(true); // Open the list when user is typing
    } else {
      setIsOpen(false); // Close it if they clear the input
    }
  };

  return (
    <div className="relative w-full">
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Type an address..."
          value={query}
          onValueChange={handleInputChange}
        />
        {isOpen && (
          <CommandList className="absolute w-full top-10 bg-white rounded-md border shadow-lg z-50">
            {isLoading && <CommandItem>Searching...</CommandItem>}
            {!isLoading && debouncedQuery.length > 2 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!isLoading &&
              suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.id}
                  onSelect={() => handleSelect(suggestion)}
                  className="cursor-pointer"
                >
                  {suggestion.place_name}
                </CommandItem>
              ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
