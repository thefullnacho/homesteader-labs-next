import { Metadata } from "next";

export const metadata: Metadata = {
  // Keep the brand suffix template alive for nested tool pages.
  // Setting `title` as a bare string in a layout breaks the parent template chain.
  title: {
    default: "Homesteader Tools — Planting Calendar, Weather, Food Security",
    template: "%s | Homesteader Labs",
  },
  description: "Free off-grid homesteader tools: frost-anchored planting calendar, real-time weather + survival indices, caloric security dashboard, and printable homestead parts. No account required.",
  openGraph: {
    title: "Homesteader Tools — Planting Calendar, Weather, Food Security",
    description: "Free off-grid homesteader tools: frost-anchored planting calendar, real-time weather + survival indices, caloric security dashboard, and printable homestead parts.",
    type: "website",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
