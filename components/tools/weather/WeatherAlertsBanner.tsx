"use client";

import { useState } from "react";
import { AlertTriangle, X, Info } from "lucide-react";
import type { WeatherAlert } from "@/lib/weatherTypes";

interface WeatherAlertsBannerProps {
  alerts: WeatherAlert[];
}

const SEVERITY_STYLES: Record<WeatherAlert["severity"], { border: string; bg: string; text: string; icon: string }> = {
  critical: { border: "border-red-500",    bg: "bg-red-500/10",    text: "text-red-400",    icon: "text-red-500" },
  high:     { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", icon: "text-orange-500" },
  medium:   { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", icon: "text-yellow-500" },
  low:      { border: "border-blue-500",   bg: "bg-blue-500/10",   text: "text-blue-400",   icon: "text-blue-500" },
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
        <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">
          Active Alerts
        </span>
        <div className="relative inline-flex">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="opacity-30 hover:opacity-70 transition-opacity"
            aria-label="Alert source information"
          >
            <Info size={11} />
          </button>
          {showTooltip && (
            <div className="absolute left-5 top-0 z-50 w-56 p-2 bg-background-secondary border border-border-primary/40 shadow-brutalist-sm">
              <p className="text-[9px] font-mono leading-relaxed opacity-80">
                Alerts sourced from NOAA{"/"}NWS (api.weather.gov). US locations only — international locations will show no alerts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alert strips */}
      {visible.map(alert => {
        const s = SEVERITY_STYLES[alert.severity];
        return (
          <div key={alert.id} className={`border-l-4 ${s.border} ${s.bg} px-4 py-3 flex items-start gap-3`}>
            <AlertTriangle size={13} className={`${s.icon} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${s.text}`}>
                  {alert.severity}
                </span>
                <span className="text-[9px] font-mono opacity-40 uppercase">{alert.type}</span>
              </div>
              <p className="text-[11px] font-mono uppercase leading-tight opacity-90">
                {alert.title}
              </p>
              {alert.action && (
                <p className="text-[10px] font-mono opacity-50 uppercase mt-1 leading-tight">
                  {alert.action}
                </p>
              )}
            </div>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
              className="opacity-30 hover:opacity-70 transition-opacity shrink-0 mt-0.5"
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
