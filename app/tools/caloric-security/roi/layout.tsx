import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calories Per Square Foot — Highest-Yield Crops for a Survival Garden",
  description: "Rank every crop by calories per square foot. Find the highest-yield survival garden crops — potatoes, corn, winter squash, sweet potatoes — using USDA nutrient data and real spacing requirements.",
  keywords: "calories per square foot, highest calorie crops, survival garden, caloric density, crop ROI, calories per square foot vegetables",
  openGraph: {
    title: "Calories Per Square Foot — Highest-Yield Crops for a Survival Garden",
    description: "Every crop ranked by calories per square foot. Plan a survival garden with real yield + nutrient data.",
    type: "website",
  },
};

export default function ROILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
