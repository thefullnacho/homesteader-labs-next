"use client";

import React from 'react';
import { Droplets, Clock } from 'lucide-react';
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Badge from "@/components/ui/Badge";
import type { PlantingIndex } from "@/lib/weatherTypes";
import { formatFrostRisk, formatConfidence } from "@/lib/plantingIndex";

interface PlantingDashboardProps {
  index: PlantingIndex;
}

const PlantingDashboard = ({ index }: PlantingDashboardProps) => {
  const getSoilStatusClass = (status: string): string => {
    switch (status) {
      case "workable": return "text-green-500";
      case "frozen":
      case "too-wet": return "text-red-500";
      case "too-dry": return "text-yellow-500";
      default: return "text-foreground-secondary";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FROST ANALYSIS */}
        <BrutalistBlock className="p-6" title="FROST PROBABILITY MATRIX" refTag="SNS_ICE_01">
          <div className="space-y-6 mt-4">
            {[
              { label: "7-DAY CYCLE", risk: index.frostRisk.next7Days },
              { label: "14-DAY CYCLE", risk: index.frostRisk.next14Days },
              { label: "30-DAY CYCLE", risk: index.frostRisk.next30Days },
            ].map((period) => (
              <div key={period.label}>
                <div className="flex justify-between items-end mb-2">
                  <Typography variant="small" className="font-mono font-bold uppercase text-[9px] mb-0 opacity-80">{period.label}</Typography>
                  <span className="text-[9px] font-mono font-bold" style={{ color: formatFrostRisk(period.risk).color }}>
                    {formatFrostRisk(period.risk).label} {"//"} {period.risk}%
                  </span>
                </div>
                <div className="w-full h-2 bg-background-secondary border border-border-primary/20 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-in-out"
                    style={{ 
                      width: `${period.risk}%`,
                      backgroundColor: formatFrostRisk(period.risk).color
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-border-primary/10 flex justify-between items-center">
              <Badge variant="status" className="text-[8px] py-0">{formatConfidence(index.frostRisk.confidence)}</Badge>
              <Typography variant="small" className="font-mono text-[8px] mb-0 opacity-30 uppercase tracking-widest text-right">
                VAR THRESHOLD: ±{index.frostRisk.variance}°F
              </Typography>
            </div>
          </div>
        </BrutalistBlock>

        {/* SOIL & GROWING WINDOW */}
        <div className="space-y-6">
          <BrutalistBlock className="p-5" refTag="SOIL_VITAL_SIGNS">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 opacity-80">
                <Droplets size={16} className="text-accent" />
                <Typography variant="small" className="uppercase font-bold text-[10px] mb-0 tracking-widest font-mono">Soil Workability</Typography>
              </div>
              <span className={`text-[10px] font-bold font-mono uppercase ${getSoilStatusClass(index.soilWorkability.status)}`}>
                [{index.soilWorkability.status}]
              </span>
            </div>
            <Typography variant="body" className="opacity-70 text-[11px] font-mono uppercase leading-tight mb-0">
              {index.soilWorkability.description}
            </Typography>
          </BrutalistBlock>

          <BrutalistBlock className="p-5" refTag="GROWTH_ENVELOPE">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 opacity-80">
                <Clock size={16} className="text-accent" />
                <Typography variant="small" className="uppercase font-bold text-[10px] mb-0 tracking-widest font-mono">Sustainable Window</Typography>
              </div>
              {index.plantingWindow.opens && (
                <span className="text-[10px] font-bold font-mono text-accent uppercase tracking-tighter">
                  {index.plantingWindow.confidence}% PROB
                </span>
              )}
            </div>
            {index.plantingWindow.opens ? (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono uppercase">
                  <span className="opacity-40">Stream Start:</span>
                  <span className="font-bold">{new Date(index.plantingWindow.opens).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono uppercase">
                  <span className="opacity-40">Window Est:</span>
                  <span className="font-bold text-accent">{index.plantingWindow.days} CONSEC DAYS</span>
                </div>
              </div>
            ) : (
              <Typography variant="small" className="opacity-30 italic mb-0 uppercase text-[10px] font-mono">No Sustainable Growth Detected</Typography>
            )}
          </BrutalistBlock>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <BrutalistBlock className="border-accent/40 bg-accent/5 p-6" title="PROTOCOL DEPLOYMENT RECS" refTag="OP_ORD_01">
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 mt-2">
          {index.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 border-l-2 border-accent/30 pl-4 py-1">
              <span className="font-mono uppercase text-[10px] tracking-tight leading-relaxed opacity-80">{rec}</span>
            </div>
          ))}
        </div>
      </BrutalistBlock>
    </div>
  );
};

export default PlantingDashboard;
