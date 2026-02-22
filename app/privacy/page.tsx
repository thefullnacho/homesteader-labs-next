import type { Metadata } from "next";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";

export const metadata: Metadata = {
  title: "Privacy Hash | Homesteader Labs",
  description: "Privacy Protocol - WE DO NOT TRACK YOU. THE NETWORK DOES.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <BrutalistBlock variant="default" className="bg-secondary p-8 md:p-12">
        <div className="border-b-2 border-theme-main pb-4 mb-8">
          <Typography variant="h2" className="mb-0">
            Privacy Hash
          </Typography>
          <p className="text-theme-secondary mt-2 font-mono text-sm">
            &gt;&gt; PRIVACY PROTOCOL
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <div className="bg-[var(--accent)]/10 border border-[var(--accent)] p-6 mb-6">
              <p className="text-lg font-bold text-[var(--accent)] uppercase tracking-wider">
                WE DO NOT TRACK YOU.<br />
                THE NETWORK DOES.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 uppercase border-l-4 border-[var(--accent)] pl-4">
              Data Collection
            </h2>
            <p className="leading-relaxed text-theme-secondary">
              Homesteader Labs stores no cookies other than essential session data 
              (cart, boot state). We do not sell your data because we do not collect it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 uppercase border-l-4 border-[var(--accent)] pl-4">
              Stay Safe
            </h2>
            <p className="leading-relaxed text-theme-secondary">
              Stay safe out there.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-theme-main/30">
          <p className="text-xs opacity-60 font-mono">
            ENCRYPTION: NULL<br />
            TRACKING: DISABLED<br />
            REF: PRIVACY_HASH_V1
          </p>
        </div>
      </BrutalistBlock>
    </div>
  );
}
