import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Companion Planting Advisor | Homesteader Labs",
  description: "Discover which crops grow best together. Companion planting combinations that boost yield, deter pests, and improve soil health for your homestead garden.",
  keywords: "companion planting, guild planting, three sisters, pest control, polyculture, homestead garden, companion plants",
  openGraph: {
    title: "Companion Planting Advisor | Homesteader Labs",
    description: "Find ideal companion planting combinations for higher yields and natural pest control.",
    type: "website",
  },
};

export default function CompanionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
