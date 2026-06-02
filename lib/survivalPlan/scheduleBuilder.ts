import { calculateCropSchedule } from '@/lib/tools/planting-calendar/plantingCalculations';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import type { FrostDates, PlantingDate } from '@/lib/tools/planting-calendar/types';
import type { CropAllocation, PlanSchedule, PreservationItem } from './types';

function isoWeek(date: Date): { weekIso: string; weekLabel: string } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekIso = `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  const weekLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { weekIso, weekLabel };
}

export function buildSchedule(allocations: CropAllocation[], frostDates: FrostDates): PlanSchedule[] {
  const grouped = new Map<string, PlanSchedule>();

  for (const allocation of allocations) {
    const crop = getCropById(allocation.cropId);
    if (!crop) continue;
    const variety = crop.varieties.find(v => v.id === allocation.varietyId) ?? crop.varieties[0];
    if (!variety) continue;

    const dates: PlantingDate[] = calculateCropSchedule(
      crop,
      variety,
      {
        cropId: crop.id,
        varietyId: variety.id,
        successionEnabled: false,
        quantity: allocation.plantCount,
      },
      frostDates,
      false,
    );

    for (const event of dates) {
      const { weekIso, weekLabel } = isoWeek(event.date);
      if (!grouped.has(weekIso)) {
        grouped.set(weekIso, { weekIso, weekLabel, events: [] });
      }
      grouped.get(weekIso)!.events.push({
        cropName: event.cropName,
        varietyName: event.varietyName,
        action: event.action,
        dateIso: event.date.toISOString().slice(0, 10),
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.weekIso.localeCompare(b.weekIso));
}

export function buildPreservationTimeline(
  allocations: CropAllocation[],
  frostDates: FrostDates,
): PreservationItem[] {
  const items: PreservationItem[] = [];

  for (const allocation of allocations) {
    const crop = getCropById(allocation.cropId);
    if (!crop) continue;
    const variety = crop.varieties.find(v => v.id === allocation.varietyId) ?? crop.varieties[0];
    if (!variety) continue;

    const dates = calculateCropSchedule(
      crop,
      variety,
      { cropId: crop.id, varietyId: variety.id, successionEnabled: false, quantity: allocation.plantCount },
      frostDates,
      false,
    );
    const harvest = dates.find(d => d.action === 'harvest');
    if (!harvest) continue;

    const methods = crop.preservation?.map(p => p.method) ?? [];
    const storageMonths = crop.preservation && crop.preservation.length > 0
      ? Math.max(...crop.preservation.map(p => p.shelfLifeMonths))
      : 0;

    items.push({
      cropName: crop.name,
      harvestDateIso: harvest.date.toISOString().slice(0, 10),
      methods,
      storageMonths,
    });
  }

  return items.sort((a, b) => a.harvestDateIso.localeCompare(b.harvestDateIso));
}
