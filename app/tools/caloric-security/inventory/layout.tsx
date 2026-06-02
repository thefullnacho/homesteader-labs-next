import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Inventory",
  description: "Track stored food, water, and seed inventory for your homestead. Decay tracking, weight logging, and harvest projections feed back into the caloric security dashboard.",
  // Personal-data page — useless to a crawler with no localStorage state.
  robots: { index: false, follow: true },
};

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
