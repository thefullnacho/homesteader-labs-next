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
    <div className="border-2 border-green-500/50 bg-green-500/10 px-4 py-3 font-mono flex flex-col sm:flex-row sm:items-start gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <Flame size={13} className="text-green-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
          Canning_Day // Protocol
        </span>
      </div>

      <div className="flex-1 space-y-1">
        <div className="text-[10px] font-mono uppercase opacity-70">
          Solar surplus detected (+{surplusPct}% above baseload) — ideal window for energy-intensive preservation.
        </div>
        {decliningFreshItems.length > 0 && (
          <div className="text-[9px] font-mono uppercase opacity-50">
            Prioritise:{' '}
            <span className="text-green-300 opacity-100">
              {decliningFreshItems.slice(0, 4).join(', ')}
              {decliningFreshItems.length > 4 ? ` +${decliningFreshItems.length - 4} more` : ''}
            </span>
            {' '}— shelf life declining.
          </div>
        )}
        <div className="pt-1">
          <Link
            href="/tools/caloric-security/inventory"
            className="text-[9px] font-mono uppercase text-green-400 opacity-70 hover:opacity-100 underline underline-offset-2 transition-opacity"
          >
            → View Inventory
          </Link>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 flex items-center gap-1 text-[9px] font-mono uppercase opacity-30 hover:opacity-70 transition-opacity mt-0.5"
      >
        <X size={10} /> Dismiss
      </button>
    </div>
  );
}
