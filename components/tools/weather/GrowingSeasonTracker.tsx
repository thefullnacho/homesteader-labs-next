"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Leaf, ThermometerSun } from "lucide-react";
import Typography from "@/components/ui/Typography";
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Leaf size={16} className="text-green-500" />
        <Typography variant="small" className="font-mono font-bold uppercase text-[10px]">
          Growing Season Tracker
        </Typography>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-black/20 border border-border-primary">
          <ThermometerSun size={20} className="mx-auto mb-2 text-orange-400" />
          <Typography variant="h3" className="font-mono text-xl">{totalGDD}</Typography>
          <Typography variant="small" className="font-mono text-[8px] opacity-60">CUMULATIVE GDD</Typography>
        </div>
        
        <div className="text-center p-3 bg-black/20 border border-border-primary">
          <TrendingUp size={20} className="mx-auto mb-2 text-green-500" />
          <Typography variant="h3" className="font-mono text-xl">{daysSinceStart}</Typography>
          <Typography variant="small" className="font-mono text-[8px] opacity-60">DAYS SINCE SPRING</Typography>
        </div>
        
        <div className="text-center p-3 bg-black/20 border border-border-primary">
          <Leaf size={20} className="mx-auto mb-2 text-accent" />
          <Typography variant="h3" className="font-mono text-sm">{currentMilestone?.name || 'Peak'}</Typography>
          <Typography variant="small" className="font-mono text-[8px] opacity-60">CURRENT STAGE</Typography>
        </div>
      </div>
      
      {/* Progress bar to next milestone */}
      {nextMilestone && (
        <div className="mt-4">
          <div className="flex justify-between text-[8px] font-mono opacity-60 mb-1">
            <span>{currentMilestone?.name}</span>
            <span>{nextMilestone.name} ({nextMilestone.gdd} GDD)</span>
          </div>
          <div className="h-2 bg-black/40 border border-border-primary overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-accent transition-all duration-500"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <Typography variant="small" className="font-mono text-[8px] opacity-40 mt-1">
            {nextMilestone.gdd - totalGDD} GDD until {nextMilestone.name}
          </Typography>
        </div>
      )}
      
      {/* Current stage crops */}
      {currentMilestone && (
        <div className="mt-3 p-3 bg-black/20 border border-border-primary">
          <Typography variant="small" className="font-mono text-[8px] opacity-60 mb-2">
            RECOMMENDED PLANTING:
          </Typography>
          <div className="flex gap-2">
            {currentMilestone.crops.map((emoji, i) => (
              <span key={i} className="text-xl">{emoji}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
