'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SectionHead, Stamp } from '@/components/field/kit';
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
import { getDailyCalorieTarget } from '@/lib/caloric-security/yieldCalculations';
import type { Actuals } from '@/lib/caloric-security/types';
import type { ForecastDay } from '@/lib/weatherTypes';

// ============================================================
// AutonomyDashboard — the three resilience clocks, on paper.
//
//   1. Days of Food   — caloricTotals.daysOfFood
//   2. Days of Water  — waterAutonomy.daysOfWater
//   3. Days of Power  — energyAutonomy.daysOfEnergy
//
// Working surface: everything sits flat. The one handwritten
// note is computed from the weakest clock; the one tilted
// aside carries no data.
// ============================================================

interface AutonomyDashboardProps {
  forecastDays?: ForecastDay[];
  onReconfigure: () => void;
  onEditConfig:  () => void;
}

/* a clock earns HOLDS only with real slack: more than a week past the shortest */
const THIN_WINDOW = 7;
const REACH_DAYS  = 60;

type ClockState = 'short' | 'thin' | 'slack';

function outDate(days: number) {
  const d = new Date(Date.now() + days * 86_400_000);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function clockDays(days: number | null): string {
  if (days === null) return '—';
  if (days >= 999) return '999+';
  return Math.floor(days).toString();
}

/* Dotted fill-in-the-blank reading */
function Reading({
  label, value, unit, onCommit, max,
}: {
  label: string;
  value: number;
  unit: string;
  onCommit: (n: number) => void;
  max?: number;
}) {
  const [draft, setDraft] = useState(value.toString());
  const editing = useRef(false);
  useEffect(() => {
    if (!editing.current) setDraft(value.toString());
  }, [value]);

  function commit(raw: string) {
    editing.current = false;
    let n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) n = 0;
    if (max !== undefined) n = Math.min(max, n);
    setDraft(n.toString());
    onCommit(n);
  }

  return (
    <label className="flex items-center justify-between gap-3 py-2.5 border-b border-dotted border-ink/40">
      <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/60">{label}</span>
      <span className="flex items-baseline gap-1">
        <input
          value={draft}
          inputMode="decimal"
          onFocus={() => { editing.current = true; }}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className="w-16 bg-transparent border-b-2 border-dotted border-ink/60 font-mono font-bold text-lg text-center focus:outline-none focus:border-marker"
        />
        <span className="font-mono text-[0.65rem] text-ink/50">{unit}</span>
      </span>
    </label>
  );
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

  const dailyKcal = config ? getDailyCalorieTarget(config.householdSize) : 0;

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

  // ── Harvest contribution + food clock trend ─────────────
  const harvestContribution = config
    ? estimateHarvestContribution(inventory, config)
    : null;

  const currentFoodDays = caloricTotals?.daysOfFood ?? 0;

  const foodTrend: 'up' | 'down' | 'stable' = (() => {
    if (!config || currentFoodDays <= 0) return 'stable';
    const projected7 = projectFoodDays(inventory, config, 7);
    const delta = projected7 - currentFoodDays;
    if (delta < -0.05 * currentFoodDays) return 'down';
    if (delta >  0.05 * currentFoodDays) return 'up';
    return 'stable';
  })();

  const harvestNote = harvestContribution
    && harvestContribution.foodDays > 0
    && harvestContribution.nearestHarvestDays !== null
    ? `Nearest harvest lands in ~${harvestContribution.nearestHarvestDays} days and adds ${Math.round(harvestContribution.foodDays)} more.`
    : null;

  // ── The three clocks ────────────────────────────────────
  const clocks: {
    name: string;
    days: number | null;
    breakdown: string;
    note: string;
    sustaining?: boolean;   // solar covers the draw — the clock isn't counting down
  }[] = [
    {
      name: 'Food',
      days: caloricTotals ? caloricTotals.daysOfFood : null,
      breakdown: caloricTotals
        ? `${Math.round(caloricTotals.totalKcal).toLocaleString()} kcal on hand ÷ ${dailyKcal.toLocaleString()} kcal/day`
        : 'No inventory counted yet',
      note: harvestNote
        ?? (foodTrend === 'down'
          ? 'Trending down over the next week as stored food decays.'
          : 'Pantry plus planted crops. Only what is committed counts.'),
    },
    {
      name: 'Water',
      days: waterAutonomy ? waterAutonomy.daysOfWater : null,
      breakdown: waterAutonomy
        ? `${actuals.storedGallons} gal stored + ${waterAutonomy.projectedInflowGallons.toFixed(0)} gal forecast ÷ ${waterAutonomy.dailyTotalNeed} gal/day`
        : `${actuals.storedGallons} gal stored`,
      note: waterAutonomy && !waterAutonomy.irrigationTracked
        ? 'Irrigation is not on this clock. Log a daily draw in the field readings to count it.'
        : 'Drinking and household water. The forecast inflow is probability-weighted.',
    },
    {
      name: 'Power',
      days: energyAutonomy ? energyAutonomy.daysOfEnergy : null,
      sustaining: energyAutonomy?.solarCoversBaseload ?? false,
      breakdown: energyAutonomy
        ? `${energyAutonomy.storedUsableWh.toFixed(0)} Wh usable of the ${energyAutonomy.batteryCapWh.toFixed(0)} Wh bank ÷ ${energyAutonomy.dailyDrawWh.toFixed(0)} Wh/day draw`
        : 'No energy system configured',
      note: energyAutonomy?.solarCoversBaseload
        ? 'The panels out-produce the draw, so the clock only counts down when the weather turns. Usable is half the bank, the safe discharge floor for lead-acid.'
        : energyAutonomy && energyAutonomy.averageDailySolarWh > 0
          ? 'Forecast solar is below the baseload, so the battery is depleting. Usable is half the bank, the safe discharge floor for lead-acid.'
          : 'Battery only, counted at half the bank (safe discharge). Wire in a forecast by adding a location above.',
    },
  ];

  const liveDays = clocks.filter(c => c.days !== null).map(c => c.days as number);
  const minDays  = liveDays.length > 0 ? Math.min(...liveDays) : null;
  const weakest  = minDays !== null ? clocks.find(c => c.days === minDays)! : null;
  const stateOf  = (d: number | null): ClockState | null => {
    if (d === null || minDays === null) return null;
    if (d === minDays) return 'short';
    return d - minDays <= THIN_WINDOW ? 'thin' : 'slack';
  };

  // ── Pantry ledger rows ──────────────────────────────────
  const ledgerRows = caloricTotals?.cropBreakdown ?? [];
  const shownRows  = ledgerRows.slice(0, 8);

  if (isLoading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.3em] text-ink/50 animate-pulse">
          Opening the ledger...
        </p>
      </section>
    );
  }

  return (
    <>
      {/* ── Alerts ──────────────────────────────────────────── */}
      {(forecastDays.length > 0 || waterAutonomy) && (
        <div className="max-w-6xl mx-auto px-4 pt-8 space-y-3 empty:hidden">
          <FrostGuardAlert forecastDays={forecastDays} activeCropNames={activeCropNames} />
          <DroughtAlert waterAutonomy={waterAutonomy} activeCropCount={activeCropNames.length} />
        </div>
      )}

      {/* ── §1 The three clocks ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-12">
        <SectionHead
          no="§1"
          title="The Three Clocks"
          right={`as of today · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {clocks.map(c => {
            const st = stateOf(c.days);
            return (
              <div
                key={c.name}
                className="card-paper grain p-5 relative"
                style={st === 'short' ? { outline: '3px solid #e4571f' } : undefined}
              >
                <div className="flex items-center justify-between border-b-2 border-ink pb-2 relative z-[2]">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/60">
                    Days of {c.name}
                  </span>
                  {st === 'short' ? (
                    <Stamp color="text-marker">First to go</Stamp>
                  ) : st === 'thin' ? (
                    <Stamp color="text-rust" rotate="1.4deg">Thin</Stamp>
                  ) : st === 'slack' ? (
                    <Stamp color="text-moss" rotate="1.4deg">Holds</Stamp>
                  ) : (
                    <Stamp color="text-slateblue">Not set</Stamp>
                  )}
                </div>
                <div className="flex items-baseline gap-3 mt-4 relative z-[2]">
                  <span
                    className={`font-display text-6xl leading-none ${
                      st === 'short' ? 'text-marker' : st === 'thin' ? 'text-rust' : ''
                    }`}
                  >
                    {c.sustaining ? '60+' : clockDays(c.days)}
                  </span>
                  <span className="font-mono text-[0.72rem] uppercase tracking-wider text-ink/60">
                    {c.sustaining
                      ? 'days · sun-fed, no run-out on the sheet'
                      : c.days !== null
                        ? `days · runs out ${outDate(c.days)}`
                        : 'days'}
                  </span>
                </div>
                {/* 60-day reach bar */}
                <div className="mt-4 relative z-[2]">
                  <div className="h-5 border-2 border-ink bg-paper relative">
                    {c.days !== null && (
                      <div
                        className={`absolute inset-y-0 left-0 ${
                          st === 'short' ? 'bg-marker/70' : st === 'thin' ? 'bg-rust/50' : 'bg-moss/60'
                        }`}
                        style={{ width: `${Math.min(100, ((c.days) / REACH_DAYS) * 100)}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between font-mono text-[0.6rem] uppercase tracking-wide text-ink/50 mt-1">
                    <span>today</span><span>+30 d</span><span>+60 d</span>
                  </div>
                </div>
                <p className="mt-3 pt-3 border-t border-dotted border-ink/40 font-mono text-[0.7rem] uppercase tracking-wide text-ink/65 relative z-[2]">
                  {c.breakdown}
                </p>
                <p className="mt-1.5 text-[0.88rem] text-ink/75 leading-snug relative z-[2]">{c.note}</p>
              </div>
            );
          })}
        </div>
        {/* the one handwritten note allowed on a working page */}
        {weakest && minDays !== null && !weakest.sustaining && (
          <p className="font-hand font-semibold text-marker text-2xl mt-6 -rotate-1">
            ✎ {weakest.name.toLowerCase()} runs dry first, {outDate(minDays)}. that&apos;s your
            next project, not the garden.
          </p>
        )}
      </section>

      {/* ── §2 Field readings + pantry ledger ───────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-16 grid lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
        {/* field readings — input panel: flat, square, no props */}
        <div className="card-paper grain p-6">
          <div className="border-b-2 border-ink pb-2 mb-3 flex items-center justify-between relative z-[2]">
            <h3 className="font-display uppercase text-lg">Field readings</h3>
            <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">fill in the blanks</span>
          </div>
          <div className="relative z-[2]">
            <Reading
              label="Drinking water stored"
              value={actuals.storedGallons}
              unit="gal"
              onCommit={n => setActuals(a => ({ ...a, storedGallons: n }))}
            />
            <Reading
              label="Irrigation draw"
              value={actuals.irrigationDailyGallons}
              unit="gal/d"
              onCommit={n => setActuals(a => ({ ...a, irrigationDailyGallons: n }))}
            />
            <Reading
              label="Battery state of charge"
              value={actuals.currentBatteryPct}
              unit="%"
              max={100}
              onCommit={n => setActuals(a => ({ ...a, currentBatteryPct: n }))}
            />
            {config && (
              <p className="mt-3 text-[0.85rem] text-ink/70 leading-snug">
                Daily draw: <strong className="font-bold">{dailyKcal.toLocaleString()} kcal</strong>
                {waterAutonomy ? (
                  <>
                    {' '}· <strong className="font-bold">{waterAutonomy.dailyTotalNeed} gal</strong>
                  </>
                ) : null}
                {energyAutonomy ? (
                  <>
                    {' '}· <strong className="font-bold">{energyAutonomy.dailyDrawWh.toFixed(0)} Wh</strong>
                  </>
                ) : null}
                . Clocks recalculate as you change the blanks.
              </p>
            )}
          </div>

          {/* the profile on file */}
          {config && (
            <div className="mt-5 pt-4 border-t-2 border-ink relative z-[2]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
                  The profile on file
                </span>
                <span className="flex gap-3">
                  <button
                    onClick={onEditConfig}
                    className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/60 hover:text-marker underline underline-offset-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleReset}
                    className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/40 hover:text-rust underline underline-offset-4"
                  >
                    Start over
                  </button>
                </span>
              </div>
              <p className="font-mono text-[0.7rem] uppercase tracking-wide text-ink/65 leading-relaxed">
                {config.householdSize} to feed · yield realism {(config.skillLevel * 100).toFixed(0)}%
                {config.seedSavingPct > 0 ? ` · ${config.seedSavingPct}% held for seed` : ''}
                {' '}· tank {config.waterCatchment.storageCap.toLocaleString()} gal
                {' '}· {config.energy.solarArrayWatts} W solar · {config.energy.batteryCapacityAh} Ah bank
              </p>
            </div>
          )}
        </div>

        {/* pantry ledger */}
        <div className="card-paper grain overflow-hidden">
          <div className="border-b-2 border-ink px-4 py-2.5 flex items-center justify-between bg-manila relative z-[2]">
            <h3 className="font-display uppercase text-lg">The pantry ledger</h3>
            <span className="flex items-center gap-3">
              <button
                onClick={() => setShowLogHarvest(true)}
                className="font-mono text-[0.64rem] uppercase tracking-wider border-2 border-ink bg-paper px-2 py-1 hover:bg-kraft transition-colors"
              >
                + Log harvest
              </button>
              <Link
                href="/tools/caloric-security/inventory/"
                className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/60 hover:text-marker underline underline-offset-4"
              >
                Manage
              </Link>
            </span>
          </div>
          {shownRows.length === 0 ? (
            <div className="px-6 py-10 text-center relative z-[2]">
              <p className="font-display uppercase text-lg mb-2">Nothing on the shelf yet</p>
              <p className="text-ink/70 text-[0.95rem] max-w-sm mx-auto">
                Log a harvest, add stored food in{' '}
                <Link href="/tools/caloric-security/inventory/" className="underline underline-offset-4 hover:text-marker">
                  the inventory
                </Link>
                , or push planted crops over from the{' '}
                <Link href="/tools/planting-calendar/" className="underline underline-offset-4 hover:text-marker">
                  planting calendar
                </Link>
                . The food clock starts when the first item lands.
              </p>
            </div>
          ) : (
            <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
              <table className="w-full font-mono text-[0.76rem] min-w-[420px]">
                <thead>
                  <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                    <th className="py-1.5 font-semibold">Item</th>
                    <th className="py-1.5 font-semibold text-right">Count</th>
                    <th className="py-1.5 font-semibold text-right">kcal kept</th>
                    <th className="py-1.5 font-semibold text-right">= days</th>
                  </tr>
                </thead>
                <tbody>
                  {shownRows.map(r => (
                    <tr key={r.cropId} className="h-[36px]">
                      <td className="font-semibold">
                        {r.cropName}
                        {r.decayModifier < 1 && (
                          <span className="ml-2 text-[0.62rem] uppercase tracking-wide text-rust">
                            −{Math.round((1 - r.decayModifier) * 100)}% decay
                          </span>
                        )}
                      </td>
                      <td className="text-right">{r.plantCount}</td>
                      <td className="text-right">{Math.round(r.effectiveKcal).toLocaleString()}</td>
                      <td className="text-right text-ink/60">
                        {dailyKcal > 0 ? (r.effectiveKcal / dailyKcal).toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))}
                  {ledgerRows.length > shownRows.length && (
                    <tr className="h-[36px]">
                      <td colSpan={4} className="text-ink/50">
                        + {ledgerRows.length - shownRows.length} more under Manage
                      </td>
                    </tr>
                  )}
                  <tr className="h-[36px] font-bold border-t-2 border-ink">
                    <td>Total counted</td>
                    <td />
                    <td className="text-right">{Math.round(caloricTotals!.totalKcal).toLocaleString()}</td>
                    <td className="text-right text-moss">{Math.floor(caloricTotals!.daysOfFood)} d</td>
                  </tr>
                </tbody>
              </table>
              <p className="py-2 font-mono text-[0.64rem] uppercase tracking-wide text-ink/50">
                Macros on hand: P {(caloricTotals!.totalProteinG / 1000).toFixed(1)} kg
                {' '}· C {(caloricTotals!.totalCarbsG / 1000).toFixed(1)} kg
                {' '}· F {(caloricTotals!.totalFatG / 1000).toFixed(1)} kg
                {caloricTotals!.skippedNonCaloric.length > 0
                  ? ` · ${caloricTotals!.skippedNonCaloric.length} non-caloric item${caloricTotals!.skippedNonCaloric.length !== 1 ? 's' : ''} skipped`
                  : ''}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Preservation + decay notices ────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-3 empty:hidden">
        <CanningDayBanner energyAutonomy={energyAutonomy} decliningFreshItems={decliningFreshItems} />
        <DecayAlerts inventory={inventory} />
      </div>

      {/* ── §2 Shore it up ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-16">
        <SectionHead no="§2" title="Shore It Up" right="scored against your clocks" />
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <FocusCardDeck
            caloricTotals={caloricTotals}
            waterAutonomy={waterAutonomy}
            energyAutonomy={energyAutonomy}
            inventory={inventory}
            actuals={actuals}
            forecastDays={forecastDays}
          />

          {/* the one tilted aside on the page — no data, just the lesson */}
          <div className="border-2 border-ink bg-kraft grain p-5 rotate-slight-r">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2 relative z-[2]">
              If you remember one thing
            </p>
            <p className="font-serif text-lg leading-snug relative z-[2]">
              Resilience is a chain. It breaks at the{' '}
              <span className="hl">shortest clock</span>, not the average of the
              three. A year of food with a week of water is a week of resilience.
            </p>
            <div className="mt-4 flex gap-2 flex-wrap relative z-[2]">
              <Stamp color="text-slateblue">Pairs with the wall chart</Stamp>
              <Stamp color="text-moss" rotate="1.5deg">Recount monthly</Stamp>
            </div>
          </div>
        </div>

        {/* deeper drawers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
          <Link
            href="/tools/caloric-security/roi/"
            className="group border-2 border-ink bg-paper px-5 py-4 flex items-center gap-4 hover:bg-kraft transition-colors"
          >
            <span className="flex-1">
              <span className="block font-display uppercase text-base group-hover:text-marker transition-colors">
                Caloric ROI report
              </span>
              <span className="block font-mono text-[0.64rem] uppercase tracking-widest text-ink/55 mt-0.5">
                kcal per square foot, ranked
              </span>
            </span>
            <span className="font-display text-xl text-ink/40 group-hover:text-marker transition-colors">→</span>
          </Link>
          <Link
            href="/tools/caloric-security/companions/"
            className="group border-2 border-ink bg-paper px-5 py-4 flex items-center gap-4 hover:bg-kraft transition-colors"
          >
            <span className="flex-1">
              <span className="block font-display uppercase text-base group-hover:text-marker transition-colors">
                Companion planting
              </span>
              <span className="block font-mono text-[0.64rem] uppercase tracking-widest text-ink/55 mt-0.5">
                antagonist alerts + suggestions
              </span>
            </span>
            <span className="font-display text-xl text-ink/40 group-hover:text-marker transition-colors">→</span>
          </Link>
        </div>

        <p className="mt-10 pt-5 border-t border-ink/20 text-center font-mono text-[0.64rem] uppercase tracking-[0.2em] text-ink/45">
          Clocks update on inventory change · everything stays in your browser · no server sync
        </p>
      </section>

      {/* Log Harvest modal */}
      {showLogHarvest && (
        <LogHarvestModal onClose={() => setShowLogHarvest(false)} />
      )}
    </>
  );
}
