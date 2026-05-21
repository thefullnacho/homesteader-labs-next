import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import React from 'react';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import { calculateCropYield } from '@/lib/caloric-security/yieldCalculations';
import type { FrostDates } from '@/lib/tools/planting-calendar/types';
import { selectCrops } from './cropSelector';
import { buildLayout } from './layoutBuilder';
import { buildSchedule, buildPreservationTimeline } from './scheduleBuilder';
import { buildAffiliateLinks } from './affiliateLinks';
import { SurvivalPlanPdf } from './pdfTemplate';
import { SurvivalPlanPreviewPdf } from './previewTemplate';
import type {
  ExperienceLevel,
  SurvivalPlanInput,
  SurvivalPlanOutput,
} from './types';
export type { SurvivalPlanOutput } from './types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homesteaderlabs.com';

const SKILL_BY_EXPERIENCE: Record<ExperienceLevel, number> = {
  beginner: 0.6,
  intermediate: 0.8,
  advanced: 1.0,
};

export function generatePlanId(input: SurvivalPlanInput): string {
  const seed = `${input.zipCode}-${input.adults}-${input.kids}-${input.squareFeet}-${input.goal}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `sgp_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

export function buildSurvivalPlan(
  input: SurvivalPlanInput,
  frostDates: FrostDates,
): SurvivalPlanOutput {
  const allocations = selectCrops(input);
  const layout = buildLayout(allocations, input.squareFeet);
  const schedule = buildSchedule(allocations, frostDates);
  const preservation = buildPreservationTimeline(allocations, frostDates);

  const skillLevel = SKILL_BY_EXPERIENCE[input.experience];

  let totalKcal = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;

  for (const a of allocations) {
    const crop = getCropById(a.cropId);
    if (!crop) continue;
    const y = calculateCropYield(crop, a.plantCount, skillLevel);
    if (!y) continue;
    totalKcal += y.totalKcal;
    totalProteinG += y.macros.proteinG;
    totalCarbsG += y.macros.carbsG;
    totalFatG += y.macros.fatG;
  }

  const householdSize = input.adults + input.kids;
  const dailyTarget = householdSize * 2000;
  const daysOfFood = dailyTarget > 0 ? totalKcal / dailyTarget : 0;

  const companions = allocations.map(a => {
    const crop = getCropById(a.cropId);
    if (!crop) return { cropName: a.cropName, companions: [], antagonists: [] };
    const companionNames = (crop.companions ?? [])
      .map(id => getCropById(id)?.name)
      .filter((n): n is string => Boolean(n));
    const antagonistNames = (crop.antagonists ?? [])
      .map(id => getCropById(id)?.name)
      .filter((n): n is string => Boolean(n));
    return { cropName: a.cropName, companions: companionNames, antagonists: antagonistNames };
  });

  const planId = generatePlanId(input);
  const goal = input.goal;
  const affiliateLinks = buildAffiliateLinks(allocations, planId, goal);
  const companionUrl = `${SITE_URL}/survival-garden-plan/companion/${planId}/`;

  return {
    input,
    frostDates,
    growingZone: frostDates.growingZone ?? '—',
    generatedAtIso: new Date().toISOString(),
    planId,
    allocations,
    layout: layout.cells,
    layoutGridWidth: layout.width,
    layoutGridHeight: layout.height,
    schedule,
    companions,
    totalKcal: Math.round(totalKcal),
    daysOfFood,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    preservation,
    affiliateLinks,
    companionUrl,
  };
}

export async function renderSurvivalPlanPdf(
  input: SurvivalPlanInput,
  frostDates: FrostDates,
): Promise<{ buffer: Buffer; plan: SurvivalPlanOutput }> {
  const plan = buildSurvivalPlan(input, frostDates);
  const qrCodeDataUrl = await QRCode.toDataURL(plan.companionUrl, {
    margin: 1,
    color: { dark: '#ff7300', light: '#1a1a1a' },
    width: 280,
  });
  const buffer = await renderToBuffer(
    // @react-pdf/renderer's ReactPDF.DocumentProps inference is overly strict here;
    // the element returns a Document at runtime.
    React.createElement(SurvivalPlanPdf, { plan, qrCodeDataUrl }) as React.ReactElement,
  );
  return { buffer, plan };
}

export async function renderSurvivalPlanPreviewPdf(
  input: SurvivalPlanInput,
  frostDates: FrostDates,
): Promise<{ buffer: Buffer; plan: SurvivalPlanOutput }> {
  const plan = buildSurvivalPlan(input, frostDates);
  const buffer = await renderToBuffer(
    React.createElement(SurvivalPlanPreviewPdf, { plan }) as React.ReactElement,
  );
  return { buffer, plan };
}
