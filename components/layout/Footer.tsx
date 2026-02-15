"use client";

import Link from "next/link";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import { useEffect, useState } from "react";

export default function Footer() {
  const [isLow, setIsLow] = useState(false);

  useEffect(() => {
    setIsLow(localStorage.getItem("hl_ui_low_fx") === "true");
  }, []);

  const toggleFX = () => {
    const newVal = !isLow;
    localStorage.setItem("hl_ui_low_fx", String(newVal));
    setIsLow(newVal);
    window.dispatchEvent(new CustomEvent('hl-toggle-fx'));
  };

  return (
    <footer className="border-t-2 border-border-primary bg-background-secondary mt-auto relative overflow-hidden">
      {/* Subtle Background Text */}
      <div className="absolute -bottom-4 -left-4 text-[60px] font-bold opacity-[0.02] select-none pointer-events-none font-mono">
        OFF_GRID_RESILIENCE
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Typography variant="h4" className="mb-0 text-sm">HOMESTEADER_LABS</Typography>
              <Badge variant="outline" className="text-[8px] opacity-40">v2.1 // NEXT_CORE</Badge>
            </div>
            <Typography variant="small" className="opacity-30 font-mono text-[9px] mb-0">
              LOC: 45.5231° N, 122.6765° W // ALT: 154M
            </Typography>
          </div>
          
          <div className="flex gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest flex-wrap justify-center font-mono">
            <Link href="/archive/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              [ARCHIVE]
            </Link>
            <Link href="/shop/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              [SHOP]
            </Link>
            <Link href="/tools/fabrication/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              [FABRICATION]
            </Link>
            <button 
              onClick={toggleFX}
              className="opacity-50 hover:opacity-100 hover:text-accent transition-all uppercase"
            >
              [FX_{isLow ? 'MIN' : 'MAX'}]
            </button>
            <Link href="/terms-of-fabrication/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              [TERMS]
            </Link>
            <Link href="/warranty/" className="opacity-50 hover:opacity-100 hover:text-accent transition-all">
              [WARRANTY]
            </Link>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex items-center gap-4">
              <Link href="/privacy/" className="text-[9px] opacity-30 hover:opacity-60 transition-opacity uppercase font-bold tracking-widest">
                Privacy_Protocol
              </Link>
              <span className="text-[9px] opacity-10">|</span>
              <Link href="/requisition/" className="text-[9px] opacity-30 hover:opacity-60 transition-opacity uppercase font-bold tracking-widest">
                Requisition_Log
              </Link>
            </div>
            <Typography variant="small" className="opacity-20 font-mono text-[8px] uppercase tracking-widest mb-0">
              © 2026 HOMESTEADER_LABS // ALL_RIGHTS_RESERVED
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  );
}
