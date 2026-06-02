import { Metadata } from "next";

export const metadata: Metadata = {
  // Re-declare the template chain — nested children (companions/roi/checklist/inventory)
  // would otherwise lose the brand suffix.
  title: {
    default: "Survival Garden Calculator — Food, Water & Energy Autonomy",
    template: "%s | Homesteader Labs",
  },
  description: "Survival garden calculator and food self-sufficiency tracker. Know how many days your household can survive on stored food, projected harvests, water catchment, and solar energy — all in one dashboard. No account required.",
  keywords: "survival garden calculator, food self-sufficiency calculator, food autonomy, caloric security, days of food, homestead resilience",
  openGraph: {
    title: "Survival Garden Calculator — Food, Water & Energy Autonomy",
    description: "How many days can your household survive on what you have stored and what you'll grow? Free survival garden calculator with live water and energy autonomy tracking.",
    type: "website",
  },
};

export default function CaloricSecurityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
