import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Fabrication | Homesteader Labs",
  description: "Agreement Protocol V.1.0 - Read before building",
};

export default function TermsOfFabricationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="brutalist-block bg-secondary p-8 md:p-12">
        <div className="border-b-2 border-border-primary pb-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">
            Terms of Fabrication
          </h1>
          <p className="text-foreground-secondary mt-2 font-mono text-sm">
            &gt;&gt; AGREEMENT PROTOCOL V.1.0
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 uppercase border-l-4 border-[var(--accent)] pl-4">
              1. Risk Acknowledgment
            </h2>
            <p className="leading-relaxed text-foreground-secondary">
              By accessing this terminal and utilizing Homesteader Labs fabrication files, 
              you acknowledge that all hardware is experimental. We are not responsible for 
              structural failure, limb loss, or voided insurance policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 uppercase border-l-4 border-[var(--accent)] pl-4">
              2. Modification
            </h2>
            <p className="leading-relaxed text-foreground-secondary">
              You are encouraged to modify, hack, and improve all designs. 
              Closed systems are dead systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 uppercase border-l-4 border-[var(--accent)] pl-4">
              3. Liability
            </h2>
            <p className="leading-relaxed text-foreground-secondary">
              Homesteader Labs exists in the gray zones. If you build it, you own the consequences.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border-primary/30">
          <p className="text-xs opacity-60 font-mono">
            LAST_UPDATED: 2026-02-11<br />
            REF: TERMS_FAB_V1
          </p>
        </div>
      </div>
    </div>
  );
}
