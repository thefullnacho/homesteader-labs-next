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
    <div className={`border-2 bg-paper ${hasCritical ? 'border-rust' : 'border-marker'}`}>
      {/* Header — always visible, clickable to collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={14}
            className={hasCritical ? 'text-rust' : 'text-marker'}
          />
          <span className={`font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] ${
            hasCritical ? 'text-rust' : 'text-marker'
          }`}>
            The spoilage watch
          </span>
          <span className={`font-mono text-[0.64rem] border px-1.5 py-0.5 ${
            hasCritical ? 'border-rust text-rust' : 'border-marker text-marker'
          }`}>
            {alerts.length}
          </span>
        </div>
        {open
          ? <ChevronUp size={12} className="text-ink/50" />
          : <ChevronDown size={12} className="text-ink/50" />
        }
      </button>

      {/* Alert rows */}
      {open && (
        <div className="px-4 pb-4">
          <table className="w-full font-mono text-[0.76rem]">
            <tbody>
              {alerts.map(a => {
                const isSpoiled  = a.phase === 'spoiled';
                const isCritical = a.daysRemaining < 7 && !isSpoiled;
                const tone = isSpoiled || isCritical ? 'text-rust' : 'text-marker';

                return (
                  <tr key={a.id} className="h-[34px] border-b border-dotted border-ink/30 last:border-b-0">
                    <td className="font-semibold pr-3">
                      {a.cropIcon} {a.cropName}
                    </td>
                    <td className="text-ink/55 pr-3">{a.method}</td>
                    <td className={`text-right font-bold tabular-nums ${tone}`}>
                      {isSpoiled
                        ? 'spoiled, pull it'
                        : `${a.daysRemaining} d left · ${a.valuePct}% value`
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="pt-2 font-mono text-[0.64rem] uppercase tracking-wide text-ink/50">
            Update harvest dates and preservation methods under Manage.
          </p>
        </div>
      )}
    </div>
  );
}
