"use client";

import React from 'react';
import { Flame, Droplet, Cloud, Zap, Beef } from 'lucide-react';
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import type { SurvivalIndex } from "@/app/lib/weatherTypes";

interface SurvivalDashboardProps {
  index: SurvivalIndex;
}

const SurvivalDashboard = ({ index }: SurvivalDashboardProps) => {
  const getRiskColor = (level: string): string => {
    switch (level) {
      case "low": return "#22c55e";
      case "moderate": return "#eab308";
      case "high": return "#f97316";
      case "extreme": return "#ef4444";
      default: return "#22c55e";
    }
  };

  const getStressColor = (level: string): string => {
    switch (level) {
      case "none": return "#22c55e";
      case "low": return "#eab308";
      case "moderate": return "#f97316";
      case "high": return "#ef4444";
      case "extreme": return "#dc2626";
      default: return "#22c55e";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* FIRE RISK */}
        <BrutalistBlock className="p-5 relative overflow-hidden group" refTag="DEF_CON_FIRE">
          <div className="flex items-center gap-3 mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <Flame size={16} className="text-accent" />
            <Typography variant="small" className="uppercase font-bold text-[10px] mb-0 tracking-widest font-mono">Thermal_Threat_Level</Typography>
          </div>
          <Typography variant="h2" className="mb-1 uppercase font-mono tracking-tighter" style={{ color: getRiskColor(index.fireRisk.level) }}>
            {index.fireRisk.level}
          </Typography>
          <Typography variant="small" className="opacity-60 text-[10px] leading-tight mb-0 uppercase font-mono">{index.fireRisk.description}</Typography>
          <div className="absolute top-2 right-2 w-1 h-8 bg-current opacity-20" style={{ color: getRiskColor(index.fireRisk.level) }} />
        </BrutalistBlock>

        {/* WATER CATCHMENT */}
        <BrutalistBlock className="p-5 relative overflow-hidden group" refTag="H2O_ACQ_POT">
          <div className="flex items-center gap-3 mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <Droplet size={16} className="text-accent" />
            <Typography variant="small" className="uppercase font-bold text-[10px] mb-0 tracking-widest font-mono">Catchment_Efficiency</Typography>
          </div>
          <Typography variant="h2" className="mb-1 uppercase font-mono tracking-tighter">
            {index.waterCatchment.potential}
          </Typography>
          <Typography variant="small" className="opacity-60 text-[10px] leading-tight mb-0 uppercase font-mono">
            {index.waterCatchment.nextRain 
              ? `Next_Inflow: ${new Date(index.waterCatchment.nextRain).toLocaleDateString()}`
              : "Zero_Atmospheric_Precip_Detected"}
          </Typography>
        </BrutalistBlock>

        {/* SOLAR EFFICIENCY */}
        <BrutalistBlock className="p-5 relative overflow-hidden group" refTag="PV_ARRAY_YIELD">
          <div className="flex items-center gap-3 mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <Zap size={16} className="text-accent" />
            <Typography variant="small" className="uppercase font-bold text-[10px] mb-0 tracking-widest font-mono">Solar_Energy_Capture</Typography>
          </div>
          <div className="flex items-baseline gap-2">
            <Typography variant="h2" className="mb-1 font-mono tracking-tighter">{index.solarEfficiency.percentage}%</Typography>
            <span className="text-[10px] font-mono opacity-40">EFF</span>
          </div>
          <Typography variant="small" className="opacity-60 text-[10px] leading-tight mb-0 uppercase font-mono">
            EST_{index.solarEfficiency.hours}_PEAK_SUN_HRS
          </Typography>
        </BrutalistBlock>

        {/* SPRAY OPERATIONS */}
        <BrutalistBlock className="p-5 relative overflow-hidden group" refTag="AGRI_OPS_SAFE">
          <div className="flex items-center gap-3 mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <Cloud size={16} className="text-accent" />
            <Typography variant="small" className="uppercase font-bold text-[10px] mb-0 tracking-widest font-mono">Application_Suitability</Typography>
          </div>
          <Typography variant="h2" className="mb-1 uppercase font-mono tracking-tighter" style={{ color: index.sprayConditions.suitable ? '#22c55e' : '#ef4444' }}>
            {index.sprayConditions.suitable ? "OPTIMAL" : "CRITICAL_ABORT"}
          </Typography>
          <Typography variant="small" className="opacity-60 text-[10px] leading-tight mb-0 uppercase font-mono">{index.sprayConditions.reason}</Typography>
        </BrutalistBlock>

        {/* LIVESTOCK STRESS */}
        <BrutalistBlock className="p-5 relative overflow-hidden group" refTag="BIO_SENS_LOG">
          <div className="flex items-center gap-3 mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <Beef size={16} className="text-accent" />
            <Typography variant="small" className="uppercase font-bold text-[10px] mb-0 tracking-widest font-mono">Livestock_Metabolic_Load</Typography>
          </div>
          <Typography variant="h2" className="mb-1 uppercase font-mono tracking-tighter" style={{ color: getStressColor(index.livestockStress.level) }}>
            {index.livestockStress.level}
          </Typography>
          <Typography variant="small" className="opacity-60 text-[10px] leading-tight mb-0 uppercase font-mono">{index.livestockStress.description}</Typography>
        </BrutalistBlock>

        {/* READINESS BAR (FULL WIDTH ON LG) */}
        <BrutalistBlock className="p-5 lg:col-span-1 border-accent/40 bg-accent/5 relative" refTag="CORE_READINESS">
          <Typography variant="small" className="uppercase font-bold text-[10px] mb-4 tracking-widest font-mono opacity-40">System_Integrity_Index</Typography>
          <div className="flex items-center gap-4">
            <div className="flex-grow h-8 bg-background-secondary border-2 border-border-primary overflow-hidden relative">
              <div 
                className="h-full bg-accent transition-all duration-1000 ease-out shadow-[0_0_10px_var(--accent)]"
                style={{ width: `${index.overall}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[8px] font-bold font-mono text-white mix-blend-difference uppercase tracking-[0.3em]">Operational_Status</span>
              </div>
            </div>
            <Typography variant="h2" className="mb-0 text-accent font-mono tracking-tighter">{index.overall}%</Typography>
          </div>
        </BrutalistBlock>
      </div>
    </div>
  );
};

export default SurvivalDashboard;
