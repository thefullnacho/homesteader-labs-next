// ============================================================
// Preservation & Use Types
// ============================================================

export type PreservationMethod =
  | 'canning'
  | 'freezing'
  | 'drying'
  | 'dehydrating'
  | 'fermentation'
  | 'pickling'
  | 'root-cellar'
  | 'cold-storage'
  | 'tincture'
  | 'infusion'
  | 'smoking'
  | 'salt-curing'
  | 'oil-preserving'
  | 'jam';

export type CropUse =
  | 'cooking'
  | 'medicinal'
  | 'tea'
  | 'companion'
  | 'pollinator'
  | 'pest-deterrent'
  | 'dye'
  | 'fiber'
  | 'aromatherapy'
  | 'livestock-feed';

export type GrowthHabit = 'annual' | 'biennial' | 'perennial';

// ============================================================
// Yield & Nutrition (for Caloric Security)
// ============================================================

export interface CropYield {
  avgPerPlant: number;              // average output per plant per season
  unit: 'lbs' | 'oz' | 'bunches' | 'heads' | 'bulbs' | 'ears';
  caloriesPer100g: number;
  proteinPer100g?: number;          // grams
  carbsPer100g?: number;            // grams
  fatPer100g?: number;              // grams
  storageLifeDays: number;          // fresh shelf life before spoilage
  'non-caloric'?: boolean;          // true for medicinal/companion plants — excluded from food math
}

// ============================================================
// Preservation Entry
// ============================================================

export interface PreservationEntry {
  method: PreservationMethod;
  shelfLifeMonths: number;
  notes: string;
}

// ============================================================
// Core Crop Interface
// ============================================================

export interface Crop {
  id: string;
  name: string;
  category: 'vegetable' | 'herb' | 'fruit';
  icon: string;
  varieties: Variety[];

  // Planting timing (days relative to last frost; negative = before)
  startIndoors: number | null;
  transplant: number | null;
  directSow: number | null;
  daysToMaturity: number;

  // Succession planting
  successionEnabled: boolean;
  successionInterval: number;       // weeks between plantings
  successionMax: number;            // max plantings per season

  // Growing conditions
  sun: 'full' | 'partial' | 'shade';
  spacing: string;
  notes: string[];
  lunarAffinity?: 'waxing' | 'waning';

  // Growth lifecycle (NEW)
  growthHabit?: GrowthHabit;
  yearsToFirstHarvest?: number;     // 0 for annuals, 2-7 for perennials

  // Water requirements (NEW)
  waterNeedsPerWeek?: number;       // gallons per plant

  // Yield & nutrition for caloric security (NEW)
  yield?: CropYield;

  // Preservation methods (NEW)
  preservation?: PreservationEntry[];

  // Use cases — especially useful for herbs (NEW)
  uses?: CropUse[];

  // Companion planting (NEW)
  companions?: string[];            // crop IDs that grow well together
  antagonists?: string[];           // crop IDs to keep apart
}

// ============================================================
// Variety
// ============================================================

export interface Variety {
  id: string;
  name: string;
  daysToMaturity: number;
  type: string;
  special: string[];
}

// ============================================================
// Planting Calendar Types (unchanged)
// ============================================================

export interface FrostDates {
  zipCode: string;
  city?: string;
  state?: string;
  lastSpringFrost: Date;
  lastSpringFrostConfidence: number;
  firstFallFrost: Date;
  firstFallFrostConfidence: number;
  frostFreeDays: number;
  growingZone?: string;
}

export interface SelectedCrop {
  cropId: string;
  varietyId: string;
  successionEnabled: boolean;
  successionInterval?: number;
  quantity?: number;          // number of plants, defaults to 1
  actualActionDate?: {
    action: 'start-indoors' | 'transplant' | 'direct-sow';
    date: string;  // ISO date string YYYY-MM-DD
  };
}

export interface PlantingConfig {
  zipCode: string;
  frostDates: FrostDates | null;
  selectedCrops: SelectedCrop[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface PlantingDate {
  cropId: string;
  cropName: string;
  varietyName: string;
  action: 'start-indoors' | 'transplant' | 'direct-sow' | 'harvest';
  date: Date;
  successionNumber?: number;
  notes?: string[];
  lunarPhase?: string;
  lunarAligned?: boolean;
  completed?: boolean;  // true when date is in the past (shifted by actualActionDate)
}

export interface CropSchedule {
  crop: Crop;
  variety: Variety;
  successionEnabled: boolean;
  dates: PlantingDate[];
}
