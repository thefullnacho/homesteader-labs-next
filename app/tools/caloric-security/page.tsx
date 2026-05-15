'use client';

import { useEffect, useState } from 'react';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import FieldStationBridge from '@/components/ui/FieldStationBridge';
import SetupWizard from '@/components/tools/caloric-security/SetupWizard';
import AutonomyDashboard from '@/components/tools/caloric-security/AutonomyDashboard';
import Typography from '@/components/ui/Typography';
import { isFirstRun, getConfig } from '@/lib/caloric-security/homesteadStore';
import { useFieldStation } from '@/app/context/FieldStationContext';
import { fetchWeatherData } from '@/lib/weatherApi';
import type { ForecastDay } from '@/lib/weatherTypes';
import type { HomesteadConfig } from '@/lib/caloric-security/types';

// SEO FAQ — serialized as FAQPage JSON-LD for rich results
const FAQS: { q: string; a: string }[] = [
  {
    q: "How does this differ from a standard food storage calculator?",
    a: "Most food storage calculators count what's in your pantry against a fixed target (e.g., \"30 days for 4 people\"). This dashboard adds active and planned crops to the equation — projecting future harvests using your local growing season — and tracks decay for stored items so the number reflects reality, not best case.",
  },
  {
    q: "What counts as \"food autonomy\"?",
    a: "The number of days your household can meet its daily caloric needs from stored food plus crops you've already planted and will harvest within the projection window. We don't count crops you might plant — only what's committed in your inventory.",
  },
  {
    q: "How accurate is the harvest projection?",
    a: "Confidence varies by crop. Mature varieties with predictable yield (potatoes, beans, winter squash) project within roughly ±20%. Annuals with weather sensitivity (tomatoes, peppers, melons) can swing 40%+. The dashboard surfaces a confidence indicator on every projection so you can read the math.",
  },
  {
    q: "Do I need to enter all my food manually?",
    a: "No. The planting calendar tool can push selected crops directly into inventory as \"planned\" items. As you log harvests via the Log Harvest button, those crops become \"stored.\" Decay tracking applies automatically based on preservation method (fresh, canned, dehydrated, frozen).",
  },
  {
    q: "Is this just for off-grid homesteaders?",
    a: "No. Suburban gardeners use it to see how a summer of canning translates to winter days-of-food. Off-grid users lean on it most heavily because their water and energy autonomy matter in parallel — but the food math works regardless of grid status.",
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
    <FieldStationLayout stationId="HL_CALORIC_SEC_V1.0">
      {/* Conditional UI by state */}
      {!ready && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <span className="text-xs font-mono uppercase opacity-30 animate-pulse">
            Loading...
          </span>
        </div>
      )}

      {ready && needsSetup && (
        <SetupWizard
          initialConfig={editConfig ?? undefined}
          onComplete={() => { setNeedsSetup(false); setEditConfig(null); }}
        />
      )}

      {ready && !needsSetup && (
        <AutonomyDashboard
          forecastDays={forecast}
          onReconfigure={() => { setEditConfig(null); setNeedsSetup(true); }}
          onEditConfig={handleEditConfig}
        />
      )}

      {/* SEO anchor block — always rendered so crawlers see it regardless of state */}
      <section className="mt-16 pt-6 border-t border-border-primary/30 max-w-3xl">
        <Typography variant="h2" className="mb-4 text-xl md:text-2xl normal-case font-mono">
          Survival garden calculator — food, water, and energy autonomy
        </Typography>
        <div className="space-y-4 text-sm md:text-base font-mono opacity-80 leading-relaxed">
          <p>
            A real survival garden isn&apos;t measured in vegetables harvested. It&apos;s
            measured in <strong>days you can keep your family fed</strong> with what&apos;s
            already on hand plus what&apos;s growing. That&apos;s the calculation this
            dashboard runs.
          </p>
          <p>
            Enter your household size, water catchment setup, and energy system, and the
            three clocks above tell you how many days of food, water, and energy you can
            sustain without resupply. Inventory what you have stored, log harvests as they
            come in, and the projections update in real time. No subscription, no account,
            all data stays in your browser.
          </p>
          <p>
            This is what <strong>food self-sufficiency</strong> actually looks like as a
            number — not a vibes-based &quot;we should grow more&quot;; a measurable
            autonomy in days. Most homesteads start around 7–14 days of food in storage.
            Adding a quarter-acre of high-calorie crops typically pushes that past 90.
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

      {ready && !needsSetup && <FieldStationBridge currentOps="SURVIVAL" />}
    </FieldStationLayout>
  );
}
