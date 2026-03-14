// ============================================================
// Water catchment configuration
// ============================================================

export type CollectionMethod = 'rooftop-gutters' | 'tarp-stand' | 'direct-barrel';

export interface CatchmentConfig {
  collectionAreaSqFt: number;
  collectionMethod: CollectionMethod;
  efficiency: number;           // 0.0–1.0; pre-filled from method preset, overridable
  firstFlushGallons: number;    // gallons lost per rain event (default 5 for gutters)
  storageCap: number;           // total tank capacity in gallons
}

// ============================================================
// Water autonomy calculation I/O
// ============================================================

export interface ForecastRainDay {
  precipitationInches: number;
  probabilityPercent: number;   // 0–100; used for expected-value projection
}

export interface WaterAutonomyInput {
  storedGallons: number;         // current reading — from ActualsInput
  householdSize: number;
  catchment?: CatchmentConfig;   // optional; if absent, clock shows stored-only
  forecastDays?: ForecastRainDay[];  // 7-day outlook from weatherApi
  irrigationDailyGallons?: number;   // tracked separately from household need
}

export interface WaterAutonomyResult {
  daysOfWater: number;               // primary clock value
  currentSupplyDays: number;         // stored-only, no forecast
  projectedInflowGallons: number;    // expected catchment over forecast window
  dailyHouseholdNeed: number;        // gallons/day (household only)
  dailyTotalNeed: number;            // gallons/day including irrigation if provided
  confidence: 'high' | 'medium' | 'low';
  irrigationTracked: boolean;        // false → UI must show a warning
}

// ============================================================
// Homestead Configuration (user-supplied, persisted via Dexie)
// ============================================================

export interface HomesteadConfig {
  householdSize: number;
  skillLevel: number;           // 0.6 (Novice) → 1.0 (Expert)
  waterCatchment: CatchmentConfig;
  energy: {
    batteryCapacityAh: number;
    solarArrayWatts: number;
    baseloadWatts: number;
  };
}

// ============================================================
// Inventory
// ============================================================

export interface InventoryItem {
  id: string;
  cropId: string;
  type: 'crop' | 'water' | 'fuel' | 'seed';
  plantCount: number;
  status: 'planned' | 'active' | 'stored';
  // stored items: skillLevel does NOT apply (yield is already realised)
  // planned/active items: skillLevel coefficient is applied as a yield modifier
  dateHarvested?: Date;
  preservationMethod?: 'fresh' | 'canned' | 'dehydrated' | 'frozen' | 'cold-storage';
  lastUpdated: Date;
}

// ============================================================
// Unit normalization
// ============================================================

export interface UnitNormalization {
  gramsPerUnit: number;
  assumption: string | null;  // non-null values must be surfaced in the UI
}

// ============================================================
// Yield calculation outputs
// ============================================================

export interface YieldResult {
  cropId: string;
  cropName: string;
  plantCount: number;
  kcalPerPlant: number;
  totalKcal: number;       // raw kcal before decay (useful for UI comparison)
  effectiveKcal: number;   // decay-adjusted kcal — use this for food security math
  decayModifier: number;   // 0.0–1.0; 1.0 for planned/active (not yet harvested)
  totalGrams: number;
  unit: string;
  gramsPerUnit: number;
  unitAssumption: string | null;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

// ============================================================
// Decay calculation outputs
// ============================================================

export type DecayPhase = 'fresh' | 'declining' | 'spoiled';

export interface DecayResult {
  modifier: number;           // 0.0–1.0 multiplier on stored calories
  phase: DecayPhase;
  daysRemaining: number;      // days until modifier hits 0.0
  shelfLifeDays: number;      // total shelf life used for this calculation
  preservationMethod: string;
}

export interface CaloricTotals {
  totalKcal: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  daysOfFood: number;
  byCategory: Record<string, number>;  // kcal keyed by crop category
  cropBreakdown: YieldResult[];
  skippedNonCaloric: string[];         // crop IDs excluded from food math
}

// ============================================================
// Top-level state persisted to Dexie
// ============================================================

export interface SurvivalManifest {
  config: HomesteadConfig;
  inventory: InventoryItem[];
  lastUpdated: Date;
  caloricTotals?: CaloricTotals;       // derived — recomputed on demand, cached here
}
