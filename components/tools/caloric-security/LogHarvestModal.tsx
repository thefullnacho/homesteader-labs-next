'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { putInventoryItem } from '@/lib/caloric-security/homesteadStore';
import type { InventoryItem } from '@/lib/caloric-security/types';

// ============================================================
// LogHarvestModal
//
// Fast-path form to log an actual harvest straight to stored
// inventory. Bypasses the full CRUD form on the inventory page
// — just crop, weight, preservation method, and date.
//
// Portals to document.body: .grain sections set isolation, so
// a fixed overlay rendered inline would clip.
// ============================================================

const PRESERVATION_LABELS: Record<NonNullable<InventoryItem['preservationMethod']>, string> = {
  fresh:          'Fresh',
  canned:         'Canned',
  dehydrated:     'Dehydrated',
  frozen:         'Frozen',
  'cold-storage': 'Cold storage',
};

const FIELD_LABEL = 'block font-mono text-[0.68rem] uppercase tracking-widest text-ink/60 mb-1';
const FIELD_INPUT = 'w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40';

interface LogHarvestModalProps {
  onClose:   () => void;
  defaultCropId?: string;  // pre-select a crop if called from context
}

export default function LogHarvestModal({ onClose, defaultCropId }: LogHarvestModalProps) {
  const allCrops = getAllCrops();

  const [cropId,    setCropId]    = useState(defaultCropId ?? allCrops[0]?.id ?? '');
  const [weightLbs, setWeightLbs] = useState<string>('');
  const [method,    setMethod]    = useState<NonNullable<InventoryItem['preservationMethod']>>('fresh');
  const [dateStr,   setDateStr]   = useState(new Date().toISOString().slice(0, 10));
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!cropId || !weightLbs) return;
    const lbs = parseFloat(weightLbs);
    if (isNaN(lbs) || lbs <= 0) return;

    setSaving(true);
    try {
      const item: InventoryItem = {
        id:                 crypto.randomUUID(),
        type:               'crop',
        cropId,
        plantCount:         1,            // weight-based; plantCount is nominal
        status:             'stored',
        weightLbs:          lbs,
        preservationMethod: method,
        dateHarvested:      new Date(dateStr + 'T12:00:00'),
        lastUpdated:        new Date(),
      };
      await putInventoryItem(item);
      setDone(true);
      setTimeout(onClose, 1200);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-[100]">
      <div className="card-paper grain w-full max-w-sm">
        <div className="flex justify-between items-center px-5 py-3 border-b-2 border-ink relative z-[2]">
          <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em]">
            Log a harvest
          </span>
          <button onClick={onClose} aria-label="Close" className="hover:text-marker">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 relative z-[2]">
          {done ? (
            <div className="py-8 text-center">
              <p className="font-hand font-semibold text-marker text-3xl -rotate-1">✓ in the ledger</p>
              <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wider text-ink/55">
                Food clock updated.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Crop */}
              <div>
                <label className={FIELD_LABEL}>Crop</label>
                <select
                  value={cropId}
                  onChange={e => setCropId(e.target.value)}
                  className={FIELD_INPUT}
                  required
                >
                  {allCrops.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className={FIELD_LABEL}>Weight (lbs)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 5.5"
                  value={weightLbs}
                  onChange={e => setWeightLbs(e.target.value)}
                  className={FIELD_INPUT}
                  required
                />
                <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-wide text-ink/50">
                  What the scale said. Beats counting plants.
                </p>
              </div>

              {/* Preservation method */}
              <div>
                <label className={FIELD_LABEL}>Preservation method</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as NonNullable<InventoryItem['preservationMethod']>)}
                  className={FIELD_INPUT}
                >
                  {(Object.keys(PRESERVATION_LABELS) as Array<keyof typeof PRESERVATION_LABELS>).map(k => (
                    <option key={k} value={k}>
                      {PRESERVATION_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className={FIELD_LABEL}>Date harvested</label>
                <input
                  type="date"
                  value={dateStr}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setDateStr(e.target.value)}
                  className={FIELD_INPUT}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-ink/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !cropId || !weightLbs}
                  className="flex-1 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60"
                >
                  {saving ? 'Writing it in...' : 'Log it'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
