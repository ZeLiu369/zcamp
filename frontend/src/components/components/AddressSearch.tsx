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
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    async function fetchSuggestions() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3002/api/geocode?query=${encodeURIComponent(
            debouncedQuery
          )}`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Failed to fetch address suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSuggestions();
  }, [debouncedQuery]);

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
