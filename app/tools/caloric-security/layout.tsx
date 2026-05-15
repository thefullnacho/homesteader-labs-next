import { Metadata } from "next";

export const metadata: Metadata = {
  // Re-declare the template chain — nested children (companions/roi/checklist/inventory)
  // would otherwise lose the brand suffix.
  title: {
    default: "Caloric Security",
    template: "%s | Homesteader Labs",
  },
  description: "Know how many days you can survive on your current food, water, and energy stores. Track inventory, calculate ROI by caloric density, and plan for true food security.",
  keywords: "caloric security, food storage, survival food, homestead inventory, food autonomy, emergency preparedness",
  openGraph: {
    title: "Caloric Security",
    description: "Calculate your food, water, and energy autonomy. Track inventory and rank crops by caloric density per square foot.",
    type: "website",
  },
};

export default function CaloricSecurityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
