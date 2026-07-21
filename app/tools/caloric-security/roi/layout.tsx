import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calories Per Square Foot: Highest-Yield Crops for a Survival Garden",
  description: "Rank every crop by calories per square foot. Find the highest-yield survival garden crops like potatoes, corn, winter squash, and sweet potatoes, using USDA nutrient data and real spacing requirements.",
  openGraph: {
    title: "Calories Per Square Foot: Highest-Yield Crops for a Survival Garden",
    description: "Every crop ranked by calories per square foot. Plan a survival garden with real yield + nutrient data.",
    type: "website",
  },
};

export default function ROILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
