import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, FileText, Sprout, Mail, Eye } from 'lucide-react';
import { isSurvivalPlanPublic } from '@/lib/survivalPlan/visibility';
import { SectionHead, Stamp } from '@/components/field/kit';
import FaqAccordion from '@/components/ui/FaqAccordion';
import PreviewForm from '@/components/survivalPlan/PreviewForm';
import { encodeInputs } from '@/lib/survivalPlan/inputEncoding';

const SAMPLE_INPUT = {
  zipCode: '04401',
  adults: 2,
  kids: 2,
  dietaryRestrictions: [] as const,
  squareFeet: 250,
  gardenType: 'in-ground' as const,
  goal: 'max-calories' as const,
  experience: 'intermediate' as const,
  excludedCropIds: [] as string[],
};

const SAMPLE_TOKEN = encodeInputs({ ...SAMPLE_INPUT, dietaryRestrictions: [...SAMPLE_INPUT.dietaryRestrictions] });

const FAQS = [
  {
    q: "What exactly is in the PDF?",
    a: "A multi-page field manual: cover with your zone and frost dates, a ranked crop lineup with rationale per crop, a garden layout grid sized to your sq ft, a week-by-week sowing schedule, companion plant pairings, a caloric/macro projection with days-of-food, a preservation timeline, a seed shopping list with recommended varieties, a frost-risk action card, and field notes pages. Typically 9–12 pages total.",
  },
  {
    q: "How is this different from a generic garden planner?",
    a: "Most planners are static templates you fill in yourself. This is generated from your inputs: your ZIP determines frost dates and growing zone, your household size sets the calorie target, your goal drives which crops surface (max calories vs balanced vs preservation vs fresh eating), and your space budget allocates plants to actually-available square footage. Every PDF is different because every garden is different.",
  },
  {
    q: "What if my plan isn't quite right? Can I regenerate?",
    a: "Yes. The PDF includes a QR code that links to a live companion page where you can adjust inputs and see the new plan instantly. The companion page works on any device with a browser — no app install. You can re-render the PDF after changes (Annual Pass tier).",
  },
  {
    q: "Where does the data come from?",
    a: "Frost normals from NOAA 1991–2020 climate data via api.frost.date. Caloric and macro values from USDA nutrient databases. Yield averages from agricultural extension publications and seed catalog norms. Spacing from standard horticultural references. All calculations are documented and the underlying engine is in our open-source caloric-security toolkit.",
  },
  {
    q: "I'm a beginner — will I be overwhelmed?",
    a: "The wizard adjusts crop selection by experience level. Beginner mode filters out finicky crops (cauliflower, celery, perennials) and applies a 60% yield-realization coefficient. The PDF includes step-by-step timing for indoor starts, hardening off, and transplanting — anchored to your specific frost dates so you don't have to guess.",
  },
  {
    q: "Do the affiliate links increase the price I pay?",
    a: "No. Vendor prices are identical whether you use our links or shop direct. The lab earns a small commission on referred sales, which funds continued development. Every vendor is independently vetted for quality and ethos alignment.",
  },
  {
    q: "What's your refund policy?",
    a: "Because the PDF is generated immediately upon purchase, we don't offer refunds — but if there's a bug or your plan doesn't match your inputs, email us and we'll regenerate or refund at our discretion. Try the free 1-page preview first to see exactly what your zone produces.",
  },
];

const FEATURES = [
  { icon: MapPin,   label: 'Zone-specific',     sub: 'Frost dates + GDD computed from your ZIP' },
  { icon: Sprout,   label: 'Calorie-optimized', sub: 'Top crops by kcal-per-square-foot, ranked by your goal' },
  { icon: FileText, label: 'Designed PDF',      sub: 'Layout grid, sowing schedule, preservation timeline, companion pairings, seed list' },
  { icon: Mail,     label: 'Yours forever',     sub: 'Delivered to your inbox + downloadable for 30 days' },
];

const STEPS: [string, string, string][] = [
  ['01', 'Enter your ZIP', 'We derive your USDA zone, last frost, first frost, and growing window from NOAA normals.'],
  ['02', 'Tell us about your household', 'Adults, kids, dietary restrictions, space available, and goal (calories / preservation / fresh / balanced).'],
  ['03', 'We generate', 'Crop lineup, garden layout grid, week-by-week sowing schedule, companion pairings, preservation timeline, and a seed shopping list.'],
  ['04', 'You get the PDF', 'Multi-page field manual delivered immediately + emailed for backup.'],
];

export default function SurvivalGardenPlanLanding() {
  if (!isSurvivalPlanPublic()) notFound();

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/shop/" className="hover:text-marker underline underline-offset-4">
              Catalog
            </Link>
            <span>/</span>
            <span>Survival Garden Plan</span>
            <span className="ml-auto">$19 · one-time</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Zone-calibrated</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">Yours forever</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            A garden plan calibrated to your zone.
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Built from the same calculation engines that power our planting
            calendar, caloric-security tools, and frost-risk dashboards.
            Generated for your exact ZIP, household, and goals — not a generic
            template.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/survival-garden-plan/wizard/"
              className="inline-flex items-center bg-ink text-paper border-2 border-ink px-5 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
            >
              Build my plan — $19 <ArrowRight size={16} className="ml-2" />
            </Link>
            <Link
              href={`/survival-garden-plan/companion/?p=${SAMPLE_TOKEN}`}
              className="inline-flex items-center border-2 border-ink bg-paper px-5 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-kraft transition-colors"
            >
              <Eye size={16} className="mr-2" /> See a sample plan
            </Link>
            <a
              href="#preview"
              className="font-mono text-[0.72rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              Free 1-page preview
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        {/* What's inside */}
        <section>
          <SectionHead no="§1" title="What's inside" right="9–12 pages" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.label} className="card-paper grain p-5">
                <div className="flex items-start gap-3 relative z-[2]">
                  <f.icon size={20} className="text-marker shrink-0 mt-1" />
                  <div>
                    <p className="font-mono font-bold uppercase text-sm mb-1">{f.label}</p>
                    <p className="text-[0.95rem] text-ink/80 leading-snug">{f.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-14">
          <SectionHead no="§2" title="How it works" />
          <div className="card-paper grain">
            {STEPS.map(([n, title, sub]) => (
              <div
                key={n}
                className="flex gap-4 px-5 py-4 border-b border-dotted border-ink/40 last:border-b-0 relative z-[2]"
              >
                <span className="font-mono text-sm font-semibold text-marker shrink-0">{n}</span>
                <div>
                  <p className="font-mono font-bold uppercase text-sm">{title}</p>
                  <p className="text-[0.95rem] text-ink/80 mt-1 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Free preview */}
        <section id="preview" className="mt-14">
          <SectionHead no="§3" title="Free preview" right="1 page · your zone" />
          <div className="border-2 border-ink bg-kraft grain p-6 md:p-8 max-w-2xl">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-4 relative z-[2]">
              Enter your ZIP and email — we&apos;ll send back a 1-page calorie summary for your zone.
            </p>
            <div className="relative z-[2]">
              <PreviewForm />
            </div>
          </div>
        </section>

        {/* Product JSON-LD — eligible for Google product rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: "Survival Garden Plan",
              description:
                "Personalized survival garden plan PDF generated for your USDA zone, household size, available square footage, and goals. Includes crop selection, layout grid, sowing schedule, companion pairings, caloric projection, preservation timeline, and seed shopping list.",
              brand: { "@type": "Brand", name: "Homesteader Labs" },
              category: "Digital Garden Planning",
              offers: {
                "@type": "Offer",
                price: "19.00",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url: "https://homesteaderlabs.com/survival-garden-plan/",
              },
            }),
          }}
        />

        {/* FAQ */}
        <section className="mt-14">
          <SectionHead no="§4" title="Questions on file" />
          <FaqAccordion faqs={FAQS} prefix="PLAN" defaultOpen={0} />
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

        {/* Final CTA */}
        <section className="mt-14 no-print">
          <div className="bg-ink text-paper border-2 border-ink p-6 md:p-8 text-center">
            <p className="font-display uppercase text-xl md:text-2xl">Ready to plan</p>
            <p className="mt-3 text-[0.95rem] text-paper/75 max-w-md mx-auto leading-relaxed">
              One-time $19. PDF delivered immediately. No subscription. No data sale.
            </p>
            <Link
              href="/survival-garden-plan/wizard/"
              className="mt-5 inline-flex items-center justify-center gap-2 bg-paper text-ink border-2 border-paper px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker hover:text-paper transition-colors"
            >
              Build my plan <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Station footer */}
        <p className="mt-12 text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          NOAA frost normals · USDA nutrition data · Open-source engine
        </p>
      </div>
    </>
  );
}
