"use client";

import type { HourlyForecast } from "@/lib/weatherTypes";

interface HourlyChartProps {
  hourly: HourlyForecast[];
}

export default function HourlyChart({ hourly }: HourlyChartProps) {
  // Use the next 24 hours of data
  const data = hourly.slice(0, 24);
  
  if (data.length === 0) return null;

  const temps = data.map(d => d.temperature);
  const minTemp = Math.min(...temps) - 5;
  const maxTemp = Math.max(...temps) + 5;
  const range = maxTemp - minTemp;
  
  const width = 800;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
  const getY = (temp: number) => padding.top + (1 - (temp - minTemp) / range) * chartHeight;

  const tempPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.temperature)}`).join(' ');
  const feelsLikePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.feelsLike)}`).join(' ');

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center gap-3 mb-2 min-w-[600px]">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">
          24-Hour Micro-Trend
        </h4>
      </div>
      
      <div className="min-w-[600px]">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto"
          style={{ maxHeight: '200px' }}
        >
          {/* Grid lines */}
          {[0, 50, 100].map(pct => {
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
              {Math.round(temp)}°
            </text>
          ))}

          {/* Precipitation & Snow bars */}
          {data.map((d, i) => {
            // Precipitation (blue)
            const precipHeight = Math.min((d.precipitation * 10) * chartHeight, chartHeight);
            // Snowfall (white/gray)
            const snowHeight = Math.min((d.snowfall * 2) * chartHeight, chartHeight);
            
            const totalHeight = Math.min(precipHeight + snowHeight, chartHeight);
            const y = padding.top + chartHeight - totalHeight;
            
            return (
              <g key={`precip-snow-${i}`}>
                {/* Rain */}
                {precipHeight > 0 && (
                  <rect
                    x={getX(i) - 4}
                    y={padding.top + chartHeight - precipHeight}
                    width={8}
                    height={precipHeight}
                    fill="currentColor"
                    className="fill-blue-500/40"
                  />
                )}
                {/* Snow on top of rain */}
                {snowHeight > 0 && (
                  <rect
                    x={getX(i) - 4}
                    y={y}
                    width={8}
                    height={snowHeight}
                    fill="currentColor"
                    className="fill-white/60"
                  />
                )}
              </g>
            );
          })}

          {/* Feels Like line */}
          <path
            d={feelsLikePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4,4"
            className="stroke-orange-500/50"
          />

          {/* Temperature line */}
          <path
            d={tempPath}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="stroke-orange-500"
          />

          {/* Data points */}
          {data.map((d, i) => (
            <g key={`points-${i}`}>
              <circle 
                cx={getX(i)} 
                cy={getY(d.temperature)} 
                r={2} 
                className="fill-orange-500"
              />
            </g>
          ))}

          {/* Time labels (every 3 hours to avoid crowding) */}
          {data.map((d, i) => {
            if (i % 3 !== 0) return null;
            
            const date = new Date(d.time);
            const hour = date.getHours();
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            
            return (
              <text
                key={`time-${i}`}
                x={getX(i)}
                y={height - 15}
                textAnchor="middle"
                className="text-[8px] font-mono fill-current opacity-60"
              >
                {displayHour}{ampm}
              </text>
            );
          })}
          
          {/* POP labels (Probability of Precipitation) */}
          {data.map((d, i) => {
            if (d.precipitationProbability < 20 || i % 2 !== 0) return null;
            
            return (
              <text
                key={`pop-${i}`}
                x={getX(i)}
                y={padding.top + chartHeight - 5}
                textAnchor="middle"
                className="text-[7px] font-mono fill-blue-300 opacity-80"
              >
                {d.precipitationProbability}%
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-2 pb-2 border-b border-border-primary/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-orange-500" />
            <span className="text-[8px] font-mono opacity-40 uppercase">Temp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-orange-500/50 border-b border-dashed border-transparent" style={{ borderBottomStyle: 'dashed' }} />
            <span className="text-[8px] font-mono opacity-40 uppercase">Feels Like</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500/40" />
            <span className="text-[8px] font-mono opacity-40 uppercase">Rain</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/60" />
            <span className="text-[8px] font-mono opacity-40 uppercase">Snow</span>
          </div>
        </div>
      </div>
    </div>
  );
}