"use client";

import React from 'react';
import { useFieldStation } from '@/app/context/FieldStationContext';

interface FieldStationLayoutProps {
  children: React.ReactNode;
  className?: string;
  stationId?: string;
  gridLines?: boolean;
}

const FieldStationLayout = ({
  children,
  className = '',
  stationId = 'HL_GEN_01',
  gridLines = true,
}: FieldStationLayoutProps) => {
  const { activeLocation } = useFieldStation();

  return (
    <div className={`relative min-h-screen w-full p-4 md:p-8 ${className}`}>
      {/* Background Grid Lines */}
      {gridLines && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
                linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          {/* Major axes */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-accent/20" />
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-accent/20" />
        </div>
      )}

      {/* Frame / Borders */}
      <div className="relative z-10 flex flex-col min-h-full border-2 border-border-primary p-2 md:p-4">
        {/* Header Metadata */}
        <div className="flex justify-between items-end mb-8 border-b-2 border-border-primary pb-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">Field Station Layout</span>
            <span className="text-sm font-bold font-mono text-accent">{stationId}</span>
          </div>
          <div className="flex gap-4 text-[10px] font-mono opacity-60">
            <div className="flex flex-col items-end">
              <span>LAT: {activeLocation ? activeLocation.lat.toFixed(6) : "45.523062"}</span>
              <span>LON: {activeLocation ? activeLocation.lon.toFixed(6) : "-122.676482"}</span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span>REF_SYS: WGS84</span>
              <span>SCALE: 1:1</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          {children}
        </div>

        {/* Footer Metadata */}
        <div className="mt-8 pt-2 border-t border-border-primary/30 flex justify-between items-center text-[8px] font-mono opacity-40 uppercase">
          <span>Homesteader Labs Technical Documentation</span>
          <span className="animate-pulse">Active_Transmission_Link...</span>
          <span>©2026_HL_CORP</span>
        </div>
      </div>
      
      {/* Decorative Corner Brackets */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-accent pointer-events-none" />
      <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-accent pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-accent pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-accent pointer-events-none" />
    </div>
  );
};

export default FieldStationLayout;
