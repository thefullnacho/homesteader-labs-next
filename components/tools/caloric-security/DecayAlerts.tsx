'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import { calculateItemDecay } from '@/lib/caloric-security/decayCalculations';
import type { InventoryItem } from '@/lib/caloric-security/types';

// ============================================================
// DecayAlerts
//
// Surfaces stored items that are entering or already in the
// decline phase. Placed between the clocks and the inventory
// table on the main dashboard for maximum visibility.
// ============================================================

const PRESERVATION_LABELS: Record<string, string> = {
  fresh:          'Fresh',
  canned:         'Canned',
  dehydrated:     'Dehydrated',
  frozen:         'Frozen',
  'cold-storage': 'Cold Storage',
};

interface AlertItem {
  id:            string;
  cropName:      string;
  cropIcon:      string;
  method:        string;
  daysRemaining: number;
  valuePct:      number;   // modifier × 100
  phase:         string;
}

interface DecayAlertsProps {
  inventory: InventoryItem[];
}

export default function DecayAlerts({ inventory }: DecayAlertsProps) {
  const alerts: AlertItem[] = [];

  for (const item of inventory) {
    if (item.status !== 'stored') continue;
    const crop = getCropById(item.cropId);
    if (!crop) continue;
    const decay = calculateItemDecay(item, crop);
    if (decay.phase === 'fresh' && decay.daysRemaining >= 30) continue;  // no alert needed

    alerts.push({
      id:            item.id,
      cropName:      crop.name,
      cropIcon:      crop.icon,
      method:        PRESERVATION_LABELS[item.preservationMethod ?? 'fresh'] ?? 'Fresh',
      daysRemaining: Math.max(0, Math.round(decay.daysRemaining)),
      valuePct:      Math.round(decay.modifier * 100),
      phase:         decay.phase,
    });
  }

  // Sort: spoiled first, then by days remaining ascending
  alerts.sort((a, b) => {
    if (a.phase === 'spoiled' && b.phase !== 'spoiled') return -1;
    if (b.phase === 'spoiled' && a.phase !== 'spoiled') return  1;
    return a.daysRemaining - b.daysRemaining;
  });

  const hasCritical = alerts.some(a => a.daysRemaining < 7 || a.phase === 'spoiled');
  // useState must be called before any conditional returns
  const [open, setOpen] = useState(hasCritical);

  if (alerts.length === 0) return null;

  return (
    <div className={`border-2 ${hasCritical ? 'border-red-500/50' : 'border-yellow-500/30'} bg-black/20`}>
      {/* Header — always visible, clickable to collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={13}
            className={hasCritical ? 'text-red-400' : 'text-yellow-400'}
          />
          <span className={`text-[10px] font-mono uppercase font-bold tracking-widest ${
            hasCritical ? 'text-red-400' : 'text-yellow-400'
          }`}>
            Decay Alerts
          </span>
          <span className={`text-[9px] font-mono border px-1.5 py-0.5 ${
            hasCritical
              ? 'border-red-500/40 text-red-400'
              : 'border-yellow-500/30 text-yellow-400'
          }`}>
            {alerts.length}
          </span>
        </div>
        {open
          ? <ChevronUp size={12} className="opacity-40" />
          : <ChevronDown size={12} className="opacity-40" />
        }
      </button>

      {/* Alert rows */}
      {open && (
        <div className="px-4 pb-4 space-y-1.5">
          {alerts.map(a => {
            const isSpoiled  = a.phase === 'spoiled';
            const isCritical = a.daysRemaining < 7 && !isSpoiled;

            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 px-3 py-2 text-[10px] font-mono uppercase ${
                  isSpoiled  ? 'bg-red-500/10 border border-red-500/30'    :
                  isCritical ? 'bg-red-500/5  border border-red-500/20'    :
                               'bg-yellow-500/5 border border-yellow-500/20'
                }`}
              >
                <AlertTriangle
                  size={10}
                  className={`shrink-0 ${isSpoiled || isCritical ? 'text-red-400' : 'text-yellow-400'}`}
                />
                <span className="font-bold shrink-0">
                  {a.cropIcon} {a.cropName}
                </span>
                <span className="opacity-40 shrink-0">({a.method})</span>
                <span className={`ml-auto shrink-0 font-bold tabular-nums ${
                  isSpoiled  ? 'text-red-400'    :
                  isCritical ? 'text-red-400'    :
                               'text-yellow-400'
                }`}>
                  {isSpoiled
                    ? 'Spoiled — remove'
                    : `${a.daysRemaining}d remaining · ${a.valuePct}% value`
                  }
                </span>
              </div>
            );
          })}
          <p className="text-[9px] font-mono uppercase opacity-20 pt-1">
            Manage inventory to update harvest dates and preservation methods.
          </p>
        </div>
      )}
    </div>
  );
}
