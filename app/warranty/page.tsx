import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Warranty (VOID) | Homesteader Labs",
  description: "Warranty Status: VOID - All warranties were voided the moment you decided to take production into your own hands",
};

export default function WarrantyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="brutalist-block bg-secondary p-8 md:p-12">
        <div className="border-b-2 border-theme-main pb-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">
            Warranty (VOID)
          </h1>
          <p className="text-theme-secondary mt-2 font-mono text-sm">
            &gt;&gt; WARRANTY STATUS: VOID
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <div className="bg-[var(--accent)]/10 border border-[var(--accent)] p-6 mb-6">
              <p className="text-lg font-bold text-[var(--accent)] uppercase tracking-wider">
                All warranties were voided the moment you decided to take production into your own hands.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 uppercase border-l-4 border-[var(--accent)] pl-4">
              No Customer Support
            </h2>
            <p className="leading-relaxed text-theme-secondary">
              There is no customer support. There is only the community and the documentation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 uppercase border-l-4 border-[var(--accent)] pl-4">
              The Protocol
            </h2>
            <p className="leading-relaxed text-theme-secondary">
              If it breaks, fix it. If it doesn&apos;t work, iterate.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-theme-main/30">
          <p className="text-xs opacity-60 font-mono">
            WARRANTY_ID: NULL<br />
            STATUS: PERMANENTLY_VOID<br />
            REF: WARRANTY_VOID_V1
          </p>
        </div>
      </div>
    </div>
  );
}
