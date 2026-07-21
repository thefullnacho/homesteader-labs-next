import type { Metadata } from "next";
import FiledDocument from "@/components/legal/FiledDocument";

export const metadata: Metadata = {
  title: "Terms of Fabrication",
  description: "Agreement Protocol V.1.0 - Read before building",
};

export default function TermsOfFabricationPage() {
  return (
    <FiledDocument
      title="Terms of Fabrication"
      subtitle="Agreement protocol V.1.0"
      refCode="TERMS_FAB_V1"
      stamp={{ label: "Read before building", color: "text-slateblue", rotate: "-2deg" }}
      sections={[
        {
          heading: "Risk Acknowledgment",
          body: "By accessing this terminal and utilizing Homesteader Labs fabrication files, you acknowledge that all hardware is experimental. We are not responsible for structural failure, limb loss, or voided insurance policies.",
        },
        {
          heading: "Modification",
          body: "You are encouraged to modify, hack, and improve all designs. Closed systems are dead systems.",
        },
        {
          heading: "Liability",
          body: "Homesteader Labs exists in the gray zones. If you build it, you own the consequences.",
        },
      ]}
      footerLines={["Last updated: 2026-02-11", "Ref: TERMS_FAB_V1"]}
    />
  );
}
