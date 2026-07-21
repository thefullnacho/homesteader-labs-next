'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Lock, X } from 'lucide-react';
import Link from 'next/link';
import DrawerBand from '@/components/tools/caloric-security/DrawerBand';
import { SectionHead, Stamp } from '@/components/field/kit';
import { getDB } from '@/lib/caloric-security/db';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import type { InventoryItem } from '@/lib/caloric-security/types';
import { useFieldStation } from '@/app/context/FieldStationContext';
import { fetchWeatherData } from '@/lib/weatherApi';
import { calculatePlantingIndex } from '@/lib/plantingIndex';
import companionData from '@/content/crops/companion-planting.json';
import pestCompanionData from '@/content/crops/pest-companions.json';
import FaqAccordion from '@/components/ui/FaqAccordion';

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

// SEO FAQ — serialized as FAQPage JSON-LD for rich results
const FAQS: { q: string; a: string }[] = [
  {
    q: "When do cucumber beetles emerge?",
    a: "Striped cucumber beetles overwinter as adults and emerge in spring once soil temperatures cross 50–55°F and growing degree day (GDD) accumulation reaches around 150 (base 50°F). In most of zone 6 that's mid-to-late May; in warmer zones, earlier. The advisor tracks your specific GDD and updates the activity status (DORMANT, PRE-SEASON, ACTIVE, PEAK) in real time.",
  },
  {
    q: "When do squash bugs emerge?",
    a: "Squash bug adults activate when soil temperatures exceed 65°F at four inches deep, typically one to two weeks after squash transplant. They lay eggs on leaf undersides; first-generation nymphs appear 7–10 days later. The advisor flags this transition automatically once your soil temp crosses the threshold.",
  },
  {
    q: "Does companion planting actually work?",
    a: "Some pairings have strong evidence (basil with tomatoes, marigolds suppressing nematodes, three sisters mutually supporting each other). Others are folklore. The advisor tags each suggested pairing with an evidence level: peer-reviewed, observational, or traditional, so you can decide what's worth the garden space.",
  },
  {
    q: "Why not just use a static companion planting chart?",
    a: "Static charts give you the theoretical set of companion pairs. They don't tell you which pests are active in your garden right now, or which deterrent plants are still effective at this point in the season. This advisor adds that real-time layer using your local soil temperature and GDD.",
  },
  {
    q: "What pests are tracked?",
    a: "Cucumber beetles (striped + spotted), squash bugs, vine borers, aphids, cabbage loopers, tomato hornworm, flea beetles, Colorado potato beetles, Mexican bean beetles, and a handful of regional minor pests. Each one has soil-temp + GDD thresholds calibrated against extension service data.",
  },
];

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
  if (pressure === 'peak')    return 'PEAK · high risk now';
  if (pressure === 'active')  return 'ACTIVE · act now';
  if (pressure === 'unknown') return '—';

  // For 'soon' and 'dormant', try to add a GDD-based day estimate
  if (gddThreshold && forecastGDD > 0) {
    const days = getDaysUntilPestActive(currentGDD, gddThreshold, forecastGDD);
    if (days !== null) {
      return pressure === 'soon'
        ? `SOON · ~${days} d by GDD`
        : `PRE-SEASON · ~${days} d`;
    }
  }

  return pressure === 'soon' ? 'SOON · plant defenses' : 'PRE-SEASON';
}

const PRESSURE_STYLES: Record<PestPressure, { border: string; badge: string }> = {
  peak:    { border: 'border-rust',    badge: 'text-rust border-rust' },
  active:  { border: 'border-rust',    badge: 'text-rust border-rust' },
  soon:    { border: 'border-marker',  badge: 'text-marker border-marker' },
  dormant: { border: 'border-ink/40',  badge: 'text-moss border-moss' },
  unknown: { border: 'border-ink/40',  badge: 'text-ink/40 border-ink/40' },
};

const EVIDENCE_STYLES: Record<string, { label: string; cls: string }> = {
  strong:   { label: 'STRONG', cls: 'text-moss border-moss' },
  moderate: { label: 'MOD',    cls: 'text-slateblue border-slateblue' },
  anecdotal:{ label: 'ANEC',   cls: 'text-marker border-marker' },
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

const FIELD_INPUT = 'w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40';
const BTN_GHOST   = 'px-4 py-2.5 border-2 border-ink bg-paper font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-kraft transition-colors';
const BTN_SOLID   = 'px-4 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60';

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
    <>
      {/* ── Print header (hidden on screen) ──────────────── */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-black px-4">
        <div className="text-xs font-mono uppercase tracking-widest mb-1">Homesteader Labs · Pest Defense Plan</div>
        <div className="text-[10px] font-mono opacity-60">
          {currentMonth} · Soil temp: {soilTempDisplay} · GDD (base 50): {Math.round(forecastGDD)}
        </div>
      </div>

      <div className="print:hidden">
        <DrawerBand
          drawer="Companions"
          title="Who grows well beside whom"
          sub={`Pest defense, antagonist alerts, and pairings for the ${uniqueIds.length} crop${uniqueIds.length !== 1 ? 's' : ''} you're growing.`}
          right={
            <>
              <button onClick={() => window.print()} className={BTN_GHOST}>
                Print the plan
              </button>
              {!unlocked && (
                <button onClick={() => setGateOpen(true)} className={`${BTN_SOLID} flex items-center gap-2`}>
                  <Lock size={12} /> Unlock it all
                </button>
              )}
            </>
          }
        />
      </div>

      {soilTemp !== null && (
        <div className="max-w-5xl mx-auto px-4 pt-6 print:hidden">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60">
            Soil temp <strong className="text-marker">{soilTempDisplay}</strong>
            {' '}· GDD base 50 <strong className="text-marker">{Math.round(forecastGDD)}</strong>
            {' '}· pressure calls below use these numbers
          </p>
        </div>
      )}

      <section className="max-w-5xl mx-auto px-4 pt-8 pb-16 space-y-12">

        {/* ── Empty state ───────────────────────────────────── */}
        {uniqueIds.length === 0 && (
          <div className="border-2 border-dashed border-ink/40 p-10 text-center print:hidden">
            <p className="font-display uppercase text-xl mb-2">Nothing growing on paper yet</p>
            <p className="text-ink/70 max-w-md mx-auto">
              The advisor reads from your{' '}
              <Link href="/tools/caloric-security/inventory/" className="underline underline-offset-4 hover:text-marker">
                stock book
              </Link>
              . Add planned or in-the-ground crops and the pest calls, conflicts,
              and pairings fill in.
            </p>
          </div>
        )}

        {/* PANEL 1 — PEST DEFENSE (always visible, no gate) */}
        {pestBlocks.length > 0 && (
          <div>
            <div className="print:hidden">
              <SectionHead
                no="§1"
                title="Pest Defense"
                right={soilTemp !== null ? `soil ${soilTempDisplay}` : 'add a location for live calls'}
              />
            </div>
            <div className="hidden print:block mb-4">
              <div className="text-sm font-mono uppercase font-bold tracking-widest border-b border-black pb-1 mb-3">
                Pest Defense Recommendations
              </div>
            </div>

            <div className="space-y-8">
              {pestBlocks.map(block => (
                <div key={block.cropId}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{block.cropIcon}</span>
                    <span className="font-display uppercase text-lg">{block.cropName}</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {block.pests.map(pest => {
                      const pressure = getPestPressure(soilTemp, pest.soilTempThreshold);
                      const ps    = PRESSURE_STYLES[pressure];
                      const label = getPressureLabel(pressure, pest.gddThreshold, forecastGDD, forecastGDD);

                      return (
                        <div
                          key={pest.name}
                          className={`border-2 bg-paper p-4 ${ps.border} print:border-black/20`}
                        >
                          {/* Pest header */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap border-b border-dotted border-ink/40 pb-2">
                            <span className="font-mono text-[0.72rem] uppercase tracking-wider font-bold">
                              {pest.name.replace(/-/g, ' ')}
                            </span>
                            <span className={`print:hidden font-mono text-[0.6rem] uppercase tracking-wide border px-1.5 py-0.5 ${ps.badge}`}>
                              {label}
                            </span>
                            <span className="font-mono text-[0.6rem] uppercase text-ink/45 ml-auto print:hidden">
                              &gt;{pest.soilTempThreshold}°F soil
                              {pest.gddThreshold ? ` · GDD ${pest.gddThreshold}` : ''}
                            </span>
                            <span className="hidden print:inline text-[9px] font-mono opacity-50 ml-auto">
                              active &gt;{pest.soilTempThreshold}°F soil
                            </span>
                          </div>

                          {/* Companion rows */}
                          <div className="space-y-2">
                            {pest.companions.map((comp, ci) => {
                              const ev = EVIDENCE_STYLES[comp.evidenceLevel] ?? EVIDENCE_STYLES.anecdotal;
                              return (
                                <div key={ci} className="flex items-start gap-2">
                                  <span className={`shrink-0 font-mono text-[0.58rem] border px-1 py-0.5 mt-0.5 ${ev.cls} print:border-black/40 print:text-black`}>
                                    {ev.label}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-[0.72rem] uppercase font-semibold">
                                        {comp.companion}
                                      </span>
                                      <span className="font-mono text-[0.58rem] uppercase border border-ink/40 text-ink/55 px-1 print:border-black/30">
                                        {comp.placement}
                                      </span>
                                    </div>
                                    <p className="text-[0.82rem] text-ink/70 leading-snug mt-0.5 print:opacity-70">
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
                      <span>{comp}, for {crops.join(', ')}</span>
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
                      <span>{comp}, with {crops.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 text-[8px] font-mono opacity-40 leading-tight">
                EVIDENCE KEY: STRONG = controlled trials · MOD = field observations + some trials · ANEC = traditional use, limited formal study
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2 — CONFLICT ALERTS [GATED] */}
        {conflicts.length > 0 && (
          <div className="print:hidden">
            <SectionHead no="§2" title="Bad Neighbors" right={`${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''} on the plot`} />
            <div className="space-y-3">
              {visibleConflicts.map((c, i) => (
                <div key={i} className="border-2 border-rust bg-paper px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <AlertTriangle size={13} className="text-rust shrink-0" />
                    <span className="font-semibold text-[0.95rem]">{c.iconA} {c.cropA}</span>
                    <span className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/55">antagonises</span>
                    <span className="font-semibold text-[0.95rem]">{c.iconB} {c.cropB}</span>
                    <Stamp color="text-rust" className="ml-auto hidden sm:inline-flex">Keep apart</Stamp>
                  </div>
                  {c.description && (
                    <p className="mt-1.5 pl-6 text-[0.85rem] text-ink/70 leading-snug">
                      {c.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!unlocked && lockedConflicts > 0 && (
              <p className="mt-3 text-center font-mono text-[0.68rem] uppercase tracking-wider text-ink/55">
                {lockedConflicts} more behind the gate.{' '}
                <button onClick={() => setGateOpen(true)} className="underline underline-offset-4 hover:text-marker">
                  Unlock it
                </button>
              </p>
            )}
          </div>
        )}

        {conflicts.length === 0 && uniqueIds.length > 0 && (
          <p className="font-hand font-semibold text-moss text-xl -rotate-1 print:hidden">
            ✓ no antagonists on the plot, everything gets along
          </p>
        )}

        {/* PANEL 3 — COMPANION SUGGESTIONS [GATED] */}
        {suggestions.length > 0 && (
          <div className="print:hidden">
            <SectionHead no="§3" title="Good Company" right={`${suggestions.length} pairing${suggestions.length !== 1 ? 's' : ''} worth the space`} />
            <div className="space-y-3">
              {visibleSuggestions.map((s, i) => (
                <div key={i} className="border-2 border-ink bg-paper px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/55">You grow</span>
                    <span className="font-semibold text-[0.95rem]">{s.forIcon} {s.forCrop}</span>
                    <span className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/55">so consider</span>
                    <span className="font-semibold text-[0.95rem] text-moss">{s.compIcon} {s.companion}</span>
                  </div>
                  {s.description && (
                    <p className="mt-1.5 text-[0.85rem] text-ink/70 leading-snug">
                      {s.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!unlocked && lockedSuggestions > 0 && (
              <p className="mt-3 text-center font-mono text-[0.68rem] uppercase tracking-wider text-ink/55">
                {lockedSuggestions} more behind the gate.{' '}
                <button onClick={() => setGateOpen(true)} className="underline underline-offset-4 hover:text-marker">
                  Unlock it
                </button>
              </p>
            )}
          </div>
        )}

        {suggestions.length === 0 && uniqueIds.length > 0 && (
          <p className="text-center font-mono text-[0.68rem] uppercase tracking-wider text-ink/55 print:hidden">
            Every known companion for your crops is already in the book.
          </p>
        )}

        {/* SEO anchor block — targets "when do [pest] emerge" cluster + companion planting */}
        <div className="max-w-3xl pt-8 border-t-2 border-ink print:hidden">
          <h2 className="font-display uppercase text-xl md:text-2xl mb-4">
            A pest emergence calendar driven by your local GDD
          </h2>
          <div className="space-y-4 text-[1.02rem] leading-relaxed text-ink/85">
            <p>
              Static companion-planting charts and pest-emergence tables are everywhere.
              The problem: pests don&apos;t read the calendar. Cucumber beetles emerge
              when <em>your</em>{' '}spring crosses roughly 150 GDD, not on May 15. Squash
              bugs activate at soil temperatures above 65°F, not at &quot;summer.&quot;
            </p>
            <p>
              This advisor flips the model. It tracks live growing degree days and soil
              temperature for your location and tells you which pests are emerging{' '}
              <em>right now</em>, not on historical average. For each crop in your
              inventory, it surfaces the relevant pest pressures with current activity
              status (<strong>dormant, pre-season, active, peak</strong>) and ranks the
              companion plants that deter or trap each pest.
            </p>
            <p>
              The result is actionable: &quot;Your cucumber beetles will hit peak
              activity in 6 days at current heat accumulation. Plant nasturtiums and
              tansy now to maximize trap-crop and repellent effect.&quot;
            </p>
          </div>

          <h3 className="font-display uppercase text-base md:text-lg mt-10 mb-4">
            Frequently asked questions
          </h3>
          <FaqAccordion faqs={FAQS} prefix="PEST" defaultOpen={0} />

          {/* FAQPage JSON-LD — eligible for Google rich results */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQS.map(({ q, a }) => ({
                  "@type": "Question",
                  name: q,
                  acceptedAnswer: { "@type": "Answer", text: a },
                })),
              }),
            }}
          />
        </div>
      </section>

      {/* ── Email gate modal ─────────────────────────────────── */}
      {gateOpen && createPortal(
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-[100]">
          <div className="card-paper grain w-full max-w-sm">
            <div className="flex justify-between items-center px-5 py-3 border-b-2 border-ink relative z-[2]">
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em]">
                The full advisor
              </span>
              <button onClick={() => setGateOpen(false)} aria-label="Close" className="hover:text-marker">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 relative z-[2]">
              <p className="text-[0.95rem] text-ink/80 leading-snug mb-5">
                Free with an email: every antagonist conflict and companion
                pairing for your crops, unlocked on this device for good.
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="homesteader@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={FIELD_INPUT}
                />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-1 accent-marker"
                    required
                  />
                  <span className="font-mono text-[0.64rem] uppercase tracking-wide text-ink/60 leading-tight">
                    I want companion planting analysis for my garden. No spam, unsubscribe anytime.
                  </span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setGateOpen(false)} className={`${BTN_GHOST} flex-1`}>
                    Cancel
                  </button>
                  <button type="submit" disabled={!consent || submitting} className={`${BTN_SOLID} flex-1`}>
                    {submitting ? 'Unlocking...' : 'Unlock it'}
                  </button>
                </div>
                {submitError && (
                  <p className="px-3 py-2 border-2 border-rust text-rust font-mono text-[0.7rem]">
                    Something went wrong. Try it again.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
