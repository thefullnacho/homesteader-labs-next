import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Survival Garden Plan: Personalized for Your Zone',
    template: '%s · Survival Garden Plan',
  },
  description:
    'A personalized, zone-specific survival garden plan: crop selection, layout, sowing schedule, and caloric projection. Generated for your exact ZIP code, household, and goals.',
  openGraph: {
    title: 'Survival Garden Plan · Personalized for Your Zone',
    description:
      'Generate a calorie-maximized survival garden plan for your specific zone and household.',
    type: 'website',
  },
};

export default function SurvivalGardenPlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
