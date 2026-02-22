"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedLocation } from "@/lib/weatherTypes";

const STORAGE_KEY = "homesteader-locations";

export function useWeatherLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [activeLocation, setActiveLocation] = useState<SavedLocation | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocations(parsed);
          const defaultLoc = parsed.find((loc: SavedLocation) => loc.isDefault) || parsed[0];
          setActiveLocation(defaultLoc);
        }
      } catch {
        // Invalid data, start fresh
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when locations change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    }
  }, [locations, isLoaded]);

  const addLocation = useCallback((location: Omit<SavedLocation, "id">) => {
    const newLocation: SavedLocation = {
      ...location,
      id: `loc_${Date.now()}`,
    };
    setLocations((prev) => {
      const updated = [...prev, newLocation];
      // If this is the first location, set it as active
      if (prev.length === 0) {
        setActiveLocation(newLocation);
      }
      return updated;
    });
  }, []);

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => {
      const filtered = prev.filter((loc) => loc.id !== id);
      // If we removed the active location, switch to another
      if (activeLocation?.id === id && filtered.length > 0) {
        setActiveLocation(filtered[0]);
      } else if (filtered.length === 0) {
        setActiveLocation(null);
      }
      return filtered;
    });
  }, [activeLocation]);

  const setDefaultLocation = useCallback((id: string) => {
    setLocations((prev) =>
      prev.map((loc) => ({
        ...loc,
        isDefault: loc.id === id,
      }))
    );
  }, []);

  const updateLocation = useCallback((id: string, updates: Partial<SavedLocation>) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc))
    );
    if (activeLocation?.id === id) {
      setActiveLocation((prev) => prev ? { ...prev, ...updates } : null);
    }
  }, [activeLocation]);

  const switchLocation = useCallback((id: string) => {
    const location = locations.find((loc) => loc.id === id);
    if (location) {
      setActiveLocation(location);
    }
  }, [locations]);

  return {
    locations,
    activeLocation,
    isLoaded,
    addLocation,
    removeLocation,
    setDefaultLocation,
    updateLocation,
    switchLocation,
  };
}
