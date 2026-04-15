'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, AlertTriangle, Leaf, Lock, Shield } from 'lucide-react';
import Link from 'next/link';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { getDB } from '@/lib/caloric-security/db';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import type { InventoryItem } from '@/lib/caloric-security/types';
import { useFieldStation } from '@/app/context/FieldStationContext';
import { fetchWeatherData } from '@/lib/weatherApi';
import { calculatePlantingIndex } from '@/lib/plantingIndex';
import companionData from '@/content/crops/companion-planting.json';
import pestCompanionData from '@/content/crops/pest-companions.json';

// ============================================================
// Companion Advisor  [GATED]
//
// Three panels:
//   1. Pest Defense   — GDD/soil-temp-aware pest companion alerts
//   2. Conflict Alerts — crops in inventory that are antagonists
//   3. Companion Suggestions — companions not yet in inventory
//
// Panel 1 is always visible (urgency drives signups).
// Panels 2+3 locked behind the same email gate as the ROI report.
// ============================================================

const GATE_KEY  = 'hl_features_unlocked';
const FREE_CONFLICTS    = 3;
const FREE_SUGGESTIONS  = 3;

// Build a description lookup from companion-planting.json
// Key: "plantId:targetId" → { mechanism, description }
const COMPANION_DESC: Record<string, { mechanism: string; description: string }> = {};
for (const entry of companionData) {
  for (const rel of entry.relationships) {
    COMPANION_DESC[`${entry.plantId}:${rel.targetId}`] = {
      mechanism: rel.mechanism,
      description: rel.description,
    };
  }
}

// ── Pest pressure helper ──────────────────────────────────
type PestPressure = 'peak' | 'active' | 'soon' | 'dormant' | 'unknown';

function getPestPressure(soilTemp: number | null, threshold: number): PestPressure {
  if (soilTemp === null) return 'unknown';
  if (soilTemp >= threshold + 10) return 'peak';
  if (soilTemp >= threshold)      return 'active';
  if (soilTemp >= threshold - 10) return 'soon';
  return 'dormant';
}

// ── GDD-based days-until-active estimate ─────────────────────
function getDaysUntilPestActive(
  currentGDD:  number,
  gddThreshold: number,
  forecastGDD:  number,   // 14-day cumulative from calculatePlantingIndex
): number | null {
  const avgDailyGDD = forecastGDD / 14;
  if (avgDailyGDD <= 0) return null;
  const remaining = gddThreshold - currentGDD;
  if (remaining <= 0) return null;
  return Math.ceil(remaining / avgDailyGDD);
}

function getPressureLabel(
  pressure:     PestPressure,
  gddThreshold: number | undefined,
  currentGDD:   number,
  forecastGDD:  number,
): string {
  if (pressure === 'peak')    return 'PEAK — High risk now';
  if (pressure === 'active')  return 'ACTIVE — Act now';
  if (pressure === 'unknown') return '—';

  // For 'soon' and 'dormant', try to add a GDD-based day estimate
  if (gddThreshold && forecastGDD > 0) {
    const days = getDaysUntilPestActive(currentGDD, gddThreshold, forecastGDD);
    if (days !== null) {
      return pressure === 'soon'
        ? `SOON — ~${days}d (GDD)`
        : `PRE-SEASON — ~${days}d`;
    }
  }

  return pressure === 'soon' ? 'SOON — Plant defenses' : 'PRE-SEASON';
}

const PRESSURE_STYLES: Record<PestPressure, { border: string; badge: string }> = {
  peak:    { border: 'border-red-500/40 bg-red-500/5',       badge: 'text-red-400 border-red-400/60' },
  active:  { border: 'border-red-500/30 bg-red-500/3',       badge: 'text-red-400 border-red-400/40' },
  soon:    { border: 'border-orange-500/30 bg-orange-500/5', badge: 'text-orange-400 border-orange-400/50' },
  dormant: { border: 'border-green-500/20 bg-green-500/3',   badge: 'text-green-400 border-green-400/30' },
  unknown: { border: 'border-border-primary/20',             badge: 'text-foreground/30 border-border-primary/30' },
};

const EVIDENCE_STYLES: Record<string, { label: string; cls: string }> = {
  strong:   { label: 'STRONG', cls: 'text-green-400 border-green-400/50' },
  moderate: { label: 'MOD',    cls: 'text-yellow-400 border-yellow-400/50' },
  anecdotal:{ label: 'ANEC',   cls: 'text-orange-400 border-orange-400/40' },
};

// ── Pest Defense data structures ─────────────────────────

interface PestEntry {
  name: string;
  soilTempThreshold: number;
  gddThreshold?: number;
  companions: {
    companion: string;
    companionId?: string;
    reason: string;
    placement: string;
    evidenceLevel: string;
  }[];
}

interface CropPestBlock {
  cropId: string;
  cropName: string;
  cropIcon: string;
  pests: PestEntry[];
}

export default function CompanionsPage() {
  const [unlocked,    setUnlocked]    = useState(false);
  const [email,       setEmail]       = useState('');
  const [consent,     setConsent]     = useState(false);
  const [gateOpen,    setGateOpen]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Weather state for pest pressure
  const { activeLocation } = useFieldStation();
  const [soilTemp,    setSoilTemp]    = useState<number | null>(null);
  const [forecastGDD, setForecastGDD] = useState<number>(0);

  useEffect(() => {
    setUnlocked(localStorage.getItem(GATE_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (!activeLocation) return;
    fetchWeatherData(activeLocation.lat, activeLocation.lon)
      .then(w => {
        setSoilTemp(w.current.soilTemperature ?? null);
        const index = calculatePlantingIndex(w);
        setForecastGDD(index.growingDegreeDays.current);
      })
      .catch(() => {});
  }, [activeLocation]);

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

  // ── Pest Defense blocks ───────────────────────────────────
  const pestBlocks: CropPestBlock[] = [];
  for (const crop of activeCrops) {
    if (!crop) continue;
    const pestEntry = pestCompanionData.find(p => p.cropId === crop.id);
    if (!pestEntry || pestEntry.pests.length === 0) continue;
    pestBlocks.push({
      cropId: crop.id,
      cropName: crop.name,
      cropIcon: crop.icon,
      pests: pestEntry.pests as PestEntry[],
    });
  }

  // Deduplicate companion recommendations across crops for the print section
  const printBorder = new Map<string, string[]>();  // companion → cropNames[]
  const printInterplant = new Map<string, string[]>();
  for (const block of pestBlocks) {
    for (const pest of block.pests) {
      for (const comp of pest.companions) {
        const target = comp.placement === 'border' ? printBorder : printInterplant;
        const existing = target.get(comp.companion) ?? [];
        if (!existing.includes(block.cropName)) existing.push(block.cropName);
        target.set(comp.companion, existing);
      }
    }
  }

  // ── Conflict detection ────────────────────────────────────
  interface Conflict {
    cropA: string;
    iconA: string;
    cropB: string;
    iconB: string;
    description?: string;
  }

  const conflicts: Conflict[] = [];
  for (let i = 0; i < activeCrops.length; i++) {
    for (let j = i + 1; j < activeCrops.length; j++) {
      const a = activeCrops[i]!;
      const b = activeCrops[j]!;
      if (a.antagonists?.includes(b.id) || b.antagonists?.includes(a.id)) {
        const desc =
          COMPANION_DESC[`${a.id}:${b.id}`] ??
          COMPANION_DESC[`${b.id}:${a.id}`];
        conflicts.push({
          cropA: a.name, iconA: a.icon,
          cropB: b.name, iconB: b.icon,
          description: desc?.description,
        });
      }
    }
  }

  // ── Companion suggestions ─────────────────────────────────
  interface Suggestion {
    forCrop:    string;
    forIcon:    string;
    companion:  string;
    compIcon:   string;
    description?: string;
  }

  const suggestions: Suggestion[] = [];
  for (const crop of activeCrops) {
    if (!crop?.companions) continue;
    for (const compId of crop.companions) {
      if (uniqueIds.includes(compId)) continue;  // already in inventory
      const comp = getCropById(compId);
      if (!comp) continue;
      const desc =
        COMPANION_DESC[`${crop.id}:${compId}`] ??
        COMPANION_DESC[`${compId}:${crop.id}`];
      suggestions.push({
        forCrop:     crop.name,
        forIcon:     crop.icon,
        companion:   comp.name,
        compIcon:    comp.icon,
        description: desc?.description,
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

  const soilTempDisplay = soilTemp !== null ? `${Math.round(soilTemp)}°F` : '—';
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <FieldStationLayout stationId="HL_COMPANION_V1.1">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Print header (hidden on screen) ──────────────── */}
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-black">
          <div className="text-xs font-mono uppercase tracking-widest mb-1">Homesteader Labs // Pest Defense Plan</div>
          <div className="text-[10px] font-mono opacity-60">
            {currentMonth} · Soil temp: {soilTempDisplay} · GDD (base 50): {Math.round(forecastGDD)}
          </div>
        </div>

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-border-primary pb-6 print:hidden">
          <div>
            <Link
              href="/tools/caloric-security"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-40 hover:opacity-80 transition-opacity mb-3"
            >
              <ArrowLeft size={10} /> Dashboard
            </Link>
            <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono flex items-center gap-3">
              <Leaf size={20} className="opacity-60" />
              Companion Planting
            </Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              Pest defense · Antagonist alerts · Companion suggestions // {uniqueIds.length} active crops
            </Typography>
            {soilTemp !== null && (
              <div className="mt-2 text-[10px] font-mono opacity-50">
                Soil temp: <span className="text-accent">{soilTempDisplay}</span>
                {' · '}GDD (base 50): <span className="text-accent">{Math.round(forecastGDD)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="text-[9px] font-mono uppercase tracking-widest border border-border-primary/30 px-2 py-1 opacity-40 hover:opacity-70 transition-opacity"
            >
              Print Plan
            </button>
            {!unlocked && (
              <Button variant="primary" size="sm" onClick={() => setGateOpen(true)} className="flex items-center gap-2">
                <Lock size={12} /> Unlock_Full_Advisor
              </Button>
            )}
          </div>
        </div>

        {/* ── Empty state ───────────────────────────────────── */}
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

        {/* ══════════════════════════════════════════════════════
            PANEL 1 — PEST DEFENSE (always visible, no gate)
        ══════════════════════════════════════════════════════ */}
        {pestBlocks.length > 0 && (
          <BrutalistBlock refTag="PEST_DEFENSE">
            {/* Screen header */}
            <div className="flex items-center gap-2 mb-5 print:hidden">
              <Shield size={14} className="text-accent" />
              <Typography variant="h4" className="text-xs uppercase tracking-widest font-mono opacity-60 mb-0">
                Pest Defense ({pestBlocks.length} crops)
              </Typography>
              {soilTemp !== null && (
                <span className="ml-auto text-[9px] font-mono opacity-40">
                  Soil {soilTempDisplay}
                </span>
              )}
            </div>

            {/* Print section header */}
            <div className="hidden print:block mb-4">
              <div className="text-sm font-mono uppercase font-bold tracking-widest border-b border-black pb-1 mb-3">
                Pest Defense Recommendations
              </div>
            </div>

            <div className="space-y-6">
              {pestBlocks.map(block => (
                <div key={block.cropId}>
                  {/* Crop label */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{block.cropIcon}</span>
                    <span className="text-[11px] font-mono uppercase tracking-widest font-bold">
                      {block.cropName}
                    </span>
                  </div>

                  <div className="space-y-2 pl-2 border-l-2 border-border-primary/20">
                    {block.pests.map(pest => {
                      const pressure = getPestPressure(soilTemp, pest.soilTempThreshold);
                      const ps    = PRESSURE_STYLES[pressure];
                      const label = getPressureLabel(pressure, pest.gddThreshold, forecastGDD, forecastGDD);

                      return (
                        <div
                          key={pest.name}
                          className={`p-3 border ${ps.border} print:border-black/20 print:bg-transparent`}
                        >
                          {/* Pest header */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                              {pest.name.replace(/-/g, ' ')}
                            </span>
                            {/* Pressure badge (screen only) */}
                            <span className={`print:hidden text-[8px] font-mono border px-1.5 py-0.5 uppercase ${ps.badge}`}>
                              {label}
                            </span>
                            <span className="text-[8px] font-mono opacity-30 ml-auto print:hidden">
                              Soil threshold: {pest.soilTempThreshold}°F
                              {pest.gddThreshold ? ` · GDD: ${pest.gddThreshold}` : ''}
                            </span>
                            {/* Print: show threshold */}
                            <span className="hidden print:inline text-[9px] font-mono opacity-50 ml-auto">
                              active &gt;{pest.soilTempThreshold}°F soil
                            </span>
                          </div>

                          {/* Companion rows */}
                          <div className="space-y-1.5">
                            {pest.companions.map((comp, ci) => {
                              const ev = EVIDENCE_STYLES[comp.evidenceLevel] ?? EVIDENCE_STYLES.anecdotal;
                              return (
                                <div key={ci} className="flex items-start gap-2">
                                  <span className={`shrink-0 text-[8px] font-mono border px-1 py-0.5 mt-0.5 ${ev.cls} print:border-black/40 print:text-black`}>
                                    {ev.label}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-mono uppercase font-semibold">
                                        {comp.companion}
                                      </span>
                                      <span className="text-[8px] font-mono border border-border-primary/30 px-1 opacity-50 print:border-black/30">
                                        {comp.placement}
                                      </span>
                                    </div>
                                    <p className="text-[9px] font-mono opacity-40 leading-snug mt-0.5 normal-case print:opacity-70">
                                      {comp.reason}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Print: consolidated plant list */}
            <div className="hidden print:block mt-6 pt-4 border-t border-black/20">
              <div className="text-[9px] font-mono uppercase font-bold tracking-widest mb-2">
                Planting Checklist
              </div>
              {printBorder.size > 0 && (
                <div className="mb-2">
                  <div className="text-[9px] font-mono uppercase opacity-50 mb-1">Border Plants:</div>
                  {Array.from(printBorder.entries()).map(([comp, crops]) => (
                    <div key={comp} className="text-[9px] font-mono flex gap-2">
                      <span>□</span>
                      <span>{comp} — {crops.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
              {printInterplant.size > 0 && (
                <div>
                  <div className="text-[9px] font-mono uppercase opacity-50 mb-1">Interplant:</div>
                  {Array.from(printInterplant.entries()).map(([comp, crops]) => (
                    <div key={comp} className="text-[9px] font-mono flex gap-2">
                      <span>□</span>
                      <span>{comp} — with {crops.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 text-[8px] font-mono opacity-40 leading-tight">
                EVIDENCE KEY: STRONG = controlled trials · MOD = field observations + some trials · ANEC = traditional use, limited formal study
              </div>
            </div>
          </BrutalistBlock>
        )}

        {/* ══════════════════════════════════════════════════════
            PANEL 2 — CONFLICT ALERTS [GATED]
        ══════════════════════════════════════════════════════ */}
        {conflicts.length > 0 && (
          <BrutalistBlock refTag="CONFLICTS" className="print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-red-400" />
              <Typography variant="h4" className="text-xs uppercase tracking-widest font-mono opacity-60 mb-0">
                Conflicts ({conflicts.length})
              </Typography>
            </div>

            <div className="space-y-2">
              {visibleConflicts.map((c, i) => (
                <div key={i} className="p-3 border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-3 text-[10px] font-mono uppercase">
                    <AlertTriangle size={10} className="text-red-400 shrink-0" />
                    <span className="font-bold">{c.iconA} {c.cropA}</span>
                    <span className="opacity-40">antagonises</span>
                    <span className="font-bold">{c.iconB} {c.cropB}</span>
                    <span className="opacity-30 ml-auto hidden sm:block">Keep separated</span>
                  </div>
                  {c.description && (
                    <p className="mt-1.5 pl-5 text-[9px] font-mono opacity-40 normal-case leading-snug">
                      {c.description}
                    </p>
                  )}
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
          <div className="text-[10px] font-mono uppercase opacity-30 text-center py-4 print:hidden">
            ✓ No antagonist conflicts detected in current inventory.
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            PANEL 3 — COMPANION SUGGESTIONS [GATED]
        ══════════════════════════════════════════════════════ */}
        {suggestions.length > 0 && (
          <BrutalistBlock refTag="SUGGESTIONS" className="print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={14} className="text-green-400" />
              <Typography variant="h4" className="text-xs uppercase tracking-widest font-mono opacity-60 mb-0">
                Good Companions ({suggestions.length})
              </Typography>
            </div>

            <div className="space-y-2">
              {visibleSuggestions.map((s, i) => (
                <div key={i} className="p-3 border border-green-500/20 bg-green-500/5">
                  <div className="flex items-center gap-3 text-[10px] font-mono uppercase flex-wrap">
                    <Leaf size={10} className="text-green-400 shrink-0" />
                    <span className="opacity-50">You have</span>
                    <span className="font-bold">{s.forIcon} {s.forCrop}</span>
                    <span className="opacity-50">→ consider adding</span>
                    <span className="font-bold text-green-400">{s.compIcon} {s.companion}</span>
                  </div>
                  {s.description && (
                    <p className="mt-1.5 pl-5 text-[9px] font-mono opacity-40 normal-case leading-snug">
                      {s.description}
                    </p>
                  )}
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
          <div className="text-[10px] font-mono uppercase opacity-30 text-center py-4 print:hidden">
            All known companions for your current crops are already in inventory.
          </div>
        )}
      </div>

      {/* ── Email gate modal ─────────────────────────────────── */}
      {gateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <BrutalistBlock className="w-full max-w-sm" refTag="COMPANION_GATE">
            <Typography variant="h3" className="uppercase tracking-tight mb-1 text-base">
              Unlock Companion Planting
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
