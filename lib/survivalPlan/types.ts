import type { FrostDates } from '@/lib/tools/planting-calendar/types';

export type PlanGoal = 'max-calories' | 'balanced' | 'preservation' | 'fresh';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type GardenType = 'in-ground' | 'raised' | 'containers' | 'mixed';

export type DietaryRestriction =
  | 'no-nightshades'
  | 'no-alliums'
  | 'no-brassicas'
  | 'no-legumes';

export interface SurvivalPlanInput {
  zipCode: string;
  adults: number;
  kids: number;
  dietaryRestrictions: DietaryRestriction[];
  squareFeet: number;
  gardenType: GardenType;
  goal: PlanGoal;
  experience: ExperienceLevel;
  excludedCropIds: string[];
}

export interface CropAllocation {
  cropId: string;
  cropName: string;
  varietyId: string;
  varietyName: string;
  plantCount: number;
  sqFtUsed: number;
  projectedKcal: number;
  projectedYieldGrams: number;
  rationale: string;
}

export interface LayoutCell {
  cropId: string;
  cropName: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlanSchedule {
  weekIso: string;
  weekLabel: string;
  events: Array<{
    cropName: string;
    varietyName: string;
    action: 'start-indoors' | 'transplant' | 'direct-sow' | 'harvest';
    dateIso: string;
  }>;
}

export interface PreservationItem {
  cropName: string;
  harvestDateIso: string;
  methods: string[];
  storageMonths: number;
}

export interface AffiliateLink {
  cropId: string;
  cropName: string;
  varietyName: string;
  vendor: string;
  url: string;
}

export interface SurvivalPlanOutput {
  input: SurvivalPlanInput;
  frostDates: FrostDates;
  growingZone: string;
  generatedAtIso: string;
  planId: string;
  allocations: CropAllocation[];
  layout: LayoutCell[];
  layoutGridWidth: number;
  layoutGridHeight: number;
  schedule: PlanSchedule[];
  companions: Array<{ cropName: string; companions: string[]; antagonists: string[] }>;
  totalKcal: number;
  daysOfFood: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  preservation: PreservationItem[];
  affiliateLinks: AffiliateLink[];
  companionUrl: string;
}
