"use client";

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Wrench, ArrowRight } from 'lucide-react';
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";

interface ContextualRequisitionProps {
  hardwareId: string;
  hardwareName: string;
  reason: string;
  zone: string;
  href: string;
}

export default function ContextualRequisition({
  hardwareName,
  reason,
  zone,
  href
}: ContextualRequisitionProps) {
  return (
    <BrutalistBlock className="p-4 border-accent/50 bg-accent/5 mb-6 animate-pulse-slow" variant="default" refTag="SYS_REQUISITION">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-accent/20 border-2 border-accent flex items-center justify-center shrink-0">
            <Wrench size={20} className="text-accent" />
          </div>
          <div>
            <Typography variant="h4" className="text-sm mb-1 uppercase tracking-tight flex items-center gap-2 text-accent">
              <AlertTriangle size={14} /> Hardware Requirement Detected
            </Typography>
            <Typography variant="body" className="text-xs mb-0 opacity-80 font-mono uppercase">
              {reason} in <span className="font-bold text-accent">ZONE_{zone}</span> requires <span className="font-bold border-b border-accent/50">{hardwareName}</span>.
            </Typography>
          </div>
        </div>
        
        <Link 
          href={href}
          className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 border-2 border-accent text-accent font-mono text-[10px] font-bold uppercase hover:bg-accent hover:text-white transition-all group"
        >
          Send to Fabrication
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </BrutalistBlock>
  );
}