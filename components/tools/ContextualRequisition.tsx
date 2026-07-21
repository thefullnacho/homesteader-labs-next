"use client";

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Wrench, ArrowRight } from 'lucide-react';

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
    <div className="bg-marker/5 border-2 border-marker/50 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-marker/15 border-2 border-marker flex items-center justify-center shrink-0">
            <Wrench size={20} className="text-marker" />
          </div>
          <div>
            <h4 className="font-mono text-sm font-bold mb-1 uppercase tracking-tight flex items-center gap-2 text-marker">
              <AlertTriangle size={14} /> Hardware Requirement Detected
            </h4>
            <p className="text-xs mb-0 text-ink/80 font-mono uppercase">
              {reason} in <span className="font-bold text-marker">ZONE_{zone}</span>{" "}requires <span className="font-bold border-b border-marker/50">{hardwareName}</span>.
            </p>
          </div>
        </div>

        <Link
          href={href}
          className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 border-2 border-marker text-marker font-mono text-xs font-bold uppercase hover:bg-marker hover:text-paper transition-all group"
        >
          Send to Fabrication
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
