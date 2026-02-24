export interface Crop {
  id: string;
  name: string;
  category: 'vegetable' | 'herb' | 'fruit';
  varieties: Variety[];
  startIndoors: number | null;      // days before last frost (null if direct sow only)
  transplant: number | null;        // days after last frost (null if direct sow only)
  directSow: number | null;         // days after last frost (null if transplant only)
  daysToMaturity: number;           // average days to harvest
  successionEnabled: boolean;
  successionInterval: number;       // weeks between plantings
  successionMax: number;            // max plantings per season
  sun: 'full' | 'partial' | 'shade';
  spacing: string;
  notes: string[];
  icon: string;
  lunarAffinity?: 'waxing' | 'waning';
}

export interface Variety {
  id: string;
  name: string;
  daysToMaturity: number;
  type: string;
  special: string[];
}

export interface FrostDates {
  zipCode: string;
  city?: string;
  state?: string;
  lastSpringFrost: Date;
  lastSpringFrostConfidence: number;  // days ±
  firstFallFrost: Date;
  firstFallFrostConfidence: number;   // days ±
  frostFreeDays: number;
  growingZone?: string;
}

export interface SelectedCrop {
  cropId: string;
  varietyId: string;
  successionEnabled: boolean;
  successionInterval?: number;
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
  successionNumber?: number;  // 1, 2, 3, etc. for succession plantings
  notes?: string[];
  lunarPhase?: string;
  lunarAligned?: boolean;
}

export interface CropSchedule {
  crop: Crop;
  variety: Variety;
  successionEnabled: boolean;
  dates: PlantingDate[];
}
