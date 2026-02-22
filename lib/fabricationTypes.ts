export interface FilamentType {
  id: string;
  name: string;
  pricePerKg: number;
  density: number; // g/cm³
  printTemp: string;
  bedTemp: string;
  description: string;
}

export interface PrintSettings {
  infill: number; // 0-100%
  layerHeight: number; // mm
  wallCount: number;
  supportEnabled: boolean;
}

export interface PrintEstimate {
  volume: number; // cm³
  weight: number; // grams
  printTime: number; // minutes
  materialCost: number; // dollars
  serviceFee: number; // dollars
  totalCost: number; // dollars
}

export const FILAMENT_TYPES: FilamentType[] = [
  {
    id: "pla",
    name: "PLA",
    pricePerKg: 20,
    density: 1.24,
    printTemp: "190-220°C",
    bedTemp: "50-60°C",
    description: "Easy to print, biodegradable. Best for prototypes and decorative items.",
  },
  {
    id: "petg",
    name: "PETG",
    pricePerKg: 25,
    density: 1.27,
    printTemp: "220-250°C",
    bedTemp: "70-80°C",
    description: "Stronger than PLA, water resistant. Good for functional parts.",
  },
];

export const DEFAULT_SETTINGS: PrintSettings = {
  infill: 20,
  layerHeight: 0.2,
  wallCount: 3,
  supportEnabled: false,
};

// Calculate print estimate from model volume
export function calculatePrintEstimate(
  volumeCm3: number,
  filament: FilamentType,
  settings: PrintSettings
): PrintEstimate {
  // Adjust volume for infill (walls are always 100%)
  // Simplified: assume infill affects internal volume
  const infillFactor = settings.infill / 100;
  const adjustedVolume = volumeCm3 * (0.4 + 0.6 * infillFactor);

  // Calculate weight
  const weight = adjustedVolume * filament.density;

  // Estimate print time (very rough estimate)
  // Based on: volume, layer height, typical print speeds
  const baseMinutesPerCm3 = 8; // baseline
  const layerHeightFactor = 0.2 / settings.layerHeight; // finer = slower
  const printTime = adjustedVolume * baseMinutesPerCm3 * layerHeightFactor;

  // Material cost
  const materialCost = (weight / 1000) * filament.pricePerKg;

  // Service fee (labor, electricity, machine wear)
  const hourlyRate = 5; // $5/hour for machine time
  const serviceFee = (printTime / 60) * hourlyRate;

  // Minimum fee
  const minFee = 5;
  const adjustedServiceFee = Math.max(serviceFee, minFee);

  const totalCost = materialCost + adjustedServiceFee;

  return {
    volume: Math.round(adjustedVolume * 100) / 100,
    weight: Math.round(weight * 10) / 10,
    printTime: Math.round(printTime),
    materialCost: Math.round(materialCost * 100) / 100,
    serviceFee: Math.round(adjustedServiceFee * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

// Format minutes to hours and minutes
export function formatPrintTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
