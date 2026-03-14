'use client';

import { useState } from 'react';
import {
  Utensils, Droplets, Zap, Settings,
  LayoutDashboard, RefreshCw,
} from 'lucide-react';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import ClockDisplay, { type DetailRow } from './ClockDisplay';
import ActualsInput, { type Actuals } from './ActualsInput';
import { useSurvivalData } from '@/lib/caloric-security/useSurvivalData';
import { resetConfig } from '@/lib/caloric-security/homesteadStore';
import type { ForecastDay } from '@/lib/weatherTypes';

// ============================================================
// AutonomyDashboard
//
// The three survival clocks:
//   1. Days of Food    — from caloricTotals.daysOfFood
//   2. Days of Water   — from waterAutonomy.daysOfWater
//   3. Days of Energy  — Phase 4 placeholder
//
// forecastDays flows in from the existing weather context
// (parent page reads from FieldStationContext / weatherApi).
// ============================================================

interface AutonomyDashboardProps {
  forecastDays?: ForecastDay[];
  onReconfigure: () => void;
}

export default function AutonomyDashboard({
  forecastDays = [],
  onReconfigure,
}: AutonomyDashboardProps) {
  const [actuals, setActuals] = useState<Actuals>({
    storedGallons:          0,
    irrigationDailyGallons: 0,
    currentBatteryPct:      100,
  });

  const { config, caloricTotals, waterAutonomy, energyAutonomy, isLoading } = useSurvivalData({
    storedGallons:          actuals.storedGallons,
    currentBatteryPct:      actuals.currentBatteryPct,
    forecastDays,
    irrigationDailyGallons: actuals.irrigationDailyGallons > 0
      ? actuals.irrigationDailyGallons
      : undefined,
  });

  async function handleReset() {
    if (!confirm('Reset homestead config? This cannot be undone.')) return;
    await resetConfig();
    onReconfigure();
  }

  // ── Food clock details ──────────────────────────────────
  const foodDetails: DetailRow[] = caloricTotals ? [
    { label: 'Total kcal stored',    value: caloricTotals.totalKcal.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' kcal' },
    { label: 'Daily target',         value: (caloricTotals.daysOfFood > 0 ? (caloricTotals.totalKcal / caloricTotals.daysOfFood) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' kcal/day' },
    { label: 'Crops tracked',        value: caloricTotals.cropBreakdown.length.toString() },
    ...(caloricTotals.skippedNonCaloric.length > 0 ? [{
      label: 'Non-caloric skipped',
      value: caloricTotals.skippedNonCaloric.length.toString(),
      dim:   true,
    }] : []),
  ] : [];

  const topCategory = caloricTotals
    ? Object.entries(caloricTotals.byCategory).sort(([, a], [, b]) => b - a)[0]
    : null;
  if (topCategory) {
    foodDetails.push({
      label: 'Top source',
      value: topCategory[0] + ' (' + Math.round((topCategory[1] / (caloricTotals!.totalKcal || 1)) * 100) + '%)',
      dim:   false,
    });
  }

  // ── Water clock details ─────────────────────────────────
  const waterDetails: DetailRow[] = waterAutonomy ? [
    { label: 'Stored',            value: actuals.storedGallons + ' gal' },
    { label: 'Forecast inflow',   value: waterAutonomy.projectedInflowGallons.toFixed(1) + ' gal' },
    { label: 'Daily household',   value: waterAutonomy.dailyHouseholdNeed + ' gal/day' },
    { label: 'Daily total',       value: waterAutonomy.dailyTotalNeed + ' gal/day' },
    { label: 'Stored-only',       value: waterAutonomy.currentSupplyDays.toFixed(1) + ' days', dim: true },
  ] : [
    { label: 'Stored',            value: actuals.storedGallons + ' gal' },
  ];

  const irrigationWarning = waterAutonomy && !waterAutonomy.irrigationTracked
    ? 'Irrigation not tracked — set daily gal/day in actuals to include in clock.'
    : undefined;

  // ── Loading / error states ──────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="text-xs font-mono uppercase opacity-30 animate-pulse">
          Reading_Manifest...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-border-primary pb-6">
        <div>
          <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono">
            Autonomy_Dashboard
          </Typography>
          <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
            Survival_Clocks // Homestead_Security_Index
          </Typography>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ActualsInput actuals={actuals} onChange={setActuals} />
          <Badge variant="status" pulse>Clocks_Active</Badge>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-30 hover:opacity-60 hover:text-accent transition-all"
          >
            <Settings size={10} />
            Reconfigure
          </button>
        </div>
      </div>

      {/* Config summary strip */}
      {config && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono uppercase opacity-40 border border-border-primary/20 px-4 py-2">
          <span>Household: {config.householdSize} persons</span>
          <span>Skill: {(config.skillLevel * 100).toFixed(0)}%</span>
          <span>Tank: {config.waterCatchment.storageCap.toLocaleString()} gal cap</span>
          <span>Solar: {config.energy.solarArrayWatts} W</span>
          <span>Battery: {config.energy.batteryCapacityAh} Ah</span>
        </div>
      )}

      {/* Three clocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Clock 1 — Days of Food */}
        <ClockDisplay
          title="Days_of_Food"
          systemId="CALORIC_SEC_v1"
          icon={Utensils}
          days={caloricTotals?.daysOfFood ?? null}
          details={foodDetails}
        >
          {caloricTotals && caloricTotals.cropBreakdown.length === 0 && (
            <div className="text-[9px] font-mono uppercase opacity-40 text-center py-2">
              No inventory — add crops to start tracking
            </div>
          )}
          {caloricTotals && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: 'Protein', grams: caloricTotals.totalProteinG },
                { label: 'Carbs',   grams: caloricTotals.totalCarbsG   },
                { label: 'Fat',     grams: caloricTotals.totalFatG      },
              ].map(m => (
                <div key={m.label} className="text-center border border-border-primary/20 py-1.5">
                  <div className="text-sm font-mono font-bold tabular-nums">
                    {(m.grams / 1000).toFixed(1)}<span className="text-[8px] opacity-40">kg</span>
                  </div>
                  <div className="text-[8px] font-mono uppercase opacity-40">{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </ClockDisplay>

        {/* Clock 2 — Days of Water */}
        <ClockDisplay
          title="Days_of_Water"
          systemId="HYDRO_SEC_v1"
          icon={Droplets}
          days={waterAutonomy?.daysOfWater ?? null}
          details={waterDetails}
          confidence={waterAutonomy?.confidence}
          warning={irrigationWarning}
        >
          {actuals.storedGallons === 0 && (
            <div className="text-[9px] font-mono uppercase opacity-40 text-center py-2">
              Enter stored gallons via Update_Actuals
            </div>
          )}
        </ClockDisplay>

        {/* Clock 3 — Days of Energy */}
        <ClockDisplay
          title="Days_of_Energy"
          systemId="ENERGY_SEC_v1"
          icon={Zap}
          days={energyAutonomy?.daysOfEnergy ?? null}
          details={energyAutonomy ? [
            { label: 'Battery stored',   value: energyAutonomy.storedUsableWh.toFixed(0) + ' Wh' },
            { label: 'Forecast solar',   value: energyAutonomy.projectedSolarWh.toFixed(0) + ' Wh' },
            { label: 'Daily draw',       value: energyAutonomy.dailyDrawWh.toFixed(0) + ' Wh/day' },
            { label: 'Avg daily solar',  value: energyAutonomy.averageDailySolarWh.toFixed(0) + ' Wh/day' },
            { label: 'Battery-only',     value: energyAutonomy.currentSupplyDays.toFixed(1) + ' days', dim: true },
          ] : config ? [
            { label: 'Battery bank',  value: config.energy.batteryCapacityAh + ' Ah' },
            { label: 'Solar array',   value: config.energy.solarArrayWatts + ' W'    },
            { label: 'Baseload draw', value: config.energy.baseloadWatts + ' W'      },
          ] : []}
          confidence={energyAutonomy?.confidence}
          warning={energyAutonomy?.solarCoversBaseload
            ? undefined
            : energyAutonomy && energyAutonomy.averageDailySolarWh > 0
              ? 'Solar output below baseload — battery depleting.'
              : undefined}
        >
          {energyAutonomy?.solarCoversBaseload && (
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase px-2 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Solar covers baseload — system self-sustaining
            </div>
          )}
          {actuals.currentBatteryPct === 100 && (
            <div className="text-[9px] font-mono opacity-30 text-center py-1 uppercase">
              Battery % set via Update_Actuals
            </div>
          )}
        </ClockDisplay>
      </div>

      {/* Inventory summary */}
      {caloricTotals && caloricTotals.cropBreakdown.length > 0 && (
        <BrutalistBlock refTag="INVENTORY_MANIFEST" className="overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h4" className="text-xs uppercase tracking-widest font-mono opacity-60 mb-0 flex items-center gap-2">
              <LayoutDashboard size={12} /> Inventory_Manifest
            </Typography>
            <Button href="/tools/caloric-security/inventory" variant="ghost" size="sm">
              Manage →
            </Button>
          </div>

          <table className="w-full text-[10px] font-mono uppercase">
            <thead>
              <tr className="border-b border-border-primary/20">
                {['Crop', 'Plants', 'Kcal (raw)', 'Kcal (effective)', 'Decay', 'Macros P/C/F'].map(h => (
                  <th key={h} className="text-left py-1.5 pr-4 opacity-40 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary/10">
              {caloricTotals.cropBreakdown.slice(0, 8).map(r => (
                <tr key={r.cropId} className="hover:bg-black/20 transition-colors">
                  <td className="py-1.5 pr-4 font-bold">{r.cropName}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{r.plantCount}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{r.totalKcal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className={`py-1.5 pr-4 tabular-nums font-bold ${r.decayModifier < 1 ? 'text-yellow-400' : ''}`}>
                    {r.effectiveKcal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`py-1.5 pr-4 tabular-nums ${r.decayModifier < 0.5 ? 'text-red-400' : r.decayModifier < 1 ? 'text-yellow-400' : 'opacity-40'}`}>
                    {(r.decayModifier * 100).toFixed(0)}%
                  </td>
                  <td className="py-1.5 opacity-40 tabular-nums">
                    {(r.macros.proteinG / 1000).toFixed(1)}k /&nbsp;
                    {(r.macros.carbsG   / 1000).toFixed(1)}k /&nbsp;
                    {(r.macros.fatG     / 1000).toFixed(1)}k
                  </td>
                </tr>
              ))}
              {caloricTotals.cropBreakdown.length > 8 && (
                <tr>
                  <td colSpan={6} className="py-2 opacity-30 text-center">
                    +{caloricTotals.cropBreakdown.length - 8} more — view all in Manage
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </BrutalistBlock>
      )}

      {/* Footer */}
      <div className="pt-6 pb-2 flex flex-col items-center gap-3 border-t border-border-primary/10 opacity-20 font-mono">
        <div className="flex items-center gap-4">
          <RefreshCw size={14} />
          <span className="text-[8px] uppercase tracking-[0.4em]">Clocks_Update_On_Inventory_Change</span>
        </div>
        <span className="text-[8px] uppercase tracking-widest text-center">
          Data stored locally // IndexedDB // No server sync
        </span>
      </div>
    </div>
  );
}
