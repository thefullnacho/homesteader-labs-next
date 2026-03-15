"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { SavedLocation } from "@/lib/weatherTypes";
import { FrostDates } from "@/lib/tools/planting-calendar/types";
import { geocodeZipCode } from "@/lib/weatherApi";
import {
  getLocations, putLocation, bulkPutLocations, deleteLocation,
  getFrostDates, saveFrostDates, deleteFrostDates,
} from "@/lib/caloric-security/homesteadStore";

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

// Legacy localStorage keys — read once on first load for migration, then removed.
const LS_LOCATIONS_KEY  = "homesteader-locations";
const LS_FROST_KEY      = "homesteader-frost-dates";
const FROST_API_BASE    = "https://api.frost.date/v1/frost";

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
  if (zipNum >= 900 && zipNum <= 999) {
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

  if (zipNum >= 0 && zipNum <= 99) {
    lastFrostMonth = 5; lastFrostDay = 10;
    firstFrostMonth = 10; firstFrostDay = 1;
    zone = "5b";
  } else if (zipNum >= 100 && zipNum <= 199) {
    lastFrostMonth = 4; lastFrostDay = 20;
    firstFrostMonth = 10; firstFrostDay = 15;
    zone = "6b";
  } else if (zipNum >= 200 && zipNum <= 299) {
    lastFrostMonth = 4; lastFrostDay = 5;
    firstFrostMonth = 11; firstFrostDay = 1;
    zone = "7b";
  } else if (zipNum >= 300 && zipNum <= 399) {
    lastFrostMonth = 3; lastFrostDay = 15;
    firstFrostMonth = 11; firstFrostDay = 15;
    zone = "8b";
  } else if (zipNum >= 400 && zipNum <= 499) {
    lastFrostMonth = 4; lastFrostDay = 30;
    firstFrostMonth = 10; firstFrostDay = 10;
    zone = "6a";
  } else if (zipNum >= 500 && zipNum <= 599) {
    lastFrostMonth = 5; lastFrostDay = 15;
    firstFrostMonth = 9; firstFrostDay = 20;
    zone = "4b";
  } else if (zipNum >= 600 && zipNum <= 699) {
    lastFrostMonth = 4; lastFrostDay = 25;
    firstFrostMonth = 10; firstFrostDay = 15;
    zone = "5b";
  } else if (zipNum >= 700 && zipNum <= 799) {
    lastFrostMonth = 3; lastFrostDay = 10;
    firstFrostMonth = 11; firstFrostDay = 20;
    zone = "8a";
  } else if (zipNum >= 800 && zipNum <= 899) {
    lastFrostMonth = 5; lastFrostDay = 5;
    firstFrostMonth = 10; firstFrostDay = 5;
    zone = "5b";
  } else if (zipNum >= 900 && zipNum <= 999) {
    if (zipNum >= 900 && zipNum <= 930) {
      lastFrostMonth = 2; lastFrostDay = 15;
      firstFrostMonth = 12; firstFrostDay = 15;
      zone = "10a";
    } else {
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
  const [frostDates, setFrostDatesState] = useState<FrostDates | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [frostLoading, setFrostLoading] = useState(false);
  const [frostError, setFrostError] = useState<string | null>(null);

  // ── Load from Dexie on mount, migrating from localStorage if needed ──
  useEffect(() => {
    async function load() {
      try {
        // Load locations from Dexie
        const dbLocs = await getLocations();

        if (dbLocs.length > 0) {
          setLocations(dbLocs);
          const defaultLoc = dbLocs.find(l => l.isDefault) || dbLocs[0];
          setActiveLocation(defaultLoc);
        } else {
          // One-time migration from localStorage
          const raw = localStorage.getItem(LS_LOCATIONS_KEY);
          if (raw) {
            try {
              const parsed: SavedLocation[] = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setLocations(parsed);
                const defaultLoc = parsed.find(l => l.isDefault) || parsed[0];
                setActiveLocation(defaultLoc);
                await bulkPutLocations(parsed);
                localStorage.removeItem(LS_LOCATIONS_KEY);
              }
            } catch { /* corrupt data — start fresh */ }
          }
        }

        // Load frost dates from Dexie
        const dbFrost = await getFrostDates();
        if (dbFrost) {
          setFrostDatesState(dbFrost);
        } else {
          // One-time migration of frost dates from localStorage
          const rawFrost = localStorage.getItem(LS_FROST_KEY);
          if (rawFrost) {
            try {
              const parsed = JSON.parse(rawFrost);
              parsed.lastSpringFrost = new Date(parsed.lastSpringFrost);
              parsed.firstFallFrost  = new Date(parsed.firstFallFrost);
              setFrostDatesState(parsed);
              await saveFrostDates(parsed);
              localStorage.removeItem(LS_FROST_KEY);
            } catch { /* corrupt frost data — ignore */ }
          }
        }
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  // ── Persist location changes to Dexie ──────────────────────────────
  // (individual operations handle their own writes; this effect is a
  //  safety net for bulk state replacements not covered elsewhere)

  const addLocation = useCallback((location: Omit<SavedLocation, "id">) => {
    const newLocation: SavedLocation = {
      ...location,
      id: `loc_${Date.now()}`,
    };
    setLocations((prev) => {
      const updated = [...prev, newLocation];
      if (prev.length === 0) setActiveLocation(newLocation);
      return updated;
    });
    putLocation(newLocation).catch(console.error);
  }, []);

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => {
      const filtered = prev.filter(loc => loc.id !== id);
      setActiveLocation((currentActive) => {
        if (currentActive?.id === id) {
          return filtered.length > 0 ? filtered[0] : null;
        }
        return currentActive;
      });
      return filtered;
    });
    deleteLocation(id).catch(console.error);
  }, []);

  const updateLocation = useCallback((id: string, updates: Partial<SavedLocation>) => {
    setLocations((prev) => {
      const next = prev.map(loc => loc.id === id ? { ...loc, ...updates } : loc);
      // Persist the updated row
      const updated = next.find(l => l.id === id);
      if (updated) putLocation(updated).catch(console.error);
      return next;
    });
    setActiveLocation((prev) => prev?.id === id ? { ...prev, ...updates } : prev);
  }, []);

  const switchLocation = useCallback((id: string) => {
    setLocations((prev) => {
      const location = prev.find(loc => loc.id === id);
      if (location) setActiveLocation(location);
      return prev;
    });
  }, []);

  const setFrostDates = useCallback((dates: FrostDates | null) => {
    setFrostDatesState(dates);
    if (dates) {
      saveFrostDates(dates).catch(console.error);
    } else {
      deleteFrostDates().catch(console.error);
    }
  }, []);

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
      if (data.error) throw new Error(data.error);

      const currentMonth = new Date().getMonth();
      const currentYear  = new Date().getFullYear();
      const targetYear   = currentMonth >= 9 ? currentYear + 1 : currentYear;

      const parseFrostDate = (dateStr: string, year: number): Date => {
        const [month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const lastFrostDate  = parseFrostDate(data.last_frost_32f["50%"],  targetYear);
      const firstFrostDate = parseFrostDate(data.first_frost_32f["50%"], targetYear);
      const frostFreeDays  = Math.round((firstFrostDate.getTime() - lastFrostDate.getTime()) / (1000 * 60 * 60 * 24));

      const earlyLast  = parseFrostDate(data.last_frost_32f["10%"],  targetYear);
      const lateLast   = parseFrostDate(data.last_frost_32f["90%"],  targetYear);
      const lastConf   = Math.round((lateLast.getTime() - earlyLast.getTime()) / (1000 * 60 * 60 * 24) / 2);

      const earlyFirst = parseFrostDate(data.first_frost_32f["10%"], targetYear);
      const lateFirst  = parseFrostDate(data.first_frost_32f["90%"], targetYear);
      const firstConf  = Math.round((lateFirst.getTime() - earlyFirst.getTime()) / (1000 * 60 * 60 * 24) / 2);

      const result: FrostDates = {
        zipCode:                    zipPrefix,
        city:                       data.location?.city,
        state:                      data.location?.state,
        lastSpringFrost:            lastFrostDate,
        lastSpringFrostConfidence:  lastConf,
        firstFallFrost:             firstFrostDate,
        firstFallFrostConfidence:   firstConf,
        frostFreeDays,
        growingZone:                getGrowingZoneFromZip(zipPrefix),
      };

      setFrostDates(result);

      geocodeZipCode(zipPrefix).then(locData => {
        if (locData) {
          setLocations(prev => {
            const existing = prev.find(l => l.zipCode === zipPrefix);
            if (!existing) addLocation({ ...locData, zipCode: zipPrefix });
            return prev;
          });
        }
      });

      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to lookup frost dates";
      setFrostError(message);

      console.warn("API failed, using fallback data:", message);
      try {
        const zipPrefix  = zipCode.substring(0, 5);
        const mockData   = getMockFrostData(zipPrefix);
        setFrostDates(mockData);
        setFrostError("Using estimated frost dates. Confirm with your local extension office for precision.");

        geocodeZipCode(zipPrefix).then(locData => {
          if (locData) {
            setLocations(prev => {
              const existing = prev.find(l => l.zipCode === zipPrefix);
              if (!existing) addLocation({ ...locData, zipCode: zipPrefix });
              return prev;
            });
          }
        });

        return mockData;
      } catch {
        return null;
      }
    } finally {
      setFrostLoading(false);
    }
  }, [addLocation, setFrostDates]);

  const value: FieldStationState = {
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
