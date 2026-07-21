'use client';

import { useState } from 'react';
import { Droplets, X } from 'lucide-react';
import type { WaterAutonomyResult } from '@/lib/caloric-security/types';

// ============================================================
// DroughtAlert
//
// Triggers when the forecast window shows near-zero inflow AND
// stored water is below 30 days — flagging a drought risk.
//
// Criteria (intentionally conservative):
//   projectedInflowGallons < 1   (essentially no rain forecast)
//   AND daysOfWater < 30
//   AND confidence !== 'low'    (must have catchment config to warn)
//
// From the project brief: "If waterCatchment score is < 20 for
// 14 days, flag 'Crop Failure Risk' and reduce projected yields
// by 30%." This alert surfaces that risk visually; the yield
// modifier integration is Phase 4c.
// ============================================================

interface DroughtAlertProps {
  waterAutonomy:   WaterAutonomyResult | null;
  activeCropCount: number;
}

export default function DroughtAlert({ waterAutonomy, activeCropCount }: DroughtAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !waterAutonomy) return null;
  if (waterAutonomy.confidence === 'low') return null;           // no catchment config
  if (waterAutonomy.projectedInflowGallons >= 1) return null;    // rain forecast present
  if (waterAutonomy.daysOfWater >= 30) return null;              // plenty stored

  return (
    <div className="border-2 border-marker bg-paper px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 shrink-0">
        <Droplets size={14} className="text-marker" />
        <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-marker">
          Drought watch
        </span>
      </div>

      <div className="flex-1 text-[0.92rem] leading-snug text-ink/85">
        Nothing on the rain sheet, and the stored supply reads{' '}
        <strong className="text-marker">{waterAutonomy.daysOfWater.toFixed(1)} days</strong>.
        {activeCropCount > 0 && (
          <>
            {' '}{activeCropCount} crop{activeCropCount !== 1 ? 's' : ''} in the ground will
            want supplemental irrigation.
          </>
        )}
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
