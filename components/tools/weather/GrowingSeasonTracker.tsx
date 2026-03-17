"use client";

import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { TrendingUp, Leaf, ThermometerSun } from "lucide-react";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import type { ForecastDay } from "@/lib/weatherTypes";
import { db } from "@/lib/db";

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

const BASE_TEMP = 50;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toLocationKey(name: string) {
  return name.replace(/\s+/g, '_').toLowerCase();
}

export default function GrowingSeasonTracker({ forecast, locationName }: GrowingSeasonProps) {
  const year = new Date().getFullYear();
  const key = toLocationKey(locationName);

  const seasonStart = useMemo(() => new Date(year, 2, 20), [year]);
  const daysSinceStart = Math.max(0, Math.floor((Date.now() - seasonStart.getTime()) / 86400000));

  // Historical GDD — persisted in IndexedDB, updated at most once per calendar day
  const record = useLiveQuery(
    () => db.gdd.where('[locationKey+year]').equals([key, year]).first(),
    [key, year]
  );

  // Forecast GDD — derived fresh every render, never stored
  const forecastGDD = useMemo(() => {
    return forecast.slice(0, 14).reduce((acc, day) => {
      const avg = (day.maxTemp + day.minTemp) / 2;
      return avg > BASE_TEMP ? acc + (avg - BASE_TEMP) : acc;
    }, 0);
  }, [forecast]);

  const historicalGDD = record?.historicalGDD ?? 0;
  const totalGDD = Math.round(historicalGDD + forecastGDD);

  // Advance the stored historical GDD by one day's worth when the calendar day turns
  useEffect(() => {
    if (!forecast.length) return;
    const today = todayISO();

    async function maybeAdvanceDay() {
      const existing = await db.gdd.where('[locationKey+year]').equals([key, year]).first();

      if (!existing) {
        await db.gdd.add({ locationKey: key, year, historicalGDD: 0, lastUpdated: today });
        return;
      }

      if (existing.lastUpdated === today) return;

      // A new day has passed — fold forecast[0] (most recent day) into the historical total
      const avg = (forecast[0].maxTemp + forecast[0].minTemp) / 2;
      const dayGDD = avg > BASE_TEMP ? avg - BASE_TEMP : 0;

      await db.gdd.update(existing.id!, {
        historicalGDD: existing.historicalGDD + dayGDD,
        lastUpdated: today,
      });
    }

    maybeAdvanceDay();
  }, [key, year, forecast]);

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
            <span className="text-xs font-mono opacity-40 uppercase mb-1">Base 50°F</span>
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
            <span className="text-xs font-mono opacity-40 uppercase mb-1">Days</span>
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
