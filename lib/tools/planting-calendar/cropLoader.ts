import { Crop, Variety, CropUse, PreservationMethod, GrowthHabit } from './types';

import vegetablesData from '@/content/crops/vegetables.json';
import herbsData from '@/content/crops/herbs.json';
import fruitsAnnualData from '@/content/crops/fruits-annual.json';
import fruitsPerennialData from '@/content/crops/fruits-perennial.json';

// Combine all crop sources into a single array
const allCrops: Crop[] = [
  ...(vegetablesData as Crop[]),
  ...(herbsData as Crop[]),
  ...(fruitsAnnualData as Crop[]),
  ...(fruitsPerennialData as Crop[]),
];

// Backward-compatible export
export const crops: Crop[] = allCrops;

// ============================================================
// Original API (backward-compatible)
// ============================================================

export function getAllCrops(): Crop[] {
  return allCrops;
}

export function getCropById(id: string): Crop | undefined {
  return allCrops.find(crop => crop.id === id);
}

export function getCropsByCategory(category: Crop['category']): Crop[] {
  return allCrops.filter(crop => crop.category === category);
}

export function getCropVarieties(cropId: string): Variety[] {
  const crop = getCropById(cropId);
  return crop?.varieties || [];
}

// ============================================================
// New query functions
// ============================================================

export function getCropsByUse(use: CropUse): Crop[] {
  return allCrops.filter(crop => crop.uses?.includes(use));
}

export function getCropsByPreservation(method: PreservationMethod): Crop[] {
  return allCrops.filter(crop =>
    crop.preservation?.some(p => p.method === method)
  );
}

export function getCompanions(cropId: string): Crop[] {
  const crop = getCropById(cropId);
  if (!crop?.companions) return [];
  return crop.companions
    .map(id => getCropById(id))
    .filter((c): c is Crop => c !== undefined);
}

export function getAntagonists(cropId: string): Crop[] {
  const crop = getCropById(cropId);
  if (!crop?.antagonists) return [];
  return crop.antagonists
    .map(id => getCropById(id))
    .filter((c): c is Crop => c !== undefined);
}

export function getCropsByGrowthHabit(habit: GrowthHabit): Crop[] {
  return allCrops.filter(crop => crop.growthHabit === habit);
}
