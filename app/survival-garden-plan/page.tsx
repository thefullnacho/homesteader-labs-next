import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, FileText, Sprout, Mail, Eye } from 'lucide-react';
import { isSurvivalPlanPublic } from '@/lib/survivalPlan/visibility';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
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
  { icon: MapPin,   label: 'Zone-specific',          sub: 'Frost dates + GDD computed from your ZIP' },
  { icon: Sprout,   label: 'Calorie-optimized',      sub: 'Top crops by kcal-per-square-foot, ranked by your goal' },
  { icon: FileText, label: 'Designed PDF',           sub: 'Layout grid, sowing schedule, preservation timeline, companion pairings, seed list' },
  { icon: Mail,     label: 'Yours forever',          sub: 'Delivered to your inbox + downloadable for 30 days' },
];

export default function SurvivalGardenPlanLanding() {
  if (!isSurvivalPlanPublic()) notFound();

  return (
    <FieldStationLayout stationId="SGP_LANDING" gridLines>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        <header className="space-y-4">
          <Typography variant="small" className="font-mono opacity-50 uppercase tracking-widest">
            Homesteader_Labs // Survival_Garden_Plan
          </Typography>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight leading-none">
            A garden plan<br />
            <span className="text-accent">calibrated to your zone.</span>
          </h1>
          <p className="text-base md:text-lg opacity-70 max-w-2xl font-mono leading-relaxed">
            Built from the same calculation engines that power our planting calendar, caloric-security tools, and frost-risk dashboards. Generated for your exact ZIP, household, and goals — not a generic template.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="primary" size="lg" href="/survival-garden-plan/wizard/">
              Build my plan — $19 <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button variant="outline" size="lg" href={`/survival-garden-plan/companion/?p=${SAMPLE_TOKEN}`}>
              <Eye size={16} className="mr-2" /> See a sample plan
            </Button>
            <Button variant="ghost" size="lg" href="#preview">
              Free 1-page preview
            </Button>
          </div>
        </header>

        <section>
          <Typography variant="h3" className="uppercase tracking-tight mb-6 text-accent">What&apos;s_Inside</Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <BrutalistBlock key={f.label} refTag={f.label.replace(/[^A-Z]/g, '').slice(0, 6)}>
                <div className="flex items-start gap-3">
                  <f.icon size={20} className="text-accent shrink-0 mt-1" />
                  <div>
                    <p className="font-mono font-bold uppercase text-sm mb-1">{f.label}</p>
                    <p className="text-xs font-mono opacity-60 leading-relaxed">{f.sub}</p>
                  </div>
                </div>
              </BrutalistBlock>
            ))}
          </div>
        </section>

        <section>
          <Typography variant="h3" className="uppercase tracking-tight mb-6 text-accent">How_It_Works</Typography>
          <div className="space-y-3">
            {[
              ['01', 'Enter your ZIP', 'We derive your USDA zone, last frost, first frost, and growing window from NOAA normals.'],
              ['02', 'Tell us about your household', 'Adults, kids, dietary restrictions, space available, and goal (calories / preservation / fresh / balanced).'],
              ['03', 'We generate', 'Crop lineup, garden layout grid, week-by-week sowing schedule, companion pairings, preservation timeline, and a seed shopping list.'],
              ['04', 'You get the PDF', 'Multi-page field manual delivered immediately + emailed for backup.'],
            ].map(([n, title, sub]) => (
              <div key={n} className="flex gap-4 border-l-2 border-accent pl-4 py-2">
                <span className="text-xs font-mono opacity-40">{n}</span>
                <div>
                  <p className="font-mono font-bold uppercase text-sm">{title}</p>
                  <p className="text-xs font-mono opacity-60 mt-1 leading-relaxed">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="preview">
          <BrutalistBlock variant="accent" refTag="PREVIEW">
            <div className="space-y-4">
              <div>
                <Typography variant="h3" className="uppercase tracking-tight mb-1">Free_Preview</Typography>
                <p className="text-xs font-mono opacity-60 uppercase">
                  Enter your ZIP and email — we&apos;ll send back a 1-page calorie summary for your zone.
                </p>
              </div>
              <PreviewForm />
            </div>
          </BrutalistBlock>
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

        <section>
          <Typography variant="h3" className="uppercase tracking-tight mb-6 text-accent">FAQ</Typography>
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

        <section>
          <BrutalistBlock>
            <div className="text-center space-y-4 py-4">
              <Typography variant="h3" className="uppercase tracking-tight">Ready_to_plan</Typography>
              <p className="text-xs font-mono opacity-60 max-w-md mx-auto">
                One-time $19. PDF delivered immediately. No subscription. No data sale.
              </p>
              <Button variant="primary" size="lg" href="/survival-garden-plan/wizard/">
                Build my plan <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </BrutalistBlock>
        </section>

      </div>
    </FieldStationLayout>
  );
}
