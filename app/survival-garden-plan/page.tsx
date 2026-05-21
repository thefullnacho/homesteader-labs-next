import { ArrowRight, MapPin, FileText, Sprout, Mail } from 'lucide-react';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import PreviewForm from '@/components/survivalPlan/PreviewForm';

const FEATURES = [
  { icon: MapPin,   label: 'Zone-specific',          sub: 'Frost dates + GDD computed from your ZIP' },
  { icon: Sprout,   label: 'Calorie-optimized',      sub: 'Top crops by kcal-per-square-foot, ranked by your goal' },
  { icon: FileText, label: 'Designed PDF',           sub: 'Layout grid, sowing schedule, preservation timeline, companion pairings, seed list' },
  { icon: Mail,     label: 'Yours forever',          sub: 'Delivered to your inbox + downloadable for 30 days' },
];

export default function SurvivalGardenPlanLanding() {
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
            <Button variant="outline" size="lg" href="#preview">
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
