import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { isSurvivalPlanPublic } from '@/lib/survivalPlan/visibility';
import CompanionView from '@/components/survivalPlan/CompanionView';
import { decodeInputs } from '@/lib/survivalPlan/inputEncoding';
import { buildSurvivalPlan } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';

export const metadata = {
  title: 'Plan Companion',
  description: 'Live interactive companion to your survival garden plan PDF.',
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ p?: string }>;
}

export default async function CompanionPage(props: PageProps) {
  const searchParams = await props.searchParams;
  if (!isSurvivalPlanPublic()) notFound();

  const token = searchParams.p ?? '';

  if (!token) {
    return <EmptyState message="No plan token provided. Scan the QR code in your PDF, or build a new plan from the wizard." />;
  }

  const input = decodeInputs(token);
  if (!input) {
    return <EmptyState message="Could not read this plan link. It may be malformed, try scanning the QR code again." />;
  }

  const zone = getGrowingZoneFromZip(input.zipCode) ?? '6a';
  const frostDates = getFrostDatesByZone(zone, input.zipCode);
  const plan = buildSurvivalPlan(input, frostDates);

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/survival-garden-plan/" className="hover:text-marker underline underline-offset-4">
              Survival Garden Plan
            </Link>
            <span>/</span>
            <span>Live companion</span>
            <span className="ml-auto">
              Zone {plan.growingZone} · {plan.input.adults + plan.input.kids}-person household · {plan.input.squareFeet} sq ft · {plan.input.goal.replace('-', ' ')}
            </span>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Your plan, live.
          </h1>
          <p className="mt-4 text-lg leading-relaxed max-w-2xl text-ink/85 italic">
            The same plan as your PDF, recomputed on every visit. Adjust inputs
            in the wizard and this page follows.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto py-10 px-4">
        <CompanionView plan={plan} encodedToken={token} />
      </div>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <div className="border-2 border-dashed border-ink/40 p-8">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-rust shrink-0 mt-1" />
          <div>
            <p className="font-mono font-bold uppercase text-sm mb-2">No plan loaded</p>
            <p className="text-[0.95rem] text-ink/80 leading-relaxed mb-4">{message}</p>
            <Link
              href="/survival-garden-plan/wizard/"
              className="inline-flex items-center justify-center bg-ink text-paper border-2 border-ink px-5 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
            >
              Build a plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
