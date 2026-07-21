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
    <div className="border-2 border-rust bg-paper px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 shrink-0">
        <Snowflake size={14} className="text-rust" />
        <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-rust">
          Frost guard
        </span>
      </div>

      <div className="flex-1 text-[0.92rem] leading-snug text-ink/85">
        Freeze{' '}
        <strong className="text-rust">
          {daysAway === 0 ? 'tonight' : `in ${daysAway} day${daysAway !== 1 ? 's' : ''}`}
        </strong>{' '}
        ({dateLabel}, low {frostEvent.minTemp}°F). Cover what&apos;s in the ground:{' '}
        <strong>
          {visibleCrops.join(', ')}
          {overflow > 0 ? ` and ${overflow} more` : ''}
        </strong>
        .
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 flex items-center gap-1 font-mono text-[0.64rem] uppercase tracking-wider text-ink/45 hover:text-ink transition-colors"
      >
        <X size={10} /> Dismiss
      </button>
    </div>
  );
}
