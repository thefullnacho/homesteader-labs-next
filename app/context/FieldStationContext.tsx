"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { SavedLocation } from "@/lib/weatherTypes";
import { FrostDates } from "@/lib/tools/planting-calendar/types";
import { geocodeZipCode } from "@/lib/weatherApi";

interface FieldStationState {
  locations: SavedLocation[];
  activeLocation: SavedLocation | null;
  frostDates: FrostDates | null;
  isLoaded: boolean;
  addLocation: (loc: Omit<SavedLocation, "id">) => void;
  removeLocation: (id: string) => void;
  switchLocation: (id: string) => void;
  updateLocation: (id: string, updates: Partial<SavedLocation>) => void;
  setFrostDates: (dates: FrostDates | null) => void;
  lookupFrostDates: (zipCode: string) => Promise<FrostDates | null>;
  frostLoading: boolean;
  frostError: string | null;
}

const STORAGE_KEY = "homesteader-locations";
const FROST_STORAGE_KEY = "homesteader-frost-dates";
const FROST_API_BASE = "https://api.frost.date/v1/frost";

// Helper function to estimate growing zone from zip code
export const getGrowingZoneFromZip = (zipCode: string): string | undefined => {
  const zipNum = parseInt(zipCode.substring(0, 3), 10);
  
  if (zipNum >= 0 && zipNum <= 99) return "5b"; // New England
  if (zipNum >= 100 && zipNum <= 199) return "6b"; // Mid-Atlantic
  if (zipNum >= 200 && zipNum <= 299) return "7b"; // VA, Carolinas
  if (zipNum >= 300 && zipNum <= 399) return "8b"; // Deep South
  if (zipNum >= 400 && zipNum <= 499) return "6a"; // Midwest
  if (zipNum >= 500 && zipNum <= 599) return "4b"; // Northern Midwest
  if (zipNum >= 600 && zipNum <= 699) return "5b"; // Central Midwest
  if (zipNum >= 700 && zipNum <= 799) return "8a"; // South Central
  if (zipNum >= 800 && zipNum <= 899) return "5b"; // Mountain West
  if (zipNum >= 900 && zipNum <= 999) { // West Coast
    if (zipNum >= 900 && zipNum <= 930) return "10a"; // SoCal
    return "8b"; // PNW / NorCal
  }
  
  return "6a";
};

export const getMockFrostData = (zipCode: string): FrostDates => {
  const zipNum = parseInt(zipCode.substring(0, 3), 10);
  
  let lastFrostMonth = 4, lastFrostDay = 15;
  let firstFrostMonth = 10, firstFrostDay = 15;
  let zone = "6a";

  if (zipNum >= 0 && zipNum <= 99) { // New England
    lastFrostMonth = 5; lastFrostDay = 10;
    firstFrostMonth = 10; firstFrostDay = 1;
    zone = "5b";
  } else if (zipNum >= 100 && zipNum <= 199) { // Mid-Atlantic
    lastFrostMonth = 4; lastFrostDay = 20;
    firstFrostMonth = 10; firstFrostDay = 15;
    zone = "6b";
  } else if (zipNum >= 200 && zipNum <= 299) { // VA, Carolinas
    lastFrostMonth = 4; lastFrostDay = 5;
    firstFrostMonth = 11; firstFrostDay = 1;
    zone = "7b";
  } else if (zipNum >= 300 && zipNum <= 399) { // Deep South
    lastFrostMonth = 3; lastFrostDay = 15;
    firstFrostMonth = 11; firstFrostDay = 15;
    zone = "8b";
  } else if (zipNum >= 400 && zipNum <= 499) { // Midwest
    lastFrostMonth = 4; lastFrostDay = 30;
    firstFrostMonth = 10; firstFrostDay = 10;
    zone = "6a";
  } else if (zipNum >= 500 && zipNum <= 599) { // Northern Midwest
    lastFrostMonth = 5; lastFrostDay = 15;
    firstFrostMonth = 9; firstFrostDay = 20;
    zone = "4b";
  } else if (zipNum >= 600 && zipNum <= 699) { // Central Midwest
    lastFrostMonth = 4; lastFrostDay = 25;
    firstFrostMonth = 10; firstFrostDay = 15;
    zone = "5b";
  } else if (zipNum >= 700 && zipNum <= 799) { // South Central
    lastFrostMonth = 3; lastFrostDay = 10;
    firstFrostMonth = 11; firstFrostDay = 20;
    zone = "8a";
  } else if (zipNum >= 800 && zipNum <= 899) { // Mountain West
    lastFrostMonth = 5; lastFrostDay = 5;
    firstFrostMonth = 10; firstFrostDay = 5;
    zone = "5b";
  } else if (zipNum >= 900 && zipNum <= 999) { // West Coast
    if (zipNum >= 900 && zipNum <= 930) { // SoCal
      lastFrostMonth = 2; lastFrostDay = 15;
      firstFrostMonth = 12; firstFrostDay = 15;
      zone = "10a";
    } else { // PNW / NorCal
      lastFrostMonth = 3; lastFrostDay = 25;
      firstFrostMonth = 11; firstFrostDay = 5;
      zone = "8b";
    }
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const targetYear = currentMonth >= 9 ? currentYear + 1 : currentYear;
  
  const lastFrost = new Date(targetYear, lastFrostMonth - 1, lastFrostDay);
  const firstFrost = new Date(targetYear, firstFrostMonth - 1, firstFrostDay);
  const frostFreeDays = Math.round((firstFrost.getTime() - lastFrost.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    zipCode,
    lastSpringFrost: lastFrost,
    lastSpringFrostConfidence: 7,
    firstFallFrost: firstFrost,
    firstFallFrostConfidence: 10,
    frostFreeDays,
    growingZone: zone,
  };
};

const FieldStationContext = createContext<FieldStationState | undefined>(undefined);

export function FieldStationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [activeLocation, setActiveLocation] = useState<SavedLocation | null>(null);
  const [frostDates, setFrostDates] = useState<FrostDates | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [frostLoading, setFrostLoading] = useState(false);
  const [frostError, setFrostError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedLocations = localStorage.getItem(STORAGE_KEY);
    const storedFrostDates = localStorage.getItem(FROST_STORAGE_KEY);

    if (storedLocations) {
      try {
        const parsed = JSON.parse(storedLocations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocations(parsed);
          const defaultLoc = parsed.find((loc: SavedLocation) => loc.isDefault) || parsed[0];
          setActiveLocation(defaultLoc);
        }
      } catch {
        // Invalid data, start fresh
      }
    }

    if (storedFrostDates) {
      try {
        const parsedFrost = JSON.parse(storedFrostDates);
        // Revive date objects
        parsedFrost.lastSpringFrost = new Date(parsedFrost.lastSpringFrost);
        parsedFrost.firstFallFrost = new Date(parsedFrost.firstFallFrost);
        setFrostDates(parsedFrost);
      } catch {
        // Invalid frost data
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

  // Save to localStorage when frostDates change
  useEffect(() => {
    if (isLoaded && frostDates) {
      localStorage.setItem(FROST_STORAGE_KEY, JSON.stringify(frostDates));
    } else if (isLoaded && !frostDates) {
      localStorage.removeItem(FROST_STORAGE_KEY);
    }
  }, [frostDates, isLoaded]);

  const addLocation = useCallback((location: Omit<SavedLocation, "id">) => {
    const newLocation: SavedLocation = {
      ...location,
      id: `loc_${Date.now()}`,
    };
    setLocations((prev) => {
      const updated = [...prev, newLocation];
      if (prev.length === 0) {
        setActiveLocation(newLocation);
      }
      return updated;
    });
  }, []);

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => {
      const filtered = prev.filter((loc) => loc.id !== id);
      if (activeLocation?.id === id && filtered.length > 0) {
        setActiveLocation(filtered[0]);
      } else if (filtered.length === 0) {
        setActiveLocation(null);
      }
      return filtered;
    });
  }, [activeLocation]);

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
      // Auto-sync frost dates if we switch location and it has a zip code
      if (location.zipCode) {
         // Optionally lookup here, but let's not auto-fetch on every switch to save API calls,
         // or we can auto-fetch if frostDates?.zipCode != location.zipCode
      }
    }
  }, [locations]);

  const lookupFrostDates = useCallback(async (zipCode: string): Promise<FrostDates | null> => {
    setFrostLoading(true);
    setFrostError(null);

    try {
      if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
        throw new Error("Please enter a valid 5-digit zip code");
      }

      const zipPrefix = zipCode.substring(0, 5);

      const response = await fetch(`${FROST_API_BASE}/${zipPrefix}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error("Zip code not found. Please check and try again.");
        if (response.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
        throw new Error("Unable to fetch frost dates. Please try again later.");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const targetYear = currentMonth >= 9 ? currentYear + 1 : currentYear;
      
      const parseFrostDate = (dateStr: string, year: number): Date => {
        const [month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const lastFrostDate = parseFrostDate(data.last_frost_32f["50%"], targetYear);
      const firstFrostDate = parseFrostDate(data.first_frost_32f["50%"], targetYear);
      
      const frostFreeDays = Math.round((firstFrostDate.getTime() - lastFrostDate.getTime()) / (1000 * 60 * 60 * 24));

      const earlyLastFrost = parseFrostDate(data.last_frost_32f["10%"], targetYear);
      const lateLastFrost = parseFrostDate(data.last_frost_32f["90%"], targetYear);
      const lastFrostConfidence = Math.round((lateLastFrost.getTime() - earlyLastFrost.getTime()) / (1000 * 60 * 60 * 24) / 2);

      const earlyFirstFrost = parseFrostDate(data.first_frost_32f["10%"], targetYear);
      const lateFirstFrost = parseFrostDate(data.first_frost_32f["90%"], targetYear);
      const firstFrostConfidence = Math.round((lateFirstFrost.getTime() - earlyFirstFrost.getTime()) / (1000 * 60 * 60 * 24) / 2);

      const growingZone = getGrowingZoneFromZip(zipPrefix);

      const result: FrostDates = {
        zipCode: zipPrefix,
        city: data.location?.city,
        state: data.location?.state,
        lastSpringFrost: lastFrostDate,
        lastSpringFrostConfidence: lastFrostConfidence,
        firstFallFrost: firstFrostDate,
        firstFallFrostConfidence: firstFrostConfidence,
        frostFreeDays,
        growingZone,
      };

      setFrostDates(result);
      
      // Sync with locations if we don't have this one
      setLocations(prev => {
        const existing = prev.find(l => l.zipCode === zipPrefix);
        if (!existing) {
          // Fire geocode lookup in background to add to locations
          geocodeZipCode(zipPrefix).then(locData => {
            if (locData) {
              addLocation({ ...locData, zipCode: zipPrefix });
            }
          });
        }
        return prev;
      });

      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to lookup frost dates";
      setFrostError(message);
      
      console.warn("API failed, using fallback data:", message);
      try {
        const mockData = getMockFrostData(zipCode.substring(0, 5));
        setFrostDates(mockData);
        setFrostError("Using estimated frost dates. Confirm with your local extension office for precision.");
        
        // Also fire background geocode
        geocodeZipCode(zipCode.substring(0, 5)).then(locData => {
            if (locData) {
                const existing = locations.find(l => l.zipCode === zipCode.substring(0, 5));
                if (!existing) {
                    addLocation({ ...locData, zipCode: zipCode.substring(0, 5) });
                }
            }
        });

        return mockData;
      } catch {
        return null;
      }
    } finally {
      setFrostLoading(false);
    }
  }, [addLocation, locations]);

  const value = {
    locations,
    activeLocation,
    frostDates,
    isLoaded,
    addLocation,
    removeLocation,
    switchLocation,
    updateLocation,
    setFrostDates,
    lookupFrostDates,
    frostLoading,
    frostError,
  };

  return (
    <FieldStationContext.Provider value={value}>
      {children}
    </FieldStationContext.Provider>
  );
}

export function useFieldStation() {
  const context = useContext(FieldStationContext);
  if (context === undefined) {
    throw new Error("useFieldStation must be used within a FieldStationProvider");
  }
  return context;
}
