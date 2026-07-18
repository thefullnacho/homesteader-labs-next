import type { Metadata } from "next";
import FiledDocument from "@/components/legal/FiledDocument";

export const metadata: Metadata = {
  title: "Privacy Hash",
  description: "Privacy Protocol - WE DO NOT TRACK YOU. THE NETWORK DOES.",
};

export default function PrivacyPage() {
  return (
    <FiledDocument
      title="Privacy Hash"
      subtitle="Privacy protocol"
      refCode="PRIVACY_HASH_V1"
      stamp={{ label: "No tracking", color: "text-moss" }}
      notice={
        <>
          We do not track you.
          <br />
          The network does.
        </>
      }
      sections={[
        {
          heading: "Data Collection",
          body: "Homesteader Labs stores no cookies other than essential session data (cart, boot state). We do not sell your data because we do not collect it.",
        },
        {
          heading: "Stay Safe",
          body: "Stay safe out there.",
        },
      ]}
      footerLines={[
        "Encryption: null",
        "Tracking: disabled",
        "Ref: PRIVACY_HASH_V1",
      ]}
    />
  );
}
