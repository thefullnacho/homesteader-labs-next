"use client";

import { useFieldStation } from "@/app/context/FieldStationContext";

export function useFrostDates() {
  const {
    frostDates,
    frostLoading: loading,
    frostError: error,
    lookupFrostDates,
    setFrostDates
  } = useFieldStation();

  const clearFrostDates = () => {
    setFrostDates(null);
  };

  return {
    frostDates,
    loading,
    error,
    lookupFrostDates,
    clearFrostDates
  };
}

export default useFrostDates;
