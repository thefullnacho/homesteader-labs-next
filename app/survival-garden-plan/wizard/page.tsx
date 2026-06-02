import { notFound } from 'next/navigation';
import Wizard from '@/components/survivalPlan/Wizard';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import { isSurvivalPlanPublic } from '@/lib/survivalPlan/visibility';

export const metadata = {
  title: 'Personalize Your Plan',
  description: 'Walk through a 6-step wizard to generate a survival garden plan personalized to your zone, household, and goals.',
  robots: { index: false, follow: true },
};

export default function WizardPage() {
  if (!isSurvivalPlanPublic()) notFound();
  return (
    <FieldStationLayout stationId="SGP_WIZ_01" gridLines>
      <div className="py-8 px-4">
        <Wizard />
      </div>
    </FieldStationLayout>
  );
}
