'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Lock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { UNIT_NORMALIZATIONS } from '@/lib/caloric-security/yieldCalculations';

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
    a: "Potatoes lead by a wide margin — typically 350–400 calories per square foot in good conditions. Sweet potatoes follow at 200–300. After that you're looking at winter squash (180–250) and dent corn (250–300, but with much higher water and soil-fertility demands).",
  },
  {
    q: "How big a garden do I need to feed my family?",
    a: "Common rules of thumb: 200 sq ft per person for a basic vegetable garden, 400–600 sq ft per person for a meaningful share of your diet, and 800–1,000 sq ft per person for near-complete vegetable self-sufficiency. The Caloric Security Dashboard computes your actual days-of-food from inventory and projected harvests.",
  },
  {
    q: "Is calories per square foot the only number that matters?",
    a: "No. Protein density, storage life without refrigeration, and how reliably a crop produces in your climate all matter. Beans rank lower than potatoes on calories per sq ft but are far better protein. The dashboard surfaces all three so you can see the tradeoffs.",
  },
  {
    q: "Why do salad greens rank so low?",
    a: "Greens like lettuce and spinach are mostly water (95%+) and very low in calories per 100g. They're nutritionally valuable but don't produce enough caloric mass per square foot to anchor a survival garden. Treat them as supplement, not staple.",
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

function parseFirstInt(s: string): number {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0]) : 12;
}

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
      .filter(c => c.yield && c.yield.caloriesPer100g > 0 && !c.yield['non-caloric'])
      .map(c => {
        const y           = c.yield!;
        const norm        = UNIT_NORMALIZATIONS[y.unit] ?? UNIT_NORMALIZATIONS['lbs'];
        const totalGrams  = y.avgPerPlant * norm.gramsPerUnit;
        const kcalPerPlant = (totalGrams / 100) * y.caloriesPer100g;
        const spacingIn   = parseFirstInt(c.spacing);
        const sqFtPerPlant = ((spacingIn / 12) ** 2);
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
    <FieldStationLayout stationId="HL_CALORIC_ROI_V1.0">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-border-primary pb-6">
          <div>
            <Link
              href="/tools/caloric-security"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-40 hover:opacity-80 transition-opacity mb-3"
            >
              <ArrowLeft size={10} /> Dashboard
            </Link>
            <Typography variant="h1" className="mb-1 uppercase tracking-tight font-mono text-2xl md:text-4xl flex items-center gap-3">
              <TrendingUp size={20} className="opacity-60" />
              Caloric ROI Report
            </Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              kcal per sq ft // {rows.length} crops ranked
            </Typography>
          </div>
          {!unlocked && (
            <Button variant="primary" size="sm" onClick={() => setGateOpen(true)} className="flex items-center gap-2">
              <Lock size={12} /> Unlock_Full_Report
            </Button>
          )}
        </div>

        {/* Methodology note */}
        <div className="text-[9px] font-mono uppercase opacity-30 border border-border-primary/10 px-4 py-2">
          Formula: (avg yield × unit grams / 100 × kcal/100g) ÷ (spacing² / 144) = kcal/sqft
          {' — '}Assumptions: bunches ~100g · bulbs ~40g · ears ~90g · heads ~300g
        </div>

        {/* Rankings table */}
        <BrutalistBlock refTag="ROI_RANKINGS" className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono uppercase">
            <thead>
              <tr className="border-b border-border-primary/20">
                {['Rank', 'Crop', 'Category', 'kcal/Plant', 'sqFt/Plant', 'kcal/sqFt', 'Density'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 opacity-40 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary/10">
              {visibleRows.map((row, i) => (
                <tr key={row.id} className="hover:bg-black/20 transition-colors">
                  <td className={`py-2 pr-4 tabular-nums font-bold ${i === 0 ? 'text-accent' : i < 3 ? 'opacity-70' : 'opacity-40'}`}>
                    #{i + 1}
                  </td>
                  <td className="py-2 pr-4 font-bold">
                    <span className="mr-1.5">{row.icon}</span>
                    {row.name}
                  </td>
                  <td className="py-2 pr-4 opacity-50">{row.category}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.kcalPerPlant.toLocaleString()}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.sqFtPerPlant}</td>
                  <td className="py-2 pr-4 tabular-nums font-bold text-accent">
                    {row.kcalPerSqFt.toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1">
                      <div
                        className="h-1.5 bg-accent/60"
                        style={{ width: `${Math.round((row.kcalPerSqFt / topKcal) * 60)}px`, minWidth: '2px' }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Gate overlay for locked rows */}
          {!unlocked && lockedCount > 0 && (
            <div className="border-t-2 border-border-primary/20 mt-2 pt-4 flex flex-col items-center gap-3 py-6">
              <Lock size={20} className="opacity-20" />
              <div className="text-[10px] font-mono uppercase opacity-40 text-center">
                +{lockedCount} more crops hidden — unlock full rankings
              </div>
              <Button variant="outline" size="sm" onClick={() => setGateOpen(true)} className="flex items-center gap-2">
                <Lock size={10} /> Unlock_Free_Access
              </Button>
            </div>
          )}
        </BrutalistBlock>

        {/* SEO anchor block — targets "calories per square foot" + "highest calorie crops" cluster */}
        <section className="mt-16 pt-6 border-t border-border-primary/30 max-w-3xl">
          <Typography variant="h2" className="mb-4 text-xl md:text-2xl normal-case font-mono">
            How calories per square foot ranks crops for a survival garden
          </Typography>
          <div className="space-y-4 text-sm md:text-base font-mono opacity-80 leading-relaxed">
            <p>
              When space is limited, <strong>calories per square foot</strong> is the
              most honest measure of which crops actually feed you. A 100-square-foot
              plot of lettuce produces around 1,300 calories. The same plot of potatoes
              produces over 35,000. That&apos;s a 25× difference, and it&apos;s why every
              serious survival garden starts from this number.
            </p>
            <p>
              This report ranks every crop in our database by <strong>kilocalories per
              square foot of garden space</strong>, computed from three numbers: the
              crop&apos;s average yield per plant, the calories per 100 grams of edible
              portion, and the plant&apos;s spacing requirement. No estimates,
              no marketing — just the math.
            </p>
            <p>
              The top of the list is dominated by starchy roots and tubers
              (potatoes, sweet potatoes, parsnips), winter squash (butternut, pumpkin),
              and grains where they&apos;re practical for home growers (corn, dent corn).
              Salad greens, peppers, and herbs occupy the bottom — they&apos;re worth
              growing for flavor and nutrition, but they will not be what stands between
              you and a hungry winter.
            </p>
          </div>

          <Typography variant="h3" className="mt-10 mb-4 text-base md:text-lg normal-case font-mono">
            Frequently asked questions
          </Typography>
          <dl className="space-y-6 font-mono text-sm md:text-base">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="font-bold mb-1 opacity-90">{faq.q}</dt>
                <dd className="opacity-70 leading-relaxed">{faq.a}</dd>
              </div>
            ))}
          </dl>

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
        </section>
      </div>

      {/* Email gate modal */}
      {gateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <BrutalistBlock className="w-full max-w-sm" refTag="ROI_GATE">
            <Typography variant="h3" className="uppercase tracking-tight mb-1 text-base">
              Unlock_Full_Report
            </Typography>
            <p className="text-[10px] font-mono opacity-40 uppercase mb-6">
              Free access — enter email to see all {rows.length} crops ranked by caloric density.
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
                  I want the full caloric density rankings. No spam — unsubscribe anytime.
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
