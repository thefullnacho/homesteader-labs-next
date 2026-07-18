"use client";

import { useState } from "react";
import { AlertTriangle, X, Info } from "lucide-react";
import type { WeatherAlert } from "@/lib/weatherTypes";

interface WeatherAlertsBannerProps {
  alerts: WeatherAlert[];
}

const SEVERITY_STYLES: Record<WeatherAlert["severity"], { border: string; text: string }> = {
  critical: { border: "border-rust", text: "text-rust" },
  high:     { border: "border-marker", text: "text-marker" },
  medium:   { border: "border-ink", text: "text-ink" },
  low:      { border: "border-slateblue", text: "text-slateblue" },
};

export default function WeatherAlertsBanner({ alerts }: WeatherAlertsBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState(false);

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
          Posted warnings
        </span>
        <div className="relative inline-flex">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-ink/40 hover:text-ink/70 transition-colors"
            aria-label="Alert source information"
          >
            <Info size={11} />
          </button>
          {showTooltip && (
            <div className="absolute left-5 top-0 z-50 w-56 p-2 card-paper">
              <p className="font-mono text-[0.62rem] leading-relaxed text-ink/80 relative z-[2]">
                Warnings come from NOAA{"/"}NWS (api.weather.gov). US locations only, so
                international places will show none.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alert strips */}
      {visible.map(alert => {
        const s = SEVERITY_STYLES[alert.severity];
        return (
          <div
            key={alert.id}
            className={`border-2 ${s.border} border-l-8 bg-paper px-4 py-3 flex items-start gap-3`}
          >
            <AlertTriangle size={13} className={`${s.text} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`font-mono text-[0.62rem] font-bold uppercase tracking-widest ${s.text}`}>
                  {alert.severity}
                </span>
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/50">
                  {alert.type}
                </span>
              </div>
              <p className="font-mono text-[0.76rem] font-bold uppercase leading-tight">
                {alert.title}
              </p>
              {alert.action && (
                <p className="text-[0.88rem] text-ink/70 mt-1 leading-snug">
                  {alert.action}
                </p>
              )}
            </div>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
              className="text-ink/40 hover:text-ink transition-colors shrink-0 mt-0.5"
              aria-label="Dismiss alert"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
