import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop ROI Report",
  description: "Rank every crop by calories per square foot. Find the highest-yield crops for your garden space — the data-driven way to plan a survival garden.",
  keywords: "crop ROI, calories per square foot, survival garden, high yield crops, caloric density, garden planning",
  openGraph: {
    title: "Crop ROI Report",
    description: "Rank every crop by calories per square foot. Data-driven survival garden planning.",
    type: "website",
  },
};

export default function ROILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
