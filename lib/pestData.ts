import pestCompanions from "@/content/crops/pest-companions.json";

/**
 * Typed view over content/crops/pest-companions.json.
 *
 * The JSON is heterogeneous by design: a pest carries GDD fields or a soil-temp
 * threshold, not both, and only non-alertable pests carry a reason. TypeScript
 * infers a union of the shapes it happens to see in the file, so reading a field
 * that is absent from the first record fails to compile even though the field is
 * part of the schema. This states the schema once instead.
 */
export interface PestCompanion {
  companion: string;
  companionId?: string;
  reason: string;
  placement: string;
  evidenceLevel: string;
}

export interface Pest {
  name: string;
  companions: PestCompanion[];
  soilTempThreshold?: number;
  thresholdNote?: string;
  gddBase?: number;
  gddBiofix?: string;
  gddEvent?: string;
  gddThreshold?: number;
  source?: string;
  /** Absent means alertable. Only a pest with no predictable emergence sets it false. */
  alertable?: boolean;
  notAlertableReason?: string;
}

export interface CropPests {
  cropId: string;
  pests: Pest[];
}

export const pestCrops = pestCompanions as CropPests[];
