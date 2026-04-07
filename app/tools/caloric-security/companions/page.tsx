'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, AlertTriangle, Leaf, Lock } from 'lucide-react';
import Link from 'next/link';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { getDB } from '@/lib/caloric-security/db';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import type { InventoryItem } from '@/lib/caloric-security/types';

// ============================================================
// Companion Advisor  [GATED]
//
// Two panels:
//   1. Conflict Alerts — crops in inventory that are
//      antagonists of each other (warn about bad neighbours).
//   2. Companion Suggestions — for each active/planned crop,
//      list its known companions that aren't in inventory yet.
//
// Locked behind the same email gate as the ROI report.
// ============================================================

const GATE_KEY  = 'hl_features_unlocked';
const FREE_CONFLICTS    = 3;
const FREE_SUGGESTIONS  = 3;

export default function CompanionsPage() {
  const [unlocked,    setUnlocked]    = useState(false);
  const [email,       setEmail]       = useState('');
  const [consent,     setConsent]     = useState(false);
  const [gateOpen,    setGateOpen]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(GATE_KEY) === 'true');
  }, []);

  const inventory = useLiveQuery(
    async () => {
      const db = getDB();
      return db.inventory.toArray();
    },
    [],
    [] as InventoryItem[],
  );

  // Active / planned crops with full crop data
  const activeCropIds = inventory
    .filter(i => i.status === 'active' || i.status === 'planned')
    .map(i => i.cropId);
  const uniqueIds     = [...new Set(activeCropIds)];
  const activeCrops   = uniqueIds.map(id => getCropById(id)).filter(Boolean) as ReturnType<typeof getCropById>[];

  // ── Conflict detection ────────────────────────────────────
  // For each pair of crops, check if either's antagonists
  // list contains the other's ID.
  interface Conflict {
    cropA: string;
    iconA: string;
    cropB: string;
    iconB: string;
  }

  const conflicts: Conflict[] = [];
  for (let i = 0; i < activeCrops.length; i++) {
    for (let j = i + 1; j < activeCrops.length; j++) {
      const a = activeCrops[i]!;
      const b = activeCrops[j]!;
      if (a.antagonists?.includes(b.id) || b.antagonists?.includes(a.id)) {
        conflicts.push({ cropA: a.name, iconA: a.icon, cropB: b.name, iconB: b.icon });
      }
    }
  }

  // ── Companion suggestions ─────────────────────────────────
  // For each active crop, list companions not already in inventory.
  interface Suggestion {
    forCrop:    string;
    forIcon:    string;
    companion:  string;
    compIcon:   string;
  }

  const suggestions: Suggestion[] = [];
  for (const crop of activeCrops) {
    if (!crop?.companions) continue;
    for (const compId of crop.companions) {
      if (uniqueIds.includes(compId)) continue;  // already in inventory
      const comp = getCropById(compId);
      if (!comp) continue;
      suggestions.push({
        forCrop:   crop.name,
        forIcon:   crop.icon,
        companion: comp.name,
        compIcon:  comp.icon,
      });
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "companions-unlock" }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      localStorage.setItem(GATE_KEY, 'true');
      setUnlocked(true);
      setGateOpen(false);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const visibleConflicts   = unlocked ? conflicts    : conflicts.slice(0, FREE_CONFLICTS);
  const visibleSuggestions = unlocked ? suggestions  : suggestions.slice(0, FREE_SUGGESTIONS);
  const lockedConflicts    = conflicts.length    - FREE_CONFLICTS;
  const lockedSuggestions  = suggestions.length  - FREE_SUGGESTIONS;

  return (
    <FieldStationLayout stationId="HL_COMPANION_V1.0">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-border-primary pb-6">
          <div>
            <Link
              href="/tools/caloric-security"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-40 hover:opacity-80 transition-opacity mb-3"
            >
              <ArrowLeft size={10} /> Autonomy_Dashboard
            </Link>
            <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono flex items-center gap-3">
              <Leaf size={20} className="opacity-60" />
              Companion_Advisor
            </Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              Antagonist alerts + companion suggestions // {uniqueIds.length} active crops
            </Typography>
          </div>
          {!unlocked && (
            <Button variant="primary" size="sm" onClick={() => setGateOpen(true)} className="flex items-center gap-2">
              <Lock size={12} /> Unlock_Full_Advisor
            </Button>
          )}
        </div>

        {/* Empty state */}
        {uniqueIds.length === 0 && (
          <BrutalistBlock refTag="NO_CROPS">
            <div className="py-12 text-center font-mono uppercase text-[11px] opacity-30 space-y-2">
              <Leaf size={28} className="mx-auto opacity-30" />
              <div>No active or planned crops in inventory.</div>
              <div>
                <Link href="/tools/caloric-security/inventory" className="underline">
                  Add crops to inventory
                </Link>
                {' '}to see companion analysis.
              </div>
            </div>
          </BrutalistBlock>
        )}

        {/* Conflict alerts */}
        {conflicts.length > 0 && (
          <BrutalistBlock refTag="CONFLICTS">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-red-400" />
              <Typography variant="h4" className="text-xs uppercase tracking-widest font-mono opacity-60 mb-0">
                Antagonist_Conflicts ({conflicts.length})
              </Typography>
            </div>

            <div className="space-y-2">
              {visibleConflicts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-red-500/20 bg-red-500/5 text-[10px] font-mono uppercase">
                  <AlertTriangle size={10} className="text-red-400 shrink-0" />
                  <span className="font-bold">
                    {c.iconA} {c.cropA}
                  </span>
                  <span className="opacity-40">antagonises</span>
                  <span className="font-bold">
                    {c.iconB} {c.cropB}
                  </span>
                  <span className="opacity-30 ml-auto hidden sm:block">Keep separated</span>
                </div>
              ))}
            </div>

            {!unlocked && lockedConflicts > 0 && (
              <div className="mt-3 text-center text-[9px] font-mono uppercase opacity-30">
                +{lockedConflicts} more conflicts hidden —{' '}
                <button onClick={() => setGateOpen(true)} className="underline hover:opacity-60">unlock</button>
              </div>
            )}
          </BrutalistBlock>
        )}

        {conflicts.length === 0 && uniqueIds.length > 0 && (
          <div className="text-[10px] font-mono uppercase opacity-30 text-center py-4">
            ✓ No antagonist conflicts detected in current inventory.
          </div>
        )}

        {/* Companion suggestions */}
        {suggestions.length > 0 && (
          <BrutalistBlock refTag="SUGGESTIONS">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={14} className="text-green-400" />
              <Typography variant="h4" className="text-xs uppercase tracking-widest font-mono opacity-60 mb-0">
                Companion_Suggestions ({suggestions.length})
              </Typography>
            </div>

            <div className="space-y-2">
              {visibleSuggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-green-500/20 bg-green-500/5 text-[10px] font-mono uppercase">
                  <Leaf size={10} className="text-green-400 shrink-0" />
                  <span className="opacity-50">You have</span>
                  <span className="font-bold">{s.forIcon} {s.forCrop}</span>
                  <span className="opacity-50">→ consider adding</span>
                  <span className="font-bold text-green-400">{s.compIcon} {s.companion}</span>
                </div>
              ))}
            </div>

            {!unlocked && lockedSuggestions > 0 && (
              <div className="mt-3 text-center text-[9px] font-mono uppercase opacity-30">
                +{lockedSuggestions} more suggestions hidden —{' '}
                <button onClick={() => setGateOpen(true)} className="underline hover:opacity-60">unlock</button>
              </div>
            )}
          </BrutalistBlock>
        )}

        {suggestions.length === 0 && uniqueIds.length > 0 && (
          <div className="text-[10px] font-mono uppercase opacity-30 text-center py-4">
            All known companions for your current crops are already in inventory.
          </div>
        )}
      </div>

      {/* Email gate modal */}
      {gateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <BrutalistBlock className="w-full max-w-sm" refTag="COMPANION_GATE">
            <Typography variant="h3" className="uppercase tracking-tight mb-1 text-base">
              Unlock_Companion_Advisor
            </Typography>
            <p className="text-[10px] font-mono opacity-40 uppercase mb-6">
              Free access — see all antagonist conflicts and companion pairings for your crops.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="email"
                required
                placeholder="homesteader@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
              />
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span className="text-[9px] font-mono uppercase opacity-50 leading-tight">
                  I want companion planting analysis for my garden. No spam — unsubscribe anytime.
                </span>
              </label>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setGateOpen(false)} className="flex-1" type="button">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" disabled={!consent || submitting} className="flex-1" type="submit">
                  {submitting ? "Submitting..." : "Unlock_Now"}
                </Button>
              </div>
              {submitError && (
                <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>
              )}
            </form>
          </BrutalistBlock>
        </div>
      )}
    </FieldStationLayout>
  );
}
