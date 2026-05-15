import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Resilience Checklist",
  description: "A season-aware monthly checklist for homesteaders. Track seed starting, harvests, preservation milestones, and storage rotation — printable and works offline.",
  keywords: "homestead checklist, monthly garden tasks, canning schedule, seed starting calendar, food storage rotation, grid-down preparedness",
  openGraph: {
    title: "Monthly Resilience Checklist",
    description: "Season-aware monthly checklist for your homestead — printable and offline-ready.",
    type: "website",
  },
};

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
