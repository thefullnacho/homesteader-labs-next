'use client';

import { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

// ============================================================
// ActualsInput
//
// Compact panel for the user to update current real-world
// readings: stored gallons, current inventory counts, etc.
//
// Displayed as a collapsible slide-in on the dashboard.
// All values propagate upward via onChange callbacks — the
// parent (AutonomyDashboard) owns the state so clocks
// re-render immediately without a DB round-trip.
// ============================================================

export interface Actuals {
  storedGallons:          number;
  irrigationDailyGallons: number;
  currentBatteryPct:      number;   // 0–100 % of usable capacity; 100 = fully charged
}

interface ActualsInputProps {
  actuals:   Actuals;
  onChange:  (a: Actuals) => void;
}

export default function ActualsInput({ actuals, onChange }: ActualsInputProps) {
  const [open, setOpen]     = useState(false);
  const [draft, setDraft]   = useState<Actuals>(actuals);

  function openPanel() {
    setDraft(actuals);   // reset draft to current on open
    setOpen(true);
  }

  function save() {
    onChange(draft);
    setOpen(false);
  }

  function cancel() {
    setDraft(actuals);
    setOpen(false);
  }

  return (
    <div>
      {/* Trigger button — always visible */}
      <button
        onClick={openPanel}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-border-primary/40 hover:border-accent hover:text-accent transition-colors text-xs font-mono font-bold uppercase"
      >
        <Edit3 size={12} />
        Update Actuals
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <BrutalistBlock
            className="w-full max-w-sm"
            refTag="ACTUALS_OVERRIDE"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <Typography variant="h3" className="uppercase tracking-tight mb-0.5 text-base">
                  Current Actuals
                </Typography>
                <p className="text-[10px] font-mono opacity-40 uppercase">
                  Real-world readings — overrides calculated estimates
                </p>
              </div>
              <button
                onClick={cancel}
                className="w-7 h-7 border border-border-primary/30 flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Water */}
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 mb-3">
                  Water
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                      Stored Gallons <span className="opacity-40">[current tank reading]</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draft.storedGallons}
                      onChange={e => setDraft(d => ({ ...d, storedGallons: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                      Irrigation <span className="opacity-40">[gal/day, leave 0 if not tracking]</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draft.irrigationDailyGallons}
                      onChange={e => setDraft(d => ({ ...d, irrigationDailyGallons: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono transition-colors"
                    />
                    <p className="text-[9px] font-mono opacity-30 uppercase mt-1">
                      When 0, irrigation is not included in the water clock — a warning will display.
                    </p>
                  </div>
                </div>
              </div>

              {/* Energy */}
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 mb-3">
                  Energy
                </p>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                    Battery State of Charge <span className="opacity-40">[0–100 %]</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={draft.currentBatteryPct}
                      onChange={e => setDraft(d => ({ ...d, currentBatteryPct: parseInt(e.target.value) }))}
                      className="flex-1 accent-accent"
                    />
                    <span className="text-sm font-mono font-bold w-12 text-right tabular-nums">
                      {draft.currentBatteryPct}%
                    </span>
                  </div>
                  <p className="text-[9px] font-mono opacity-30 uppercase mt-1">
                    0% = at DoD limit (empty), 100% = fully charged
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-5 border-t border-border-primary/20">
              <Button variant="outline" size="sm" onClick={cancel} className="flex-1">
                <X size={12} className="mr-1" /> Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={save} className="flex-1">
                <Save size={12} className="mr-1" /> Save
              </Button>
            </div>
          </BrutalistBlock>
        </div>
      )}
    </div>
  );
}
