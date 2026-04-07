"use client";

import Link from "next/link";
import Typography from "@/components/ui/Typography";

export default function Footer() {
  return (
    <footer className="border-t-2 border-border-primary bg-background-secondary mt-auto relative overflow-hidden">
      {/* Subtle Background Text */}
      <div className="absolute -bottom-4 -left-4 text-[60px] font-bold opacity-[0.02] select-none pointer-events-none font-mono">
        OFF_GRID_RESILIENCE
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-1">
            <Typography variant="h4" className="mb-0 text-sm">Homesteader Labs</Typography>
          </div>

          <div className="flex gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-widest flex-wrap justify-center font-mono">
            <Link href="/archive/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              Field Notes
            </Link>
            <Link href="/shop/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              Shop
            </Link>
            <Link href="/tools/fabrication/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              Workshop
            </Link>
            <Link href="/terms-of-fabrication/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              Terms
            </Link>
            <Link href="/warranty/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              Warranty
            </Link>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex items-center gap-4">
              <Link href="/privacy/" className="text-[9px] opacity-30 hover:opacity-60 transition-opacity uppercase font-bold tracking-widest">
                Privacy
              </Link>
              <span className="text-[9px] opacity-10">|</span>
              <Link href="/requisition/" className="text-[9px] opacity-30 hover:opacity-60 transition-opacity uppercase font-bold tracking-widest">
                Cart
              </Link>
            </div>
            <Typography variant="small" className="opacity-20 font-mono text-[8px] uppercase tracking-widest mb-0">
              © 2026 Homesteader Labs
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  );
}
