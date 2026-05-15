import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planting Calendar",
  description: "Frost-date-anchored planting schedules for 54 crops. Know exactly when to start seeds, transplant, and harvest based on your last frost date and growing zone.",
  keywords: "planting calendar, frost dates, seed starting, growing zone, crop schedule, homestead garden",
  openGraph: {
    title: "Planting Calendar",
    description: "Frost-date-anchored planting schedules for 54 crops. Seed start, transplant, and harvest windows calculated for your location.",
    type: "website",
  },
};

export default function PlantingCalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
