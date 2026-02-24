"use client";

import { getMoonPhase } from "@/lib/weatherApi";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";

export default function MoonPhaseDisplay() {
  const moon = getMoonPhase();

  return (
    <BrutalistBlock className="p-5" refTag="LUNAR_SYNC">
      <div className="flex items-center justify-between mb-4 border-b border-border-primary/20 pb-2">
        <Typography variant="small" className="font-mono font-bold uppercase text-[10px] mb-0 opacity-80">
          Lunar Orbital Phase
        </Typography>
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
      </div>

      <div className="flex items-center gap-6">
        <div className="text-4xl w-16 h-16 bg-black/40 border-2 border-border-primary flex items-center justify-center shrink-0">
          {moon.emoji}
        </div>
        
        <div className="flex-1">
          <Typography variant="h4" className="font-mono font-bold uppercase text-accent tracking-tighter mb-1">
            {moon.label}
          </Typography>
          
          <div className="flex justify-between text-[9px] font-mono uppercase opacity-60 mb-1">
            <span>Illumination</span>
            <span>{moon.illumination}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 mb-3 border border-border-primary/20">
            <div 
              className="h-full bg-accent transition-all duration-1000" 
              style={{ width: `${moon.illumination}%` }} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono uppercase">
            <div className="border-l-2 border-border-primary/30 pl-2">
               <span className="opacity-40 text-[8px] block mb-0.5">T-MINUS FULL</span>
               <span className="font-bold">{moon.daysUntilFull === 0 ? 'TONIGHT' : `${moon.daysUntilFull}d`}</span>
            </div>
            <div className="border-l-2 border-border-primary/30 pl-2">
               <span className="opacity-40 text-[8px] block mb-0.5">T-MINUS NEW</span>
               <span className="font-bold">{moon.daysUntilNew === 0 ? 'TONIGHT' : `${moon.daysUntilNew}d`}</span>
            </div>
          </div>
        </div>
      </div>
    </BrutalistBlock>
  );
}
