"use client";

import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { ForecastDay } from "@/lib/weatherTypes";
import { db } from "@/lib/db";
import { useFieldStation } from "@/app/context/FieldStationContext";

interface GrowingSeasonProps {
  forecast: ForecastDay[];
  locationName: string;
}

interface SeasonMilestone {
  name: string;
  gdd: number;
  description: string;
}

const MILESTONES: SeasonMilestone[] = [
  { name: 'Early Spring', gdd: 200, description: 'peas, spinach, kale' },
  { name: 'Spring Planting', gdd: 400, description: 'beets, carrots, lettuce' },
  { name: 'Warm Season Start', gdd: 600, description: 'beans, corn, squash' },
  { name: 'Summer', gdd: 1000, description: 'tomatoes, peppers' },
  { name: 'Peak Summer', gdd: 1500, description: 'peak growing season' },
];

const SCALE_MAX = 1500;

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
  const { frostDates } = useFieldStation();

  // Use the user's actual last spring frost date if available; fall back to spring equinox
  const seasonStart = useMemo(() => {
    if (frostDates?.lastSpringFrost) {
      const d = new Date(frostDates.lastSpringFrost);
      return new Date(year, d.getMonth(), d.getDate());
    }
    return new Date(year, 2, 20);
  }, [year, frostDates]);
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

  // Last milestone crossed (where you are), first one still ahead (where you're going)
  const passedMilestone = [...MILESTONES].reverse().find(m => m.gdd <= totalGDD);
  const nextMilestone = MILESTONES.find(m => m.gdd > totalGDD);
  const gddPct = Math.min(100, (totalGDD / SCALE_MAX) * 100);

  return (
    <div className="card-paper grain p-6">
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-5 relative z-[2]">
        <h3 className="font-display uppercase text-lg">Heat units (GDD)</h3>
        <span className="font-mono text-[0.66rem] uppercase tracking-widest text-ink/50">base 50°F</span>
      </div>

      <div className="flex items-baseline gap-2 mb-3 relative z-[2]">
        <span className="font-display text-4xl">{totalGDD}</span>
        <span className="font-mono text-[0.72rem] uppercase tracking-wider text-ink/60">
          banked, plus the coming fortnight
        </span>
      </div>

      <div className="relative h-8 border-2 border-ink bg-paper mt-8 z-[2]">
        <div className="absolute inset-y-0 left-0 bg-moss/70" style={{ width: `${gddPct}%` }} />
        {MILESTONES.filter(m => m.gdd < SCALE_MAX).map((m) => (
          <div
            key={m.gdd}
            className="absolute inset-y-0 w-0.5 bg-ink/40"
            style={{ left: `${(m.gdd / SCALE_MAX) * 100}%` }}
          />
        ))}
        {nextMilestone && (
          <span
            className="absolute -top-6 font-mono text-[0.6rem] uppercase tracking-wide text-rust whitespace-nowrap"
            style={{
              left: `${Math.min(88, Math.max(12, (nextMilestone.gdd / SCALE_MAX) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {nextMilestone.name.toLowerCase()} at {nextMilestone.gdd.toLocaleString()}
          </span>
        )}
      </div>
      <div className="flex justify-between font-mono text-[0.64rem] text-ink/55 mt-1.5 relative z-[2]">
        <span>0</span>
        <span className="font-bold text-ink">
          you are here: {passedMilestone ? `past ${passedMilestone.name.toLowerCase()}` : 'season opening'}
        </span>
        <span>{SCALE_MAX.toLocaleString()}</span>
      </div>

      <p className="mt-4 text-[0.95rem] text-ink/80 leading-snug relative z-[2]">
        {nextMilestone ? (
          <>
            <strong className="font-bold">{nextMilestone.gdd - totalGDD}</strong> more heat units to{' '}
            {nextMilestone.name.toLowerCase()}: {nextMilestone.description}.
          </>
        ) : (
          <>Peak season. Everything that wants heat has it.</>
        )}
      </p>

      <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 relative z-[2]">
        Day {daysSinceStart} of the season · counted from{' '}
        {seasonStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        {frostDates?.lastSpringFrost ? ' (your last frost)' : ' (spring equinox)'}
      </p>
    </div>
  );
}
