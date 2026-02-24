"use client";

import { useFieldStation } from "@/app/context/FieldStationContext";

export function useWeatherLocations() {
  const {
    locations,
    activeLocation,
    isLoaded,
    addLocation,
    removeLocation,
    updateLocation,
    switchLocation
  } = useFieldStation();

  const setDefaultLocation = (id: string) => {
    locations.forEach(loc => {
      updateLocation(loc.id, { isDefault: loc.id === id });
    });
  };

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
