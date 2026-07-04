import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pest Emergence Calendar + Companion Planting Advisor",
  description: "Know when cucumber beetles, squash bugs, and aphids emerge in your garden — driven by live growing degree days and soil temperature, not generic dates. Plus evidence-tagged companion planting suggestions.",
  openGraph: {
    title: "Pest Emergence Calendar + Companion Planting Advisor",
    description: "Live GDD-based pest emergence timing for your garden plus evidence-tagged companion planting recommendations.",
    type: "website",
  },
};

export default function CompanionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
