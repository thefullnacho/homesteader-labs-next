'use client';

import { useState } from 'react';
import { X, Leaf } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { putInventoryItem } from '@/lib/caloric-security/homesteadStore';
import type { InventoryItem } from '@/lib/caloric-security/types';

// ============================================================
// LogHarvestModal
//
// Fast-path form to log an actual harvest straight to stored
// inventory. Bypasses the full CRUD form on the inventory page
// — just crop, weight, preservation method, and date.
// ============================================================

const PRESERVATION_LABELS: Record<NonNullable<InventoryItem['preservationMethod']>, string> = {
  fresh:          'Fresh',
  canned:         'Canned',
  dehydrated:     'Dehydrated',
  frozen:         'Frozen',
  'cold-storage': 'Cold Storage',
};

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <BrutalistBlock className="w-full max-w-sm relative" refTag="LOG_HARVEST">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 opacity-40 hover:opacity-80 transition-opacity"
        >
          <X size={14} />
        </button>

        {done ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-2xl">✓</div>
            <p className="text-xs font-mono uppercase font-bold text-green-400">Harvest Logged</p>
            <p className="text-[10px] font-mono opacity-40 uppercase">
              Food clock updated automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-accent/10 border-2 border-accent flex items-center justify-center shrink-0">
                <Leaf size={14} className="text-accent" />
              </div>
              <Typography variant="h4" className="mb-0 uppercase tracking-tight text-sm">
                Log Harvest
              </Typography>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Crop */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 opacity-70">
                  Crop
                </label>
                <select
                  value={cropId}
                  onChange={e => setCropId(e.target.value)}
                  className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono uppercase"
                  required
                >
                  {allCrops.map(c => (
                    <option key={c.id} value={c.id} className="bg-background-primary">
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 opacity-70">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 5.5"
                  value={weightLbs}
                  onChange={e => setWeightLbs(e.target.value)}
                  className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
                  required
                />
                <p className="text-[9px] font-mono uppercase opacity-30 mt-1">
                  Actual measured weight — more accurate than plant count
                </p>
              </div>

              {/* Preservation method */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 opacity-70">
                  Preservation Method
                </label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as NonNullable<InventoryItem['preservationMethod']>)}
                  className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono uppercase"
                >
                  {(Object.keys(PRESERVATION_LABELS) as Array<keyof typeof PRESERVATION_LABELS>).map(k => (
                    <option key={k} value={k} className="bg-background-primary">
                      {PRESERVATION_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-1 opacity-70">
                  Date Harvested
                </label>
                <input
                  type="date"
                  value={dateStr}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setDateStr(e.target.value)}
                  className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={saving || !cropId || !weightLbs}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Log Harvest'}
                </Button>
              </div>
            </form>
          </>
        )}
      </BrutalistBlock>
    </div>
  );
}
