"use client";

import React from 'react';
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import type { ForecastDay } from "@/app/lib/weatherTypes";

interface ForecastGridProps {
  forecast: ForecastDay[];
}

const ForecastGrid = ({ forecast }: ForecastGridProps) => {
  const getWeatherEmoji = (cloudCover: number, precipitation: number): string => {
    if (precipitation > 0.2) return "🌧";
    if (precipitation > 0.05) return "🌦";
    if (cloudCover > 75) return "☁";
    if (cloudCover > 40) return "⛅";
    return "☀";
  };

  return (
    <div className="border-2 border-border-primary divide-x-2 divide-border-primary flex overflow-x-auto bg-black/20 no-scrollbar">
      {forecast.slice(0, 7).map((day, i) => (
        <div key={day.date} className="min-w-[120px] flex-1 p-4 flex flex-col items-center group hover:bg-background-secondary transition-colors cursor-default">
          <Typography variant="small" className="font-mono text-[9px] mb-3 opacity-40 uppercase tracking-tighter">
            {i === 0 ? "ENTRY_TODAY" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
          </Typography>
          
          <div className="text-2xl mb-4 group-hover:scale-110 transition-transform">
            {getWeatherEmoji(day.cloudCover, day.precipitation)}
          </div>
          
          <div className="text-center mb-3">
            <div className="text-lg font-bold font-mono leading-none mb-1">{Math.round(day.maxTemp)}°</div>
            <div className="text-[10px] font-mono opacity-30">{Math.round(day.minTemp)}°</div>
          </div>

          <div className="h-4 flex items-center justify-center">
            {day.precipitation > 0.05 && (
              <Badge variant="outline" className="text-[7px] px-1 py-0 border-blue-500/30 text-blue-400">
                {day.precipitation.toFixed(1)}"
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForecastGrid;
