"use client";

import React from 'react';
import { Thermometer, Droplets, Wind, Sun } from 'lucide-react';
import Typography from "@/components/ui/Typography";
import type { WeatherData } from "@/lib/weatherTypes";

interface TelemetryHeaderProps {
  weather: WeatherData;
}

const TelemetryHeader = ({ weather }: TelemetryHeaderProps) => {
  const getWindDirection = (degrees: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getUVDescription = (uv: number): string => {
    if (uv <= 2) return "LOW";
    if (uv <= 5) return "MOD";
    if (uv <= 7) return "HIGH";
    if (uv <= 10) return "VERY_HIGH";
    return "EXTREME";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-border-primary divide-x-2 divide-y-2 lg:divide-y-0 divide-border-primary bg-black/40 mb-8">
      {/* TEMP */}
      <div className="p-4 flex flex-col justify-between h-28 relative overflow-hidden">
        <Typography variant="small" className="font-mono text-[9px] mb-0 tracking-widest uppercase font-bold opacity-80">Ambient Temp</Typography>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tighter">{Math.round(weather.current.temperature)}°F</span>
          <span className="text-xs font-mono opacity-30 uppercase">Feels: {Math.round(weather.current.feelsLike)}°</span>
        </div>
        <Thermometer className="absolute -right-3 -bottom-3 text-red-400 opacity-[0.15] pointer-events-none" size={80} />
      </div>

      {/* HUMIDITY */}
      <div className="p-4 flex flex-col justify-between h-28 relative overflow-hidden">
        <Typography variant="small" className="font-mono text-[9px] mb-0 tracking-widest uppercase font-bold opacity-80">Humidity</Typography>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tighter">{weather.current.humidity}%</span>
          <span className="text-xs font-mono opacity-30 uppercase">Dewpoint: {Math.round(weather.current.dewPoint)}°</span>
        </div>
        <Droplets className="absolute -right-3 -bottom-3 text-blue-400 opacity-[0.15] pointer-events-none" size={80} />
      </div>

      {/* WIND */}
      <div className="p-4 flex flex-col justify-between h-28 relative overflow-hidden">
        <Typography variant="small" className="font-mono text-[9px] mb-0 tracking-widest uppercase font-bold opacity-80">Wind</Typography>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tighter">{Math.round(weather.current.windSpeed)}</span>
          <span className="text-xs font-mono opacity-30 uppercase">MPH {getWindDirection(weather.current.windDirection)}</span>
        </div>
        <Wind className="absolute -right-3 -bottom-3 text-sky-300 opacity-[0.15] pointer-events-none" size={80} />
      </div>

      {/* UV */}
      <div className="p-4 flex flex-col justify-between h-28 relative overflow-hidden">
        <Typography variant="small" className="font-mono text-[9px] mb-0 tracking-widest uppercase font-bold opacity-80">Solar Index</Typography>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tighter">{weather.current.uvIndex}</span>
          <span className="text-xs font-mono opacity-30 uppercase">UV {getUVDescription(weather.current.uvIndex)}</span>
        </div>
        <Sun className="absolute -right-3 -bottom-3 text-yellow-400 opacity-[0.15] pointer-events-none" size={80} />
      </div>
    </div>
  );
};

export default TelemetryHeader;
