"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Leaf, ThermometerSun } from "lucide-react";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import type { ForecastDay } from "@/lib/weatherTypes";

interface GrowingSeasonProps {
  forecast: ForecastDay[];
  locationName: string;
}

interface SeasonMilestone {
  name: string;
  gdd: number;
  description: string;
  crops: string[];
}

const MILESTONES: SeasonMilestone[] = [
  { name: 'Early Spring', gdd: 200, description: 'Peas, spinach, kale', crops: ['🥬', '🫛', '🥬'] },
  { name: 'Spring Planting', gdd: 400, description: 'Beets, carrots, lettuce', crops: ['🥕', '🥗', '🫛'] },
  { name: 'Warm Season Start', gdd: 600, description: 'Beans, corn, squash', crops: ['🌽', '🥒', '🫘'] },
  { name: 'Summer', gdd: 1000, description: 'Tomatoes, peppers', crops: ['🍅', '🌶️', '🍆'] },
  { name: 'Peak Summer', gdd: 1500, description: 'Peak growing season', crops: ['🌽', '🍅', '🥒'] },
];

export default function GrowingSeasonTracker({ forecast, locationName }: GrowingSeasonProps) {
  const [seasonStart] = useState(() => {
    // Start of growing season (spring equinox)
    const year = new Date().getFullYear();
    return new Date(year, 2, 20); // March 20
  });
  
  const [totalGDD, setTotalGDD] = useState(0);
  const [daysSinceStart, setDaysSinceStart] = useState(0);
  
  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(`hl_gdd_${locationName.replace(/\s+/g, '_')}`);
    if (stored) {
      const data = JSON.parse(stored);
      const storedYear = new Date(data.date).getFullYear();
      // Reset if new year
      if (storedYear === new Date().getFullYear()) {
        setTotalGDD(data.gdd);
      }
    }
  }, [locationName]);
  
  useEffect(() => {
    // Calculate GDD from forecast
    const baseTemp = 50;
    let gdd = 0;
    
    forecast.slice(0, 14).forEach((day) => {
      const avgTemp = (day.maxTemp + day.minTemp) / 2;
      if (avgTemp > baseTemp) {
        gdd += avgTemp - baseTemp;
      }
    });
    
    const newTotal = totalGDD + gdd;
    setTotalGDD(newTotal);
    
    // Calculate days since season start
    const days = Math.floor((Date.now() - seasonStart.getTime()) / (24 * 60 * 60 * 1000));
    setDaysSinceStart(Math.max(0, days));
    
    // Save to localStorage
    localStorage.setItem(
      `hl_gdd_${locationName.replace(/\s+/g, '_')}`,
      JSON.stringify({ gdd: newTotal, date: new Date().toISOString() })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecast, locationName]);
  
  const currentMilestone = MILESTONES.find((m, i) => {
    const prev = i === 0 ? 0 : MILESTONES[i - 1].gdd;
    return totalGDD >= prev && totalGDD < m.gdd;
  }) || MILESTONES[MILESTONES.length - 1];
  
  const nextMilestone = MILESTONES.find(m => m.gdd > totalGDD);
  const progressToNext = nextMilestone 
    ? ((totalGDD - (currentMilestone?.gdd || 0)) / (nextMilestone.gdd - (currentMilestone?.gdd || 0))) * 100
    : 100;
  
  return (
    <BrutalistBlock className="p-6 border-green-900/40 bg-green-900/5" title="GROWING SEASON TRACKER" refTag="GDD_TRACKER_V1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Cumulative GDD */}
        <div className="flex flex-col gap-2 border-l-2 border-border-primary/20 pl-4">
          <div className="flex items-center gap-2 opacity-60">
            <ThermometerSun size={14} className="text-orange-400" />
            <Typography variant="small" className="font-mono text-[9px] uppercase tracking-widest mb-0">
              Cumulative GDD
            </Typography>
          </div>
          <div className="flex items-end gap-2">
            <Typography variant="h3" className="font-mono text-3xl text-foreground-primary mb-0 leading-none">
              {totalGDD}
            </Typography>
            <span className="text-[10px] font-mono opacity-40 uppercase mb-1">Base 50°F</span>
          </div>
        </div>
        
        {/* Days Since Spring */}
        <div className="flex flex-col gap-2 border-l-2 border-border-primary/20 pl-4">
          <div className="flex items-center gap-2 opacity-60">
            <TrendingUp size={14} className="text-green-500" />
            <Typography variant="small" className="font-mono text-[9px] uppercase tracking-widest mb-0">
              Days Since Spring
            </Typography>
          </div>
          <div className="flex items-end gap-2">
            <Typography variant="h3" className="font-mono text-3xl text-foreground-primary mb-0 leading-none">
              {daysSinceStart}
            </Typography>
            <span className="text-[10px] font-mono opacity-40 uppercase mb-1">Days</span>
          </div>
        </div>
        
        {/* Current Stage */}
        <div className="flex flex-col gap-2 border-l-2 border-border-primary/20 pl-4">
          <div className="flex items-center gap-2 opacity-60">
            <Leaf size={14} className="text-accent" />
            <Typography variant="small" className="font-mono text-[9px] uppercase tracking-widest mb-0">
              Current Stage
            </Typography>
          </div>
          <div>
            <Typography variant="h3" className="font-mono text-lg text-accent uppercase mb-1 tracking-tighter">
              {currentMilestone?.name || 'Peak'}
            </Typography>
            <div className="flex gap-1 mt-1">
              {currentMilestone?.crops.map((emoji, i) => (
                <span key={i} className="text-sm bg-black/20 border border-border-primary/30 p-1 rounded-sm">{emoji}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar to next milestone */}
      {nextMilestone && (
        <div className="mt-8 pt-6 border-t border-border-primary/10">
          <div className="flex justify-between items-end mb-2">
            <Typography variant="small" className="font-mono text-[9px] uppercase opacity-60 mb-0">
              Progress to {nextMilestone.name}
            </Typography>
            <span className="text-[9px] font-mono font-bold text-accent">
              {nextMilestone.gdd - totalGDD} GDD REMAINING
            </span>
          </div>
          <div className="w-full h-2 bg-background-secondary border border-border-primary/20 overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-1000 ease-in-out"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono uppercase opacity-30 mt-1">
            <span>{currentMilestone?.name} ({currentMilestone?.gdd || 0})</span>
            <span>{nextMilestone.name} ({nextMilestone.gdd})</span>
          </div>
        </div>
      )}
    </BrutalistBlock>
  );
}
