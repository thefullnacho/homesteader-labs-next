"use client";

import { getMoonPhase } from "@/lib/weatherApi";
import Typography from "@/components/ui/Typography";

export default function MoonPhaseDisplay() {
  const moon = getMoonPhase();

  return (
    <div className="flex items-center gap-3 p-3 bg-black/20 border border-border-primary">
      <div className="text-2xl">{moon.emoji}</div>
      <div>
        <Typography variant="small" className="font-mono font-bold uppercase text-[10px]">
          {moon.label}
        </Typography>
        <Typography variant="small" className="font-mono text-[8px] opacity-60">
          {moon.illumination}% illuminated
        </Typography>
      </div>
      <div className="ml-auto text-right">
        <Typography variant="small" className="font-mono text-[8px] opacity-40">
          {moon.daysUntilFull === 0 ? 'TONIGHT' : `${moon.daysUntilFull}d`} to full
        </Typography>
        <Typography variant="small" className="font-mono text-[8px] opacity-40">
          {moon.daysUntilNew === 0 ? 'TONIGHT' : `${moon.daysUntilNew}d`} to new
        </Typography>
      </div>
    </div>
  );
}
