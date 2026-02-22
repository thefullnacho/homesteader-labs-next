"use client";

import { useState, useCallback } from "react";
import { FrostDates } from "@/lib/tools/planting-calendar/types";

interface FrostDateAPIResponse {
  zip_code: string;
  location?: {
    city: string;
    state: string;
  };
  first_frost_32f: {
    "10%": string;
    "20%": string;
    "30%": string;
    "40%": string;
    "50%": string;
    "60%": string;
    "70%": string;
    "80%": string;
    "90%": string;
  };
  last_frost_32f: {
    "10%": string;
    "20%": string;
    "30%": string;
    "40%": string;
    "50%": string;
    "60%": string;
    "70%": string;
    "80%": string;
    "90%": string;
  };
  error?: string;
}

// Frost date API endpoint - wraps NOAA climate normals data
const FROST_API_BASE = "https://api.frost.date/v1/frost";

export function useFrostDates() {
  const [frostDates, setFrostDates] = useState<FrostDates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupFrostDates = useCallback(async (zipCode: string): Promise<FrostDates | null> => {
    setLoading(true);
    setError(null);

    try {
      // Validate zip code format
      if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
        throw new Error("Please enter a valid 5-digit zip code");
      }

      const zipPrefix = zipCode.substring(0, 5);

      // Call the frost date API directly (CORS-enabled)
      const response = await fetch(`${FROST_API_BASE}/${zipPrefix}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Zip code not found. Please check and try again.");
        }
        if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error("Unable to fetch frost dates. Please try again later.");
      }

      const data: FrostDateAPIResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const currentYear = new Date().getFullYear();
      
      // Parse dates using the 50% probability (median) dates
      const lastFrostDate = parseFrostDate(data.last_frost_32f["50%"], currentYear);
      const firstFrostDate = parseFrostDate(data.first_frost_32f["50%"], currentYear);
      
      // Calculate frost-free days
      const frostFreeDays = Math.round(
        (firstFrostDate.getTime() - lastFrostDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate confidence intervals based on 10% and 90% dates
      const earlyLastFrost = parseFrostDate(data.last_frost_32f["10%"], currentYear);
      const lateLastFrost = parseFrostDate(data.last_frost_32f["90%"], currentYear);
      const lastFrostConfidence = Math.round(
        (lateLastFrost.getTime() - earlyLastFrost.getTime()) / (1000 * 60 * 60 * 24) / 2
      );

      const earlyFirstFrost = parseFrostDate(data.first_frost_32f["10%"], currentYear);
      const lateFirstFrost = parseFrostDate(data.first_frost_32f["90%"], currentYear);
      const firstFrostConfidence = Math.round(
        (lateFirstFrost.getTime() - earlyFirstFrost.getTime()) / (1000 * 60 * 60 * 24) / 2
      );

      // Determine growing zone from zip code
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
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to lookup frost dates";
      setError(message);
      
      // Fallback to mock data on API failure
      console.warn("API failed, using fallback data:", message);
      try {
        const mockData = getMockFrostData(zipCode.substring(0, 5));
        setFrostDates(mockData);
        setError("Using estimated frost dates. Confirm with your local extension office for precision.");
        return mockData;
      } catch {
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearFrostDates = useCallback(() => {
    setFrostDates(null);
    setError(null);
  }, []);

  return {
    frostDates,
    loading,
    error,
    lookupFrostDates,
    clearFrostDates
  };
}

// Helper function to parse frost dates
function parseFrostDate(dateStr: string, year: number): Date {
  const [month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper function to estimate growing zone from zip code
function getGrowingZoneFromZip(zipCode: string): string | undefined {
  const zipNum = parseInt(zipCode.substring(0, 3), 10);
  
  if (zipNum >= 100 && zipNum <= 199) return "6b-7b"; // NYC area
  if (zipNum >= 200 && zipNum <= 205) return "7b-8a"; // DC area
  if (zipNum >= 606 && zipNum <= 608) return "5b-6a"; // Chicago
  if (zipNum >= 770 && zipNum <= 775) return "9a-9b"; // Houston
  if (zipNum >= 900 && zipNum <= 918) return "10b-11"; // LA
  if (zipNum >= 981 && zipNum <= 984) return "8b"; // Seattle
  if (zipNum >= 850 && zipNum <= 853) return "9b-10a"; // Phoenix
  if (zipNum >= 802 && zipNum <= 804) return "5b-6a"; // Denver
  
  return "6a";
}

// Fallback mock data when API is unavailable
function getMockFrostData(zipCode: string): FrostDates {
  // Default to zone 6a (middle America)
  let lastFrostMonth = 4;
  let lastFrostDay = 15;
  let firstFrostMonth = 10;
  let firstFrostDay = 15;
  let zone = "6a";
  
  const zipNum = parseInt(zipCode.substring(0, 3), 10);
  
  // Rough zone adjustments based on zip code
  if (zipNum >= 100 && zipNum <= 199) { // Northeast
    lastFrostMonth = 4; lastFrostDay = 20;
    firstFrostMonth = 10; firstFrostDay = 15;
    zone = "6b";
  } else if (zipNum >= 300 && zipNum <= 399) { // South
    lastFrostMonth = 3; lastFrostDay = 15;
    firstFrostMonth = 11; firstFrostDay = 1;
    zone = "8a";
  } else if (zipNum >= 900 && zipNum <= 966) { // West Coast
    lastFrostMonth = 2; lastFrostDay = 28;
    firstFrostMonth = 11; firstFrostDay = 15;
    zone = "9b";
  } else if (zipNum >= 550 && zipNum <= 599) { // Northern Midwest
    lastFrostMonth = 5; lastFrostDay = 1;
    firstFrostMonth = 10; firstFrostDay = 1;
    zone = "4a";
  }
  
  const currentYear = new Date().getFullYear();
  const lastFrost = new Date(currentYear, lastFrostMonth - 1, lastFrostDay);
  const firstFrost = new Date(currentYear, firstFrostMonth - 1, firstFrostDay);
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
}

export default useFrostDates;
