'use client';

import { useState } from 'react';
import { Flame, X } from 'lucide-react';
import Link from 'next/link';
import type { EnergyAutonomyResult } from '@/lib/caloric-security/types';

// ============================================================
// CanningDayBanner
//
// Shows when the solar system has surplus capacity (average
// daily solar ≥ 120% of baseload draw) — suggesting that now
// is a good time to run energy-intensive preservation tasks
// (canning, dehydrating) without drawing down the battery.
//
// Also shows fresh stored items nearing end of shelf life
// so the user knows what to prioritise preserving.
//
// Phase 6 placeholder: "Log Canning Day" does not yet deduct
// from autonomy scores — that wires in when preservationCost
// integration is added in a later phase.
// ============================================================

interface CanningDayBannerProps {
  energyAutonomy:       EnergyAutonomyResult | null;
  decliningFreshItems:  string[];  // crop names with fresh stored items in declining phase
}

const SURPLUS_THRESHOLD = 1.2;  // 20% above baseload before triggering

export default function CanningDayBanner({
  energyAutonomy,
  decliningFreshItems,
}: CanningDayBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!energyAutonomy) return null;

  const { averageDailySolarWh, dailyDrawWh, forecastSolarDays } = energyAutonomy;

  // Require at least one forecast day so we're not triggering on a static default
  if (forecastSolarDays.length === 0) return null;
  if (dailyDrawWh <= 0) return null;
  if (averageDailySolarWh < dailyDrawWh * SURPLUS_THRESHOLD) return null;

  const surplusPct = Math.round((averageDailySolarWh / dailyDrawWh - 1) * 100);

  return (
    <div className="border-2 border-moss bg-paper px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <Flame size={14} className="text-moss" />
        <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-moss">
          Canning day
        </span>
      </div>

      <div className="flex-1 text-[0.92rem] leading-snug text-ink/85">
        The panels are running <strong className="text-moss">{surplusPct}% over baseload</strong>.
        Good window for the pressure canner and the dehydrator, the battery never feels it.
        {decliningFreshItems.length > 0 && (
          <>
            {' '}Put up{' '}
            <strong>
              {decliningFreshItems.slice(0, 4).join(', ')}
              {decliningFreshItems.length > 4 ? ` and ${decliningFreshItems.length - 4} more` : ''}
            </strong>{' '}
            first, their shelf life is already sliding.
          </>
        )}{' '}
        <Link
          href="/tools/caloric-security/inventory/"
          className="font-mono text-[0.68rem] uppercase tracking-wider underline underline-offset-4 hover:text-marker"
        >
          Open the inventory
        </Link>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 flex items-center gap-1 font-mono text-[0.64rem] uppercase tracking-wider text-ink/45 hover:text-ink transition-colors mt-0.5"
      >
        <X size={10} /> Dismiss
      </button>
    </div>
  );
}
