'use client';

import React from 'react';
import { AlertTriangle, TrendingDown, Shield, Zap } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';

// ============================================================
// Status thresholds — shared across all three clocks
// ============================================================

export type ClockStatus = 'critical' | 'warning' | 'stable' | 'abundant' | 'unconfigured';

export function getClockStatus(days: number | null): ClockStatus {
  if (days === null) return 'unconfigured';
  if (days < 7)  return 'critical';
  if (days < 30) return 'warning';
  if (days < 90) return 'stable';
  return 'abundant';
}

const STATUS_CONFIG: Record<ClockStatus, {
  color:       string;
  bgColor:     string;
  borderColor: string;
  label:       string;
  Icon:        React.ElementType;
}> = {
  critical:     { color: 'text-red-400',    bgColor: 'bg-red-500/10',    borderColor: 'border-red-500/60',    label: 'Critical',     Icon: AlertTriangle },
  warning:      { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/60', label: 'Low',          Icon: TrendingDown  },
  stable:       { color: 'text-green-400',  bgColor: 'bg-green-500/10',  borderColor: 'border-green-500/30',  label: 'Stable',       Icon: Shield        },
  abundant:     { color: 'text-green-400',  bgColor: 'bg-green-500/10',  borderColor: 'border-green-500/40',  label: 'Abundant',     Icon: Shield        },
  unconfigured: { color: 'text-foreground-primary/30', bgColor: 'bg-black/20', borderColor: 'border-border-primary/20', label: 'Unconfigured', Icon: Zap },
};

// ============================================================
// ClockDisplay
//
// Single survival clock — big day count + status ring + detail rows.
// Pass `days = null` to render an unconfigured state.
// ============================================================

export interface DetailRow {
  label: string;
  value: string;
  dim?:  boolean;   // muted secondary detail
}

interface ClockDisplayProps {
  title:          string;
  systemId:       string;
  icon:           React.ElementType;
  iconColor?:     string;      // fixed icon color, independent of status
  days:           number | null;
  details:        DetailRow[];
  confidence?:    'high' | 'medium' | 'low';
  warning?:       string;      // yellow advisory note
  trend?:         'up' | 'down' | 'stable';  // 7-day projection direction
  projectedLabel?: string;     // e.g. "Harvest in ~23d adds +14d food"
  children?:      React.ReactNode;  // extra content below details
}

export default function ClockDisplay({
  title, systemId, icon: Icon, iconColor, days, details, confidence, warning, trend, projectedLabel, children,
}: ClockDisplayProps) {
  const status = getClockStatus(days);
  const s      = STATUS_CONFIG[status];

  const displayDays = days !== null
    ? days < 1 ? '< 1' : days >= 999 ? '999+' : Math.floor(days).toString()
    : '—';

  const fraction = days !== null && days >= 1 && days < 999
    ? Math.round((days % 1) * 10) / 10
    : null;

  return (
    <BrutalistBlock
      className={`relative flex flex-col gap-0 ${s.bgColor} ${s.borderColor} border-2`}
      refTag={systemId}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 border-2 ${s.borderColor} flex items-center justify-center`}>
            <Icon size={14} className={iconColor ?? s.color} />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-70">
            {title}
          </span>
        </div>
        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${s.borderColor} ${s.color}`}>
          {s.label}
        </span>
      </div>

      {/* Big clock number */}
      <div className="flex items-end gap-2 mb-1">
        <span className={`text-7xl font-mono font-bold leading-none ${s.color} tabular-nums`}>
          {displayDays}
        </span>
        {fraction !== null && (
          <span className={`text-2xl font-mono font-bold leading-none mb-2 ${s.color} opacity-40`}>
            .{fraction.toString().replace('0.', '')}
          </span>
        )}
        <span className="text-sm font-mono uppercase opacity-40 mb-3 ml-1 leading-none">days</span>
        {trend && trend !== 'stable' && (
          <span className={`mb-3 ml-1 text-lg font-mono leading-none ${
            trend === 'up'   ? 'text-green-400' :
            trend === 'down' ? 'text-red-400'   : 'opacity-30'
          }`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* Harvest projection label */}
      {projectedLabel && (
        <div className="text-[9px] font-mono uppercase text-green-400/70 mb-1 -mt-1">
          {projectedLabel}
        </div>
      )}

      {/* Status bar */}
      <div className="h-1 w-full bg-black/30 mb-5">
        {days !== null && (
          <div
            className={`h-full transition-all ${s.color.replace('text-', 'bg-')}`}
            style={{ width: `${Math.min(100, (days / 90) * 100)}%` }}
          />
        )}
      </div>

      {/* Detail rows */}
      <div className="divide-y divide-border-primary/10 mb-4">
        {details.map(row => (
          <div key={row.label} className="flex justify-between items-center py-1.5">
            <span className={`text-[10px] font-mono uppercase ${row.dim ? 'opacity-25' : 'opacity-50'}`}>
              {row.label}
            </span>
            <span className={`text-[10px] font-mono font-bold tabular-nums ${row.dim ? 'opacity-25' : ''}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Confidence badge */}
      {confidence && (
        <div className={`flex items-center gap-1.5 text-[9px] font-mono uppercase px-2 py-1 border ${
          confidence === 'high'   ? 'border-green-500/30  text-green-400/60'  :
          confidence === 'medium' ? 'border-yellow-500/30 text-yellow-400/60' :
                                    'border-border-primary/20 opacity-40'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            confidence === 'high'   ? 'bg-green-400'  :
            confidence === 'medium' ? 'bg-yellow-400' : 'bg-foreground-primary/30'
          }`} />
          Confidence: {confidence}
          {confidence === 'medium' && ' — no forecast'}
          {confidence === 'low'    && ' — no catchment configured'}
        </div>
      )}

      {/* Advisory warning */}
      {warning && (
        <div className="flex items-start gap-2 mt-3 px-2 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[9px] font-mono uppercase leading-relaxed">
          <AlertTriangle size={10} className="shrink-0 mt-0.5" />
          {warning}
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </BrutalistBlock>
  );
}
