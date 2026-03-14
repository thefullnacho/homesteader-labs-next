'use client';

import { useMemo, useState } from 'react';
import { Snowflake, X } from 'lucide-react';
import type { ForecastDay } from '@/lib/weatherTypes';

// ============================================================
// FrostGuardAlert
//
// Scans the 7-day forecast for the first freeze event
// (minTemp ≤ 32°F). If the user has active crops in inventory,
// renders a terminal-style warning banner above the clocks.
//
// Dismissible per-session (useState, not persisted).
// ============================================================

interface FrostGuardAlertProps {
  forecastDays:     ForecastDay[];
  activeCropNames:  string[];   // names of active inventory crops — if empty, no alert
}

export default function FrostGuardAlert({
  forecastDays,
  activeCropNames,
}: FrostGuardAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  const frostEvent = useMemo(
    () => forecastDays.find(d => d.minTemp <= 32) ?? null,
    [forecastDays],
  );

  if (!frostEvent || activeCropNames.length === 0 || dismissed) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Append noon to avoid timezone date-shifting on date-only strings
  const eventDate = new Date(frostEvent.date + 'T12:00:00');
  const daysAway  = Math.max(0, Math.round((eventDate.getTime() - today.getTime()) / 86_400_000));
  const dateLabel = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const visibleCrops = activeCropNames.slice(0, 4);
  const overflow     = activeCropNames.length - visibleCrops.length;

  return (
    <div className="border-2 border-red-500/70 bg-red-500/10 px-4 py-3 font-mono flex flex-col sm:flex-row sm:items-center gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 shrink-0">
        <Snowflake size={13} className="text-red-400 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          Frost_Guard // Alert
        </span>
      </div>

      <div className="flex-1 text-[10px] font-mono uppercase opacity-70">
        Freeze event{' '}
        <span className="opacity-100 text-red-300 font-bold">
          {daysAway === 0 ? 'tonight' : `in ${daysAway} day${daysAway !== 1 ? 's' : ''}`}
        </span>
        {' '}({dateLabel} / low {frostEvent.minTemp}°F) — protect active crops:{' '}
        <span className="opacity-100 text-red-300">
          {visibleCrops.join(', ')}
          {overflow > 0 ? ` +${overflow} more` : ''}
        </span>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 flex items-center gap-1 text-[9px] font-mono uppercase opacity-30 hover:opacity-70 transition-opacity"
      >
        <X size={10} /> Dismiss
      </button>
    </div>
  );
}
