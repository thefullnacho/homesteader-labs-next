'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Utensils, Droplets, Zap, Settings, Pencil,
  LayoutDashboard, RefreshCw, TrendingUp, Leaf, Plus,
} from 'lucide-react';
import Link from 'next/link';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import ClockDisplay, { type DetailRow } from './ClockDisplay';
import ActualsInput, { type Actuals } from './ActualsInput';
import FrostGuardAlert from './FrostGuardAlert';
import DroughtAlert from './DroughtAlert';
import CanningDayBanner from './CanningDayBanner';
import DecayAlerts from './DecayAlerts';
import FocusCardDeck from './FocusCardDeck';
import LogHarvestModal from './LogHarvestModal';
import { useSurvivalData } from '@/lib/caloric-security/useSurvivalData';
import { resetConfig, getActuals, saveActuals } from '@/lib/caloric-security/homesteadStore';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import { calculateItemDecay } from '@/lib/caloric-security/decayCalculations';
import { estimateHarvestContribution, projectFoodDays } from '@/lib/caloric-security/projectionCalculations';
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
  onEditConfig:  () => void;
}

export default function AutonomyDashboard({
  forecastDays = [],
  onReconfigure,
  onEditConfig,
}: AutonomyDashboardProps) {
  const [actuals, setActuals] = useState<Actuals>({
    storedGallons:          0,
    irrigationDailyGallons: 0,
    currentBatteryPct:      100,
  });
  const actualsLoaded = useRef(false);
  const [showLogHarvest, setShowLogHarvest] = useState(false);

  // Load persisted actuals on mount
  useEffect(() => {
    getActuals().then(row => {
      if (row) {
        setActuals({
          storedGallons:          row.storedGallons,
          irrigationDailyGallons: row.irrigationDailyGallons,
          currentBatteryPct:      row.currentBatteryPct,
        });
      }
      actualsLoaded.current = true;
    }).catch(() => { actualsLoaded.current = true; });
  }, []);

  // Persist actuals whenever they change (after initial load)
  useEffect(() => {
    if (!actualsLoaded.current) return;
    saveActuals(actuals).catch(console.error);
  }, [actuals]);

  const { config, caloricTotals, waterAutonomy, energyAutonomy, inventory, isLoading } = useSurvivalData({
    storedGallons:          actuals.storedGallons,
    currentBatteryPct:      actuals.currentBatteryPct,
    forecastDays,
    irrigationDailyGallons: actuals.irrigationDailyGallons > 0
      ? actuals.irrigationDailyGallons
      : undefined,
  });

  async function handleReset() {
    if (!confirm('Wipe all config and inventory? This cannot be undone.')) return;
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

  // ── Frost Guard: names of active crops ──────────────────
  const activeCropNames = inventory
    .filter(i => i.status === 'active')
    .map(i => getCropById(i.cropId)?.name ?? i.cropId)
    .filter(Boolean);

  // ── Canning Day: fresh stored items in declining phase ──
  const decliningFreshItems = inventory
    .filter(i => i.status === 'stored' && (!i.preservationMethod || i.preservationMethod === 'fresh'))
    .map(i => {
      const crop = getCropById(i.cropId);
      if (!crop) return null;
      const decay = calculateItemDecay(i, crop);
      return decay.phase === 'declining' ? crop.name : null;
    })
    .filter(Boolean) as string[];

  // ── Harvest contribution + food clock trend ─────────────────
  const harvestContribution = config
    ? estimateHarvestContribution(inventory, config)
    : null;

  const currentFoodDays = caloricTotals?.daysOfFood ?? 0;

  const foodTrend: 'up' | 'down' | 'stable' | undefined = (() => {
    if (!config || currentFoodDays <= 0) return undefined;
    const projected7 = projectFoodDays(inventory, config, 7);
    const delta = projected7 - currentFoodDays;
    if (delta < -0.05 * currentFoodDays) return 'down';
    if (delta >  0.05 * currentFoodDays) return 'up';
    return 'stable';
  })();

  const projectedLabel: string | undefined = (() => {
    if (!harvestContribution || harvestContribution.foodDays <= 0) return undefined;
    if (harvestContribution.nearestHarvestDays === null) return undefined;
    const fd = Math.round(harvestContribution.foodDays);
    const nd = harvestContribution.nearestHarvestDays;
    return `Harvest in ~${nd}d adds +${fd}d food`;
  })();

  // ── Loading / error states ──────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="text-xs font-mono uppercase opacity-30 animate-pulse">
          Loading...
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
            Resilience Dashboard
          </Typography>
          <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
            Survival clocks // Homestead security index
          </Typography>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ActualsInput actuals={actuals} onChange={setActuals} />
          <Badge variant="status" pulse>Live</Badge>
          <button
            onClick={onEditConfig}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-40 hover:opacity-80 hover:text-accent transition-all"
          >
            <Pencil size={10} />
            Edit Config
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-20 hover:opacity-50 hover:text-red-400 transition-all"
          >
            <Settings size={10} />
            Reset
          </button>
        </div>
      </div>

      {/* Frost Guard alert — shows when freeze detected + active crops at risk */}
      <FrostGuardAlert forecastDays={forecastDays} activeCropNames={activeCropNames} />

      {/* Drought alert — shows when no rain forecast + water supply below 30 days */}
      <DroughtAlert waterAutonomy={waterAutonomy} activeCropCount={activeCropNames.length} />

      {/* Config summary strip */}
      {config && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono uppercase opacity-40 border border-border-primary/20 px-4 py-2">
          <span>Household: {config.householdSize} persons</span>
          <span>Skill: {(config.skillLevel * 100).toFixed(0)}%</span>
          {config.seedSavingPct > 0 && <span>Seed reserve: {config.seedSavingPct}%</span>}
          <span>Tank: {config.waterCatchment.storageCap.toLocaleString()} gal cap</span>
          <span>Solar: {config.energy.solarArrayWatts} W</span>
          <span>Battery: {config.energy.batteryCapacityAh} Ah</span>
        </div>
      )}

      {/* Focus cards — top scored actions against current system state */}
      <FocusCardDeck
        caloricTotals={caloricTotals}
        waterAutonomy={waterAutonomy}
        energyAutonomy={energyAutonomy}
        inventory={inventory}
        actuals={actuals}
        forecastDays={forecastDays}
      />

      {/* Three clocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Clock 1 — Days of Food */}
        <ClockDisplay
          title="Days of Food"
          systemId="CALORIC_SEC_v1"
          icon={Utensils}
          iconColor="text-green-400"
          days={caloricTotals?.daysOfFood ?? null}
          details={foodDetails}
          trend={foodTrend}
          projectedLabel={projectedLabel}
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
          title="Days of Water"
          systemId="HYDRO_SEC_v1"
          icon={Droplets}
          iconColor="text-blue-400"
          days={waterAutonomy?.daysOfWater ?? null}
          details={waterDetails}
          confidence={waterAutonomy?.confidence}
          warning={irrigationWarning}
        >
          {actuals.storedGallons === 0 && (
            <div className="text-[9px] font-mono uppercase opacity-40 text-center py-2">
              Enter stored gallons via Update Actuals
            </div>
          )}
        </ClockDisplay>

        {/* Clock 3 — Days of Energy */}
        <ClockDisplay
          title="Days of Energy"
          systemId="ENERGY_SEC_v1"
          icon={Zap}
          iconColor="text-yellow-400"
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
              Battery % set via Update Actuals
            </div>
          )}
        </ClockDisplay>
      </div>

      {/* Canning Day banner — shows when solar surplus is significant */}
      <CanningDayBanner energyAutonomy={energyAutonomy} decliningFreshItems={decliningFreshItems} />

      {/* Decay alerts — stored items entering or in decline phase */}
      <DecayAlerts inventory={inventory} />

      {/* Gated feature nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/tools/caloric-security/roi" className="group border border-border-primary/20 hover:border-accent/50 px-4 py-3 flex items-center gap-3 transition-colors">
          <TrendingUp size={14} className="opacity-40 group-hover:opacity-80 transition-opacity" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase font-bold group-hover:text-accent transition-colors">Caloric ROI Report</div>
            <div className="text-[9px] font-mono uppercase opacity-30">kcal per sq ft ranking // free</div>
          </div>
          <span className="text-[9px] font-mono opacity-30 group-hover:opacity-60">→</span>
        </Link>
        <Link href="/tools/caloric-security/companions" className="group border border-border-primary/20 hover:border-accent/50 px-4 py-3 flex items-center gap-3 transition-colors">
          <Leaf size={14} className="opacity-40 group-hover:opacity-80 transition-opacity" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase font-bold group-hover:text-accent transition-colors">Companion Planting</div>
            <div className="text-[9px] font-mono uppercase opacity-30">antagonist alerts + suggestions // free</div>
          </div>
          <span className="text-[9px] font-mono opacity-30 group-hover:opacity-60">→</span>
        </Link>
      </div>

      {/* Inventory summary */}
      {caloricTotals && caloricTotals.cropBreakdown.length > 0 && (
        <BrutalistBlock refTag="INVENTORY_MANIFEST" className="overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h4" className="text-xs uppercase tracking-widest font-mono opacity-60 mb-0 flex items-center gap-2">
              <LayoutDashboard size={12} /> Food Inventory
            </Typography>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogHarvest(true)}
                className="flex items-center gap-1 text-[9px] font-mono uppercase border border-accent/40 text-accent/70 hover:text-accent hover:border-accent px-2 py-1 transition-colors"
              >
                <Plus size={9} /> Log Harvest
              </button>
              <Button href="/tools/caloric-security/inventory" variant="ghost" size="sm">
                Manage →
              </Button>
            </div>
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
          <span className="text-[8px] uppercase tracking-[0.4em]">Clocks update on inventory change</span>
        </div>
        <span className="text-[8px] uppercase tracking-widest text-center">
          Data stored locally // IndexedDB // No server sync
        </span>
      </div>

      {/* Log Harvest modal */}
      {showLogHarvest && (
        <LogHarvestModal onClose={() => setShowLogHarvest(false)} />
      )}
    </div>
  );
}
