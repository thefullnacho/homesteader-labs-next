import Link from 'next/link';
import type { ReactNode } from 'react';

// ============================================================
// DrawerBand — slim kraft header for the resilience drawers
// (inventory, ROI, companions, checklist). Keeps the deep
// pages on the paper system without repeating the full
// tool-page band.
// ============================================================

export default function DrawerBand({
  drawer,
  title,
  sub,
  right,
}: {
  drawer: string;        // breadcrumb leaf, e.g. "The stock book"
  title: string;         // display heading
  sub?: string;          // italic serif subline
  right?: ReactNode;     // actions, right-aligned on the heading row
}) {
  return (
    <section className="bg-kraft grain border-b-2 border-ink relative">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-8 relative z-[2]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-4">
          <Link href="/tools/" className="hover:text-marker underline underline-offset-4">
            Workbench
          </Link>
          <span>/</span>
          <Link href="/tools/caloric-security/" className="hover:text-marker underline underline-offset-4">
            No. 04 · Resilience
          </Link>
          <span>/</span>
          <span>{drawer}</span>
          <span className="ml-auto">All data stays in your browser</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display uppercase text-2xl sm:text-4xl leading-[0.98] text-balance">
              {title}
            </h1>
            {sub && (
              <p className="mt-2 text-lg max-w-2xl leading-relaxed text-ink/85 italic">
                {sub}
              </p>
            )}
          </div>
          {right && <div className="flex items-center gap-3 flex-wrap">{right}</div>}
        </div>
      </div>
    </section>
  );
}
