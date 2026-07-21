'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X } from 'lucide-react';
import DrawerBand from '@/components/tools/caloric-security/DrawerBand';
import { getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { UNIT_NORMALIZATIONS } from '@/lib/caloric-security/yieldCalculations';
import FaqAccordion from '@/components/ui/FaqAccordion';

// ============================================================
// Caloric ROI Report  [GATED]
//
// Ranks every crop in the database by kcal per square foot
// of garden space. Uses:
//   - crop.yield.avgPerPlant × unit normalization → total grams
//   - caloriesPer100g → kcalPerPlant
//   - crop.spacing parsed to inches → sqFt per plant
//
// Top FREE_ROWS rows are visible to all users.
// Full list unlocks after email capture (localStorage flag).
// ============================================================

const FREE_ROWS    = 5;
const GATE_KEY     = 'hl_features_unlocked';

// SEO FAQ — serialized as FAQPage JSON-LD for rich results
const FAQS: { q: string; a: string }[] = [
  {
    q: "What's the highest calorie crop you can grow at home?",
    a: "Densely planted roots lead, because you fit so many into a small bed. Parsnips and carrots clear 1,000 calories per square foot, with beets and onions close behind in the 500 to 600 range. Potatoes and other row-spaced tubers land around 350 to 400, lower per square foot than the tight roots but far easier to store through a winter. Sprawling crops like winter squash, melons, and corn rank near the bottom despite big per-plant yields, because each plant claims so much ground.",
  },
  {
    q: "How big a garden do I need to feed my family?",
    a: "Common rules of thumb: 200 sq ft per person for a basic vegetable garden, 400–600 sq ft per person for a meaningful share of your diet, and 800–1,000 sq ft per person for near-complete vegetable self-sufficiency. The resilience dashboard computes your actual days-of-food from inventory and projected harvests.",
  },
  {
    q: "Is calories per square foot the only number that matters?",
    a: "No. Protein density, storage life without refrigeration, and how reliably a crop produces in your climate all matter. Beans rank lower than potatoes on calories per sq ft but are far better protein. The dashboard surfaces all three so you can see the tradeoffs.",
  },
  {
    q: "Why do salad greens rank so low?",
    a: "Head greens like lettuce are mostly water (95%+) and very low in calories per 100g. Even planted intensively, a square foot of lettuce returns under 50 calories, against a few hundred for spinach and over a thousand for tight-spaced roots. They earn their place for vitamins and fresh eating, not caloric mass, so treat them as supplement, not staple.",
  },
  {
    q: "Where does this data come from?",
    a: "USDA nutrient data for calories per 100g; published yield averages from agricultural extensions; standard spacing recommendations from seed catalogs and extension services. The methodology and per-crop assumptions are documented in our archive.",
  },
];

interface RoiRow {
  id:          string;
  name:        string;
  icon:        string;
  category:    string;
  kcalPerPlant: number;
  sqFtPerPlant: number;
  kcalPerSqFt:  number;
}

// Spacing strings look like `18-24" apart`, `6' apart`, `3-5' apart`, or
// `12" apart (blocks of 9)`. Read the leading range and its unit: an
// apostrophe means feet, a double-quote (or nothing) means inches. Use the
// range midpoint, and always return inches so callers get one unit.
function parseSpacingInches(s: string): number {
  if (!s) return 12;
  const m = s.match(/^\s*(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(['"′″])?/);
  if (!m) return 12;
  const lo = parseFloat(m[1]);
  const hi = m[2] ? parseFloat(m[2]) : lo;
  const mid = (lo + hi) / 2;
  const feet = m[3] === "'" || m[3] === '′';
  return feet ? mid * 12 : mid;
}

const FIELD_INPUT = 'w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40';
const BTN_GHOST   = 'px-4 py-2.5 border-2 border-ink bg-paper font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-kraft transition-colors';
const BTN_SOLID   = 'px-4 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60';

export default function RoiPage() {
  const [unlocked,     setUnlocked]     = useState(false);
  const [email,        setEmail]        = useState('');
  const [consent,      setConsent]      = useState(false);
  const [gateOpen,     setGateOpen]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(GATE_KEY) === 'true');
  }, []);

  const rows: RoiRow[] = useMemo(() => {
    return getAllCrops()
      // Herbs are excluded: their calories-per-100g are culinary trace amounts,
      // not dietary staples. They belong in a tonics/medicinals tool, not a
      // caloric ROI ranking. Only food crops (vegetables + fruit) compete here.
      .filter(c => c.category !== 'herb' && c.yield && c.yield.caloriesPer100g > 0 && !c.yield['non-caloric'])
      .map(c => {
        const y           = c.yield!;
        const norm        = UNIT_NORMALIZATIONS[y.unit] ?? UNIT_NORMALIZATIONS['lbs'];
        const totalGrams  = y.avgPerPlant * norm.gramsPerUnit;
        const kcalPerPlant = (totalGrams / 100) * y.caloriesPer100g;
        // Footprint = in-row spacing × between-row spacing. Row/field crops carry
        // an explicit rowSpacing; intensively bedded crops (roots, greens) grow at
        // equidistant spacing, so the footprint falls back to spacing².
        const inRowIn      = parseSpacingInches(c.spacing);
        const rowIn        = c.rowSpacing ? parseSpacingInches(c.rowSpacing) : inRowIn;
        const sqFtPerPlant = (inRowIn * rowIn) / 144;
        const kcalPerSqFt  = sqFtPerPlant > 0 ? kcalPerPlant / sqFtPerPlant : 0;
        return {
          id:          c.id,
          name:        c.name,
          icon:        c.icon,
          category:    c.category,
          kcalPerPlant: Math.round(kcalPerPlant),
          sqFtPerPlant: Math.round(sqFtPerPlant * 10) / 10,
          kcalPerSqFt:  Math.round(kcalPerSqFt),
        };
      })
      .filter(r => r.kcalPerSqFt > 0)
      .sort((a, b) => b.kcalPerSqFt - a.kcalPerSqFt);
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "roi-unlock" }),
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

  const visibleRows  = unlocked ? rows : rows.slice(0, FREE_ROWS);
  const lockedCount  = rows.length - FREE_ROWS;
  const topKcal      = rows[0]?.kcalPerSqFt ?? 1;

  return (
    <>
      <DrawerBand
        drawer="Caloric ROI"
        title="What every square foot pays"
        sub={`${rows.length} crops ranked by calories per square foot. The order is not what the seed catalog implies.`}
        right={!unlocked && (
          <button onClick={() => setGateOpen(true)} className={`${BTN_SOLID} flex items-center gap-2`}>
            <Lock size={12} /> Unlock the full list
          </button>
        )}
      />

      <section className="max-w-5xl mx-auto px-4 pt-10 pb-16 space-y-6">

        {/* Methodology note */}
        <p className="font-mono text-[0.64rem] uppercase tracking-wide text-ink/50 border-2 border-dotted border-ink/40 px-4 py-2.5">
          The math: (avg yield × unit grams ÷ 100 × kcal/100 g) ÷ (in-row × row spacing ÷ 144) = kcal/sq ft.
          Row crops use catalog row spacing; intensively bedded crops use equidistant spacing.
          Assumptions: bunches ~100 g · bulbs ~40 g · ears ~90 g · heads ~300 g
        </p>

        {/* Rankings table */}
        <div className="card-paper grain overflow-hidden">
          <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
            <table className="w-full font-mono text-[0.76rem] min-w-[600px]">
              <thead>
                <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                  <th className="py-1.5 pr-3 font-semibold">Rank</th>
                  <th className="py-1.5 pr-3 font-semibold">Crop</th>
                  <th className="py-1.5 pr-3 font-semibold">Category</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">kcal/plant</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">sq ft/plant</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">kcal/sq ft</th>
                  <th className="py-1.5 font-semibold">Density</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr key={row.id} className="h-[36px]">
                    <td className={`pr-3 tabular-nums font-bold ${i === 0 ? 'text-marker' : i < 3 ? '' : 'text-ink/50'}`}>
                      #{i + 1}
                    </td>
                    <td className="pr-3 font-semibold">
                      <span className="mr-1.5">{row.icon}</span>
                      {row.name}
                    </td>
                    <td className="pr-3 text-ink/60">{row.category}</td>
                    <td className="pr-3 tabular-nums text-right">{row.kcalPerPlant.toLocaleString()}</td>
                    <td className="pr-3 tabular-nums text-right">{row.sqFtPerPlant}</td>
                    <td className="pr-3 tabular-nums text-right font-bold text-marker">
                      {row.kcalPerSqFt.toLocaleString()}
                    </td>
                    <td>
                      <div
                        className="h-2.5 bg-marker/70 border border-ink/40"
                        style={{ width: `${Math.round((row.kcalPerSqFt / topKcal) * 60)}px`, minWidth: '2px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Gate for locked rows */}
            {!unlocked && lockedCount > 0 && (
              <div className="border-t-2 border-ink mt-2 py-6 flex flex-col items-center gap-3">
                <p className="font-mono text-[0.72rem] uppercase tracking-wider text-ink/60 text-center">
                  {lockedCount} more crops below the fold
                </p>
                <button onClick={() => setGateOpen(true)} className={`${BTN_GHOST} flex items-center gap-2`}>
                  <Lock size={11} /> Unlock the full list
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SEO anchor block — targets "calories per square foot" + "highest calorie crops" cluster */}
        <div className="max-w-3xl mt-14 pt-8 border-t-2 border-ink">
          <h2 className="font-display uppercase text-xl md:text-2xl mb-4">
            How calories per square foot ranks crops for a survival garden
          </h2>
          <div className="space-y-4 text-[1.02rem] leading-relaxed text-ink/85">
            <p>
              When space is limited, <strong>calories per square foot</strong>{' '}is the
              most honest measure of which crops actually feed you. A 100-square-foot
              plot of lettuce produces around 4,900 calories. The same plot of potatoes
              produces roughly 37,000. That&apos;s nearly an 8× difference, and it&apos;s why every
              serious survival garden starts from this number.
            </p>
            <p>
              This report ranks every crop in our database by <strong>kilocalories per
              square foot of garden space</strong>, computed from three numbers: the
              crop&apos;s average yield per plant, the calories per 100 grams of edible
              portion, and the ground each plant actually occupies (in-row spacing for
              intensively bedded crops, in-row times row spacing for field crops). No
              estimates, no marketing, just the math.
            </p>
            <p>
              The top of the list is dominated by densely planted roots (parsnips,
              carrots, beets, onions) and hilled tubers (potatoes), which pack calories
              into a small footprint. Sprawling crops fall to the bottom: winter squash,
              melons, cucumbers, sweet corn, and fruit trees claim many square feet per
              plant, so their high per-plant yield spreads thin. Head greens and
              slow brassicas like broccoli sit low too. They&apos;re worth growing for
              flavor and nutrition, but they will not be what stands between you and a
              hungry winter.
            </p>
          </div>

          <h3 className="font-display uppercase text-base md:text-lg mt-10 mb-4">
            Frequently asked questions
          </h3>
          <FaqAccordion faqs={FAQS} prefix="DATA" />

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

      {/* Email gate modal */}
      {gateOpen && createPortal(
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-[100]">
          <div className="card-paper grain w-full max-w-sm">
            <div className="flex justify-between items-center px-5 py-3 border-b-2 border-ink relative z-[2]">
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em]">
                The full list
              </span>
              <button onClick={() => setGateOpen(false)} aria-label="Close" className="hover:text-marker">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 relative z-[2]">
              <p className="text-[0.95rem] text-ink/80 leading-snug mb-5">
                Free with an email: all {rows.length} crops ranked by caloric
                density, unlocked on this device for good.
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
                    I want the full caloric density rankings. No spam, unsubscribe anytime.
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
