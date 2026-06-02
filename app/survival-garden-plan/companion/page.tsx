import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { isSurvivalPlanPublic } from '@/lib/survivalPlan/visibility';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Typography from '@/components/ui/Typography';
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
  searchParams: { p?: string };
}

export default function CompanionPage({ searchParams }: PageProps) {
  if (!isSurvivalPlanPublic()) notFound();

  const token = searchParams.p ?? '';

  if (!token) {
    return <EmptyState message="No plan token provided. Scan the QR code in your PDF, or build a new plan from the wizard." />;
  }

  const input = decodeInputs(token);
  if (!input) {
    return <EmptyState message="Could not read this plan link. It may be malformed — try scanning the QR code again." />;
  }

  const zone = getGrowingZoneFromZip(input.zipCode) ?? '6a';
  const frostDates = getFrostDatesByZone(zone, input.zipCode);
  const plan = buildSurvivalPlan(input, frostDates);

  return (
    <FieldStationLayout stationId="SGP_COMPANION" gridLines>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">

        <header className="space-y-2">
          <Typography variant="small" className="font-mono opacity-50 uppercase tracking-widest">
            Homesteader_Labs // Live_Companion
          </Typography>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight leading-none">
            Your plan,<br />
            <span className="text-accent">live.</span>
          </h1>
          <p className="text-xs font-mono opacity-50 uppercase">
            Zone {plan.growingZone} · {plan.input.adults + plan.input.kids}-person household · {plan.input.squareFeet} sq ft · {plan.input.goal.replace('-', ' ')}
          </p>
        </header>

        <CompanionView plan={plan} encodedToken={token} />

      </div>
    </FieldStationLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <FieldStationLayout stationId="SGP_COMPANION" gridLines>
      <div className="max-w-xl mx-auto py-12 px-4">
        <BrutalistBlock>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-accent shrink-0 mt-1" />
            <div>
              <p className="text-sm font-mono font-bold uppercase mb-2">No plan loaded</p>
              <p className="text-xs font-mono opacity-70 leading-relaxed mb-4">{message}</p>
              <Link
                href="/survival-garden-plan/wizard/"
                className="inline-flex items-center justify-center font-bold uppercase bg-accent text-white border-2 border-accent px-4 py-2 text-xs shadow-brutalist"
              >
                Build_a_plan
              </Link>
            </div>
          </div>
        </BrutalistBlock>
      </div>
    </FieldStationLayout>
  );
}
