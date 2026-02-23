"use client";

import type { ForecastDay } from "@/lib/weatherTypes";

interface WeatherChartProps {
  forecast: ForecastDay[];
}

export default function WeatherChart({ forecast }: WeatherChartProps) {
  const days = forecast.slice(0, 7);
  
  if (days.length === 0) return null;

  const temps = days.flatMap(d => [d.minTemp, d.maxTemp]);
  const minTemp = Math.min(...temps) - 5;
  const maxTemp = Math.max(...temps) + 5;
  const range = maxTemp - minTemp;
  
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (days.length - 1)) * chartWidth;
  const getY = (temp: number) => padding.top + (1 - (temp - minTemp) / range) * chartHeight;

  const highPath = days.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.maxTemp)}`).join(' ');
  const lowPath = days.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.minTemp)}`).join(' ');

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">
          7-Day Temperature Trend
        </h4>
      </div>
      
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto"
        style={{ maxHeight: '200px' }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = padding.top + (pct / 100) * chartHeight;
          return (
            <line 
              key={pct}
              x1={padding.left} 
              y1={y} 
              x2={width - padding.right} 
              y2={y} 
              stroke="currentColor" 
              strokeOpacity={0.1} 
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Temperature labels */}
        {[maxTemp, minTemp].map((temp, i) => (
          <text 
            key={i}
            x={padding.left - 5} 
            y={getY(temp) + 4} 
            textAnchor="end" 
            className="text-[8px] font-mono fill-current opacity-40"
          >
            {temp}°
          </text>
        ))}

        {/* Precipitation bars */}
        {days.map((d, i) => {
          const barHeight = Math.min((d.precipitation / 2) * chartHeight, chartHeight);
          const y = padding.top + chartHeight - barHeight;
          return (
            <rect
              key={`precip-${i}`}
              x={getX(i) - 8}
              y={y}
              width={16}
              height={barHeight}
              fill="currentColor"
              className="fill-blue-500/30"
            />
          );
        })}

        {/* High temp line */}
        <path
          d={highPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="stroke-orange-500"
        />

        {/* Low temp line */}
        <path
          d={lowPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="stroke-blue-400"
        />

        {/* Data points */}
        {days.map((d, i) => (
          <g key={i}>
            <circle 
              cx={getX(i)} 
              cy={getY(d.maxTemp)} 
              r={3} 
              className="fill-orange-500"
            />
            <circle 
              cx={getX(i)} 
              cy={getY(d.minTemp)} 
              r={3} 
              className="fill-blue-400"
            />
          </g>
        ))}

        {/* Day labels */}
        {days.map((d, i) => {
          const date = new Date(d.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - 10}
              textAnchor="middle"
              className="text-[8px] font-mono fill-current opacity-60"
            >
              {dayName}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-orange-500" />
          <span className="text-[8px] font-mono opacity-40">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-400" />
          <span className="text-[8px] font-mono opacity-40">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500/30" />
          <span className="text-[8px] font-mono opacity-40">Precip</span>
        </div>
      </div>
    </div>
  );
}
