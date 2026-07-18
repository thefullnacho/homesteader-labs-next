'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SetupWizard from '@/components/tools/caloric-security/SetupWizard';
import AutonomyDashboard from '@/components/tools/caloric-security/AutonomyDashboard';
import FaqAccordion from '@/components/ui/FaqAccordion';
import { Stamp } from '@/components/field/kit';
import { isFirstRun, getConfig } from '@/lib/caloric-security/homesteadStore';
import { useFieldStation } from '@/app/context/FieldStationContext';
import { fetchWeatherData } from '@/lib/weatherApi';
import type { ForecastDay } from '@/lib/weatherTypes';
import type { HomesteadConfig } from '@/lib/caloric-security/types';

// SEO FAQ — serialized as FAQPage JSON-LD for rich results
const FAQS: { q: string; a: string }[] = [
  {
    q: "How does this differ from a standard food storage calculator?",
    a: "Most food storage calculators count what's in your pantry against a fixed target, say 30 days for 4 people. This dashboard adds active and planned crops to the equation, projecting future harvests from your local growing season, and it tracks decay for stored items so the number reflects reality, not best case.",
  },
  {
    q: "What counts as \"food autonomy\"?",
    a: "The number of days your household can meet its daily caloric needs from stored food plus crops you've already planted and will harvest within the projection window. We don't count crops you might plant, only what's committed in your inventory.",
  },
  {
    q: "How accurate is the harvest projection?",
    a: "Confidence varies by crop. Mature varieties with predictable yield (potatoes, beans, winter squash) project within roughly ±20%. Annuals with weather sensitivity (tomatoes, peppers, melons) can swing 40% or more. The ledger shows the math on every projection so you can judge it yourself.",
  },
  {
    q: "Do I need to enter all my food manually?",
    a: "No. The planting calendar tool can push selected crops directly into inventory as \"planned\" items. As you log harvests via the Log Harvest button, those crops become \"stored.\" Decay tracking applies automatically based on preservation method (fresh, canned, dehydrated, frozen).",
  },
  {
    q: "Is this just for off-grid homesteaders?",
    a: "No. Suburban gardeners use it to see how a summer of canning translates to winter days-of-food. Off-grid users lean on it hardest because their water and energy autonomy matter in parallel, but the food math works regardless of grid status.",
  },
];

export default function CaloricSecurityPage() {
  const [ready, setReady]             = useState(false);
  const [needsSetup, setNeedsSetup]   = useState(false);
  const [editConfig, setEditConfig]   = useState<HomesteadConfig | null>(null);
  const [forecast, setForecast]       = useState<ForecastDay[]>([]);

  const { activeLocation } = useFieldStation();

  // First-run gate
  useEffect(() => {
    isFirstRun()
      .then(first => { setNeedsSetup(first); setReady(true); })
      .catch(() =>   { setNeedsSetup(true);  setReady(true); });
  }, []);

  // Fetch forecast for the water clock once we have a location
  useEffect(() => {
    if (!activeLocation) return;
    fetchWeatherData(activeLocation.lat, activeLocation.lon)
      .then(w => setForecast(w.forecast))
      .catch(() => setForecast([]));
  }, [activeLocation]);

  function handleEditConfig() {
    getConfig().then(cfg => {
      setEditConfig(cfg);
      setNeedsSetup(true);
    });
  }

  return (
    <>
      {/* ── Header band ─────────────────────────────────────── */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/tools/" className="hover:text-marker underline underline-offset-4">
              Workbench
            </Link>
            <span>/</span>
            <span>No. 04 · Resilience</span>
            <span className="ml-auto">All data stays in your browser</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">No account</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">Works offline</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            Three clocks. They all start the day the road closes.
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl leading-relaxed text-ink/85 italic">
            Resilience isn&apos;t how much you grow. It&apos;s how many days you can
            keep the house fed, watered, and lit with what&apos;s already on hand.
            The shortest clock is the only one that matters.
          </p>
        </div>
      </section>

      {/* ── Loading ─────────────────────────────────────────── */}
      {!ready && (
        <section className="max-w-6xl mx-auto px-4 py-24 text-center">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.3em] text-ink/50 animate-pulse">
            Opening the ledger...
          </p>
        </section>
      )}

      {/* ── First run / edit: the intake form ───────────────── */}
      {ready && needsSetup && (
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-8">
          <SetupWizard
            initialConfig={editConfig ?? undefined}
            onComplete={() => { setNeedsSetup(false); setEditConfig(null); }}
          />
        </section>
      )}

      {/* ── The working dashboard ───────────────────────────── */}
      {ready && !needsSetup && (
        <AutonomyDashboard
          forecastDays={forecast}
          onReconfigure={() => { setEditConfig(null); setNeedsSetup(true); }}
          onEditConfig={handleEditConfig}
        />
      )}

      {/* SEO anchor block — always rendered so crawlers see it regardless of state */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="max-w-3xl mt-14 pt-8 border-t-2 border-ink">
          <h2 className="font-display uppercase text-xl md:text-2xl mb-4">
            Survival garden calculator: food, water, and energy autonomy
          </h2>
          <div className="space-y-4 text-[1.02rem] leading-relaxed text-ink/85">
            <p>
              A real survival garden isn&apos;t measured in vegetables harvested.
              It&apos;s measured in <strong>days you can keep your family fed</strong>{' '}
              with what&apos;s already on hand plus what&apos;s growing. That&apos;s
              the calculation this ledger runs.
            </p>
            <p>
              Enter your household size, water catchment setup, and energy system,
              and the three clocks above tell you how many days of food, water, and
              power you can sustain without resupply. Count what you have stored,
              log harvests as they come in, and the projections update as you write.
              No subscription, no account, all data stays in your browser.
            </p>
            <p>
              This is what <strong>food self-sufficiency</strong>{' '}actually looks
              like as a number. Not a vibes-based &quot;we should grow more,&quot;
              a measurable autonomy in days. Most homesteads start around 7 to 14
              days of food in storage. Adding a quarter-acre of high-calorie crops
              typically pushes that past 90.
            </p>
          </div>

          <h3 className="font-display uppercase text-base md:text-lg mt-10 mb-4">
            Frequently asked questions
          </h3>
          <FaqAccordion faqs={FAQS} prefix="QUERY" numWidth={3} />

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
    </>
  );
}
