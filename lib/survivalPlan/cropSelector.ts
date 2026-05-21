import { getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { calculateCropYield } from '@/lib/caloric-security/yieldCalculations';
import type { Crop } from '@/lib/tools/planting-calendar/types';
import type {
  CropAllocation,
  ExperienceLevel,
  PlanGoal,
  SurvivalPlanInput,
} from './types';

const DIETARY_BLOCKLIST: Record<string, string[]> = {
  'no-nightshades': ['tomato', 'pepper-bell', 'pepper-hot', 'potato', 'eggplant'],
  'no-alliums':     ['onion', 'garlic', 'leek', 'shallot', 'chive', 'chives'],
  'no-brassicas':   ['broccoli', 'cabbage', 'kale', 'brussels-sprouts', 'cauliflower', 'radish', 'turnip', 'collard', 'mustard'],
  'no-legumes':     ['bean-bush', 'bean-pole', 'pea', 'lentil', 'soybean', 'peanut'],
};

const SKILL_BY_EXPERIENCE: Record<ExperienceLevel, number> = {
  beginner: 0.6,
  intermediate: 0.8,
  advanced: 1.0,
};

// Crops considered too finicky for first-year growers. Used only when experience='beginner'.
const ADVANCED_ONLY = new Set([
  'cauliflower',
  'celery',
  'artichoke',
  'asparagus',
  'rhubarb',
  'fennel',
]);

const PERENNIAL_HABITS = new Set(['perennial', 'biennial']);

export function parseSquareFootPerPlant(spacing: string | undefined): number {
  if (!spacing) return 1.0;
  const match = spacing.match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return 1.0;
  const low = parseInt(match[1], 10);
  const high = match[2] ? parseInt(match[2], 10) : low;
  const inches = (low + high) / 2;
  const feet = inches / 12;
  return Math.max(0.25, feet * feet);
}

function dietaryFilter(crop: Crop, restrictions: SurvivalPlanInput['dietaryRestrictions']): boolean {
  for (const r of restrictions) {
    const blocked = DIETARY_BLOCKLIST[r] ?? [];
    if (blocked.includes(crop.id)) return false;
  }
  return true;
}

function experienceFilter(crop: Crop, experience: ExperienceLevel): boolean {
  if (experience === 'beginner' && ADVANCED_ONLY.has(crop.id)) return false;
  if (experience !== 'advanced' && crop.growthHabit && PERENNIAL_HABITS.has(crop.growthHabit)) return false;
  return true;
}

interface ScoredCrop {
  crop: Crop;
  kcalPerPlant: number;
  kcalPerSqFt: number;
  sqFtPerPlant: number;
  score: number;
  rationale: string;
}

function scoreCrop(crop: Crop, goal: PlanGoal, skillLevel: number): ScoredCrop | null {
  const yieldResult = calculateCropYield(crop, 1, skillLevel);
  if (!yieldResult) return null;

  const sqFtPerPlant = parseSquareFootPerPlant(crop.spacing);
  const kcalPerSqFt = yieldResult.totalKcal / sqFtPerPlant;

  const storageMonths = crop.preservation && crop.preservation.length > 0
    ? Math.max(...crop.preservation.map(p => p.shelfLifeMonths))
    : 0;
  const proteinDensity = (crop.yield?.proteinPer100g ?? 0) / 30;

  let score = 0;
  let rationale = '';

  switch (goal) {
    case 'max-calories':
      score = kcalPerSqFt;
      rationale = `${Math.round(kcalPerSqFt)} kcal/sqft — top calorie density`;
      break;
    case 'balanced':
      score = kcalPerSqFt * 0.5 + proteinDensity * kcalPerSqFt * 0.3 + storageMonths * 10;
      rationale = `Balanced: ${Math.round(kcalPerSqFt)} kcal/sqft, ${storageMonths}mo storage`;
      break;
    case 'preservation':
      score = storageMonths * 30 + kcalPerSqFt * 0.5;
      rationale = `${storageMonths}-month storage life (${crop.preservation?.map(p => p.method).join(', ') || 'fresh only'})`;
      break;
    case 'fresh':
      score = (200 - (crop.daysToMaturity ?? 100)) + kcalPerSqFt * 0.2;
      rationale = `${crop.daysToMaturity}d to harvest — fast fresh eating`;
      break;
  }

  return { crop, kcalPerPlant: yieldResult.totalKcal, kcalPerSqFt, sqFtPerPlant, score, rationale };
}

const MAX_CROPS = 15;
const MAX_PLANTS_PER_CROP_MULTIPLIER = 0.4;

export function selectCrops(input: SurvivalPlanInput): CropAllocation[] {
  const skillLevel = SKILL_BY_EXPERIENCE[input.experience];
  const excluded = new Set(input.excludedCropIds);

  const candidates = getAllCrops()
    .filter(c => !excluded.has(c.id))
    .filter(c => dietaryFilter(c, input.dietaryRestrictions))
    .filter(c => experienceFilter(c, input.experience))
    .map(c => scoreCrop(c, input.goal, skillLevel))
    .filter((s): s is ScoredCrop => s !== null)
    .sort((a, b) => b.score - a.score);

  const allocations: CropAllocation[] = [];
  let sqFtRemaining = input.squareFeet;
  const perCropCap = Math.max(1, Math.floor(input.squareFeet * MAX_PLANTS_PER_CROP_MULTIPLIER));

  for (const candidate of candidates) {
    if (allocations.length >= MAX_CROPS) break;
    if (sqFtRemaining < candidate.sqFtPerPlant) continue;

    const sqFtBudgetForCrop = Math.min(
      perCropCap,
      sqFtRemaining * (allocations.length === 0 ? 0.35 : 0.2),
    );
    const plantCount = Math.max(1, Math.floor(sqFtBudgetForCrop / candidate.sqFtPerPlant));
    const sqFtUsed = plantCount * candidate.sqFtPerPlant;
    if (sqFtUsed > sqFtRemaining) continue;

    const yieldResult = calculateCropYield(candidate.crop, plantCount, skillLevel);
    if (!yieldResult) continue;

    const variety = candidate.crop.varieties[0];

    allocations.push({
      cropId: candidate.crop.id,
      cropName: candidate.crop.name,
      varietyId: variety?.id ?? candidate.crop.id,
      varietyName: variety?.name ?? candidate.crop.name,
      plantCount,
      sqFtUsed: Math.round(sqFtUsed * 100) / 100,
      projectedKcal: Math.round(yieldResult.totalKcal),
      projectedYieldGrams: Math.round(yieldResult.totalGrams),
      rationale: candidate.rationale,
    });

    sqFtRemaining -= sqFtUsed;
  }

  return allocations;
}

export function totalsFromAllocations(allocations: CropAllocation[]) {
  return allocations.reduce(
    (acc, a) => {
      acc.totalKcal += a.projectedKcal;
      acc.totalSqFt += a.sqFtUsed;
      return acc;
    },
    { totalKcal: 0, totalSqFt: 0 },
  );
}
