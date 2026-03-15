import type { ForecastDay } from '@/lib/weatherTypes';
import type {
  CollectionMethod,
  CatchmentConfig,
  ForecastRainDay,
} from './types';

// ============================================================
// Method presets
//
// Efficiency values are industry-standard estimates.
// firstFlushGallons defaults account for debris and contamination
// on the first rainfall after a dry period.
// All values are overridable by the user in advanced settings.
// ============================================================

export interface CollectionMethodPreset {
  label: string;
  description: string;
  efficiency: number;
  firstFlushGallons: number;
}

export const COLLECTION_METHOD_PRESETS: Record<CollectionMethod, CollectionMethodPreset> = {
  'rooftop-gutters': {
    label:             'Rooftop Gutters',
    description:       'Gutters connected to a downspout diverter or tank. Best efficiency for most homesteads.',
    efficiency:        0.85,
    firstFlushGallons: 5,
  },
  'tarp-stand': {
    label:             'Tarp or Collection Stand',
    description:       'Portable catchment stretched over a frame. Great for off-grid setups without permanent gutters.',
    efficiency:        0.70,
    firstFlushGallons: 2,
  },
  'direct-barrel': {
    label:             'Open Barrel or Container',
    description:       'Barrel placed under a drip edge or in the open. Simple to set up, lower efficiency from splash loss.',
    efficiency:        0.60,
    firstFlushGallons: 0,
  },
};

// ============================================================
// Footprint calculator
//
// Takes outside dimensions of a building and returns the
// usable collection area. For homesteads: use the footprint
// (length × width), not the full roof surface area — water
// falls straight down, so footprint is what matters.
//
// Returns both the number and a plain-language explanation
// to show the user so they understand the assumption.
// ============================================================

export interface FootprintEstimate {
  sqFt: number;
  explanation: string;
}

export function estimateCollectionArea(
  buildingLengthFt: number,
  buildingWidthFt: number,
): FootprintEstimate {
  const sqFt = buildingLengthFt * buildingWidthFt;
  return {
    sqFt,
    explanation:
      `${buildingLengthFt} ft × ${buildingWidthFt} ft = ${sqFt} sq ft. ` +
      `Rain falls vertically, so the roof footprint (not the sloped surface area) ` +
      `is what determines how much water you intercept.`,
  };
}

// ============================================================
// Config builder
//
// Combines method preset defaults with user-supplied area
// and storage size. Optional overrides let advanced users
// punch in their own efficiency or first-flush value without
// changing the preset.
// ============================================================

export function buildCatchmentConfig(
  method: CollectionMethod,
  collectionAreaSqFt: number,
  storageCap: number,
  overrides?: {
    efficiency?: number;
    firstFlushGallons?: number;
  },
): CatchmentConfig {
  const preset = COLLECTION_METHOD_PRESETS[method];
  return {
    collectionMethod:   method,
    collectionAreaSqFt,
    storageCap,
    efficiency:         overrides?.efficiency        ?? preset.efficiency,
    firstFlushGallons:  overrides?.firstFlushGallons ?? preset.firstFlushGallons,
  };
}

// ============================================================
// Weather API adapter
//
// Converts the full ForecastDay array from weatherApi into
// the lightweight ForecastRainDay shape that waterAutonomy
// needs. Strips everything except precipitation and probability.
// ============================================================

export function forecastToRainDays(forecast: ForecastDay[]): ForecastRainDay[] {
  return forecast.map(day => ({
    precipitationInches:  day.precipitation,
    probabilityPercent:   day.precipitationProbability,
  }));
}
