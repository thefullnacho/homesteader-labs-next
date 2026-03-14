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
    <div className="border-2 border-yellow-500/60 bg-yellow-500/10 px-4 py-3 font-mono flex flex-col sm:flex-row sm:items-center gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 shrink-0">
        <Droplets size={13} className="text-yellow-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">
          Drought_Warning
        </span>
      </div>

      <div className="flex-1 text-[10px] font-mono uppercase opacity-70">
        No precipitation forecast — stored supply:{' '}
        <span className="opacity-100 text-yellow-300 font-bold">
          {waterAutonomy.daysOfWater.toFixed(1)} days
        </span>
        {activeCropCount > 0 && (
          <> · {activeCropCount} active crop{activeCropCount !== 1 ? 's' : ''} at drought risk — consider supplemental irrigation.</>
        )}
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
