import type { Metadata } from "next";
import FiledDocument from "@/components/legal/FiledDocument";

export const metadata: Metadata = {
  title: "Warranty (VOID)",
  description: "Warranty Status: VOID - All warranties were voided the moment you decided to take production into your own hands",
};

export default function WarrantyPage() {
  return (
    <FiledDocument
      title="Warranty (Void)"
      subtitle="Warranty status: void"
      refCode="WARRANTY_VOID_V1"
      stamp={{ label: "Void", color: "text-rust" }}
      voided
      notice="All warranties were voided the moment you decided to take production into your own hands."
      sections={[
        {
          heading: "No Customer Support",
          body: "There is no customer support. There is only the community and the documentation.",
        },
        {
          heading: "The Protocol",
          body: "If it breaks, fix it. If it doesn't work, iterate.",
        },
      ]}
      footerLines={[
        "Warranty ID: null",
        "Status: permanently void",
        "Ref: WARRANTY_VOID_V1",
      ]}
    />
  );
}
