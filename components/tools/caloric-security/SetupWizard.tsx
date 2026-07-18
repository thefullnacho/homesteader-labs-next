'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import {
  COLLECTION_METHOD_PRESETS,
  estimateCollectionArea,
  buildCatchmentConfig,
} from '@/lib/caloric-security/catchmentConfig';
import { saveConfig } from '@/lib/caloric-security/homesteadStore';
import type { HomesteadConfig, CollectionMethod } from '@/lib/caloric-security/types';

// ============================================================
// SetupWizard — the intake form.
//
// Four short pages: household, water, power, then read it
// back. Saves a HomesteadConfig to IndexedDB and hands off
// to the dashboard.
// ============================================================

interface WizardState {
  // Step 1 — Household
  householdSize:    number;
  skillLevel:       number;
  seedSavingPct:    number;   // 0–30%; % of projected yield reserved for seeds

  // Step 2 — Water
  collectionMethod: CollectionMethod;
  roofLengthFt:     string;
  roofWidthFt:      string;
  manualAreaSqFt:   string;
  useManualArea:    boolean;
  storageCap:       string;

  // Step 3 — Energy
  batteryCapacityAh: string;
  solarArrayWatts:   string;
  baseloadWatts:     string;
}

const INITIAL_STATE: WizardState = {
  householdSize:     2,
  skillLevel:        0.8,
  seedSavingPct:     0,
  collectionMethod:  'rooftop-gutters',
  roofLengthFt:      '',
  roofWidthFt:       '',
  manualAreaSqFt:    '',
  useManualArea:     false,
  storageCap:        '',
  batteryCapacityAh: '',
  solarArrayWatts:   '',
  baseloadWatts:     '',
};

const SKILL_LEVELS = [
  { value: 0.6, label: '1–2 yr',  sub: 'First season or two' },
  { value: 0.8, label: '3–5 yr',  sub: 'A few seasons in' },
  { value: 1.0, label: '5+ yr',   sub: 'You save your own seed' },
];

const STEPS = [
  { id: 'household', label: 'Household' },
  { id: 'water',     label: 'Water' },
  { id: 'energy',    label: 'Power' },
  { id: 'review',    label: 'Read back' },
];

const FIELD_LABEL = 'block font-mono text-[0.68rem] font-bold uppercase tracking-widest text-ink/70 mb-1';
const FIELD_INPUT = 'w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40';
const FIELD_SUB   = 'font-mono text-[0.64rem] uppercase tracking-wide text-ink/50';

// ============================================================
// Sub-components
// ============================================================

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step.id} className="flex items-center">
            <div className={`px-3 py-1.5 border-2 font-mono text-[0.68rem] font-bold uppercase tracking-wider transition-colors ${
              active ? 'border-ink bg-ink text-paper' :
              done   ? 'border-ink text-ink' :
                       'border-ink/30 text-ink/40'
            }`}>
              <span className="hidden sm:inline">{i + 1}. {step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-0.5 ${done ? 'bg-ink' : 'bg-ink/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldInput({
  label, sub, value, onChange, type = 'number', min, max, step, placeholder, unit,
}: {
  label: string; sub?: string; value: string | number;
  onChange: (v: string) => void; type?: string;
  min?: number; max?: number; step?: number; placeholder?: string; unit?: string;
}) {
  return (
    <div>
      <label className={FIELD_LABEL}>
        {label}
        {unit && <span className="ml-2 text-ink/45 normal-case">[{unit}]</span>}
      </label>
      {sub && <p className={`${FIELD_SUB} mb-2`}>{sub}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min} max={max} step={step}
        placeholder={placeholder}
        className={FIELD_INPUT}
      />
    </div>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="border-b-2 border-ink pb-2">
      <h3 className="font-display uppercase text-xl">{title}</h3>
      <p className={`${FIELD_SUB} mt-1`}>{sub}</p>
    </div>
  );
}

// ============================================================
// Steps
// ============================================================

function StepHousehold({ state, set }: { state: WizardState; set: (k: keyof WizardState, v: WizardState[keyof WizardState]) => void }) {
  return (
    <div className="space-y-8">
      <StepTitle title="The household" sub="Sets the daily calorie and water draw" />

      <div>
        <label className={FIELD_LABEL}>Mouths to feed</label>
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => set('householdSize', Math.max(1, state.householdSize - 1))}
            className="w-10 h-10 border-2 border-ink bg-paper font-mono text-lg font-bold hover:bg-kraft transition-colors"
            aria-label="decrease household size"
          >−</button>
          <span className="font-display text-4xl w-12 text-center">{state.householdSize}</span>
          <button
            onClick={() => set('householdSize', Math.min(20, state.householdSize + 1))}
            className="w-10 h-10 border-2 border-ink bg-paper font-mono text-lg font-bold hover:bg-kraft transition-colors"
            aria-label="increase household size"
          >+</button>
        </div>
        <p className={`${FIELD_SUB} mt-2`}>
          Daily draw: {(state.householdSize * 2000).toLocaleString()} kcal · {state.householdSize} gal water
        </p>
      </div>

      <div>
        <label className={`${FIELD_LABEL} mb-2`}>Seasons growing (yield realism)</label>
        <div className="flex gap-2">
          {SKILL_LEVELS.map(s => (
            <button
              key={s.value}
              onClick={() => set('skillLevel', s.value)}
              className={`flex-1 border-2 border-ink px-2 py-2.5 font-mono text-[0.7rem] uppercase tracking-wider transition-colors ${
                state.skillLevel === s.value ? 'bg-ink text-paper' : 'bg-paper hover:bg-kraft'
              }`}
            >
              {s.label} · {(s.value * 100).toFixed(0)}%
            </button>
          ))}
        </div>
        <p className={`${FIELD_SUB} mt-2`}>
          {SKILL_LEVELS.find(s => s.value === state.skillLevel)?.sub}. Applied to planned and
          growing crops only, stored yield is already real.
        </p>
      </div>

      <div>
        <label className={`${FIELD_LABEL} mb-2`}>
          Seed-saving reserve <span className="text-ink/45 normal-case">[optional]</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0} max={30} step={5}
            value={state.seedSavingPct}
            onChange={e => set('seedSavingPct', parseInt(e.target.value))}
            className="flex-1 accent-marker"
          />
          <span className="font-mono text-sm font-bold w-10 text-right tabular-nums">
            {state.seedSavingPct}%
          </span>
        </div>
        <p className={`${FIELD_SUB} mt-2`}>
          Held back from projected yield for next year&apos;s seed.
        </p>
      </div>
    </div>
  );
}

function StepWater({ state, set }: { state: WizardState; set: (k: keyof WizardState, v: WizardState[keyof WizardState]) => void }) {
  const collectionAreaSqFt = state.useManualArea
    ? parseFloat(state.manualAreaSqFt) || 0
    : estimateCollectionArea(
        parseFloat(state.roofLengthFt) || 0,
        parseFloat(state.roofWidthFt) || 0,
      ).sqFt;

  const preset = COLLECTION_METHOD_PRESETS[state.collectionMethod];

  return (
    <div className="space-y-8">
      <StepTitle title="The water" sub="Feeds the days-of-water clock" />

      {/* Method selector */}
      <div>
        <label className={`${FIELD_LABEL} mb-2`}>How you catch it</label>
        <div className="space-y-2">
          {(Object.entries(COLLECTION_METHOD_PRESETS) as [CollectionMethod, typeof preset][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => set('collectionMethod', key)}
              className={`w-full flex items-start gap-4 px-4 py-3 border-2 border-ink text-left transition-colors ${
                state.collectionMethod === key ? 'bg-ink text-paper' : 'bg-paper hover:bg-kraft'
              }`}
            >
              <span className="flex-1">
                <span className="font-mono text-sm font-bold uppercase">{p.label}</span>
                <span className={`block text-[0.78rem] mt-0.5 ${
                  state.collectionMethod === key ? 'text-paper/70' : 'text-ink/60'
                }`}>
                  {p.description}
                </span>
              </span>
              <span className={`font-mono text-[0.7rem] shrink-0 mt-0.5 ${
                state.collectionMethod === key ? 'text-paper/70' : 'text-ink/55'
              }`}>
                {(p.efficiency * 100).toFixed(0)}% eff
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Collection area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`${FIELD_LABEL} mb-0`}>Collection area</label>
          <button
            onClick={() => set('useManualArea', !state.useManualArea)}
            className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/55 hover:text-marker underline underline-offset-4"
          >
            {state.useManualArea ? 'Use roof dimensions' : 'Enter sq ft directly'}
          </button>
        </div>

        {state.useManualArea ? (
          <FieldInput
            label="Collection area" unit="sq ft"
            value={state.manualAreaSqFt}
            onChange={v => set('manualAreaSqFt', v)}
            placeholder="e.g. 1200"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              label="Roof length" unit="ft"
              value={state.roofLengthFt}
              onChange={v => set('roofLengthFt', v)}
              placeholder="e.g. 40"
            />
            <FieldInput
              label="Roof width" unit="ft"
              value={state.roofWidthFt}
              onChange={v => set('roofWidthFt', v)}
              placeholder="e.g. 30"
            />
          </div>
        )}

        {collectionAreaSqFt > 0 && (
          <p className={`${FIELD_SUB} mt-2`}>
            Counts as {collectionAreaSqFt.toLocaleString()} sq ft
            {!state.useManualArea && ' of footprint. Rain falls vertically.'}
          </p>
        )}
      </div>

      <FieldInput
        label="Storage tank capacity" unit="gallons"
        sub="Everything that holds water: tank, barrels, cistern"
        value={state.storageCap}
        onChange={v => set('storageCap', v)}
        placeholder="e.g. 500"
      />

      {collectionAreaSqFt > 0 && parseFloat(state.storageCap) > 0 && (
        <div className="border-2 border-dotted border-ink/40 px-3 py-2.5">
          <p className={FIELD_SUB}>The math so far:</p>
          <p className="font-mono text-sm font-bold mt-0.5">
            {(collectionAreaSqFt * 0.623 * preset.efficiency - preset.firstFlushGallons).toFixed(0)} gal
            per inch of rain
            <span className="font-normal text-ink/55 ml-2 text-[0.72rem]">
              (after the {preset.firstFlushGallons} gal first flush)
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function StepEnergy({ state, set }: { state: WizardState; set: (k: keyof WizardState, v: WizardState[keyof WizardState]) => void }) {
  const capacityAh  = parseFloat(state.batteryCapacityAh)  || 0;
  const solarWatts  = parseFloat(state.solarArrayWatts)     || 0;
  const baseloadW   = parseFloat(state.baseloadWatts)        || 0;
  // Rough days of energy: 12V system, 50% DoD, plus solar at 5 peak hours
  const storedWh    = capacityAh * 12 * 0.5;
  const solarDailyWh = solarWatts * 5;
  const dailyWh     = baseloadW * 24;
  const daysRough   = dailyWh > 0 ? (storedWh + solarDailyWh) / dailyWh : 0;

  return (
    <div className="space-y-8">
      <StepTitle title="The power" sub="Feeds the days-of-power clock" />

      <FieldInput
        label="Battery bank" unit="Ah"
        sub="Total amp-hours at 12V. Multiply 24V systems by 2, 48V by 4"
        value={state.batteryCapacityAh}
        onChange={v => set('batteryCapacityAh', v)}
        placeholder="e.g. 400"
      />

      <FieldInput
        label="Solar array" unit="watts"
        sub="Combined panel wattage, peak STC rating"
        value={state.solarArrayWatts}
        onChange={v => set('solarArrayWatts', v)}
        placeholder="e.g. 800"
      />

      <FieldInput
        label="Baseload draw" unit="watts"
        sub="What runs all the time: fridge, lights, fans"
        value={state.baseloadWatts}
        onChange={v => set('baseloadWatts', v)}
        placeholder="e.g. 200"
      />

      {dailyWh > 0 && (
        <div className="border-2 border-dotted border-ink/40 px-3 py-2.5">
          <p className={FIELD_SUB}>Back-of-envelope (12V, 50% DoD, 5 peak sun hours):</p>
          <p className="font-mono text-sm font-bold mt-0.5">
            {daysRough.toFixed(1)} days of power
            <span className="font-normal text-ink/55 ml-2 text-[0.72rem]">
              the dashboard sharpens this with the live solar forecast
            </span>
          </p>
        </div>
      )}

      <p className={FIELD_SUB}>
        No solar or battery yet? Leave this page blank. The power clock reads
        &quot;not set&quot; and you can pencil it in later.
      </p>
    </div>
  );
}

function StepReview({ state }: { state: WizardState }) {
  const collectionAreaSqFt = state.useManualArea
    ? parseFloat(state.manualAreaSqFt) || 0
    : estimateCollectionArea(
        parseFloat(state.roofLengthFt) || 0,
        parseFloat(state.roofWidthFt) || 0,
      ).sqFt;

  const rows = [
    ['Mouths to feed',    `${state.householdSize} person${state.householdSize !== 1 ? 's' : ''}`],
    ['Yield realism',     SKILL_LEVELS.find(s => s.value === state.skillLevel)?.label ?? '—'],
    ['Seed reserve',      state.seedSavingPct > 0 ? `${state.seedSavingPct}% held back` : 'None'],
    ['Catchment',         COLLECTION_METHOD_PRESETS[state.collectionMethod].label],
    ['Collection area',   collectionAreaSqFt > 0 ? `${collectionAreaSqFt.toLocaleString()} sq ft` : '—'],
    ['Storage tank',      state.storageCap ? `${parseFloat(state.storageCap).toLocaleString()} gal` : '—'],
    ['Battery bank',      state.batteryCapacityAh ? `${state.batteryCapacityAh} Ah` : 'Not set'],
    ['Solar array',       state.solarArrayWatts ? `${state.solarArrayWatts} W` : 'Not set'],
    ['Baseload draw',     state.baseloadWatts ? `${state.baseloadWatts} W` : 'Not set'],
  ];

  return (
    <div className="space-y-8">
      <StepTitle title="Read it back" sub="Check the entries before the clocks start" />

      <div>
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-baseline gap-3 py-2.5 border-b border-dotted border-ink/40 last:border-b-0">
            <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/60">{label}</span>
            <span className="font-mono text-sm font-bold">{value}</span>
          </div>
        ))}
      </div>

      <p className={FIELD_SUB}>
        The whole form stays on your device (IndexedDB). Nothing goes to a
        server, and every value can be changed later from the dashboard.
      </p>
    </div>
  );
}

// ============================================================
// Main wizard
// ============================================================

interface SetupWizardProps {
  onComplete:     () => void;
  initialConfig?: HomesteadConfig;
}

function stateFromConfig(config: HomesteadConfig): WizardState {
  return {
    householdSize:     config.householdSize,
    skillLevel:        config.skillLevel,
    seedSavingPct:     config.seedSavingPct ?? 0,
    collectionMethod:  config.waterCatchment.collectionMethod,
    roofLengthFt:      '',
    roofWidthFt:       '',
    manualAreaSqFt:    config.waterCatchment.collectionAreaSqFt.toString(),
    useManualArea:     true,
    storageCap:        config.waterCatchment.storageCap.toString(),
    batteryCapacityAh: config.energy.batteryCapacityAh > 0 ? config.energy.batteryCapacityAh.toString() : '',
    solarArrayWatts:   config.energy.solarArrayWatts   > 0 ? config.energy.solarArrayWatts.toString()   : '',
    baseloadWatts:     config.energy.baseloadWatts     > 0 ? config.energy.baseloadWatts.toString()     : '',
  };
}

export default function SetupWizard({ onComplete, initialConfig }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(
    initialConfig ? stateFromConfig(initialConfig) : INITIAL_STATE,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState(prev => ({ ...prev, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === 1) {
      const area = state.useManualArea
        ? parseFloat(state.manualAreaSqFt)
        : (parseFloat(state.roofLengthFt) || 0) * (parseFloat(state.roofWidthFt) || 0);
      return area > 0 && parseFloat(state.storageCap) > 0;
    }
    return true; // steps 0, 2, 3 have no hard requirements
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const collectionAreaSqFt = state.useManualArea
        ? parseFloat(state.manualAreaSqFt) || 0
        : estimateCollectionArea(
            parseFloat(state.roofLengthFt) || 0,
            parseFloat(state.roofWidthFt) || 0,
          ).sqFt;

      const config: HomesteadConfig = {
        householdSize:  state.householdSize,
        skillLevel:     state.skillLevel,
        seedSavingPct:  state.seedSavingPct,
        waterCatchment: buildCatchmentConfig(
          state.collectionMethod,
          collectionAreaSqFt,
          parseFloat(state.storageCap) || 0,
        ),
        energy: {
          batteryCapacityAh: parseFloat(state.batteryCapacityAh) || 0,
          solarArrayWatts:   parseFloat(state.solarArrayWatts)   || 0,
          baseloadWatts:     parseFloat(state.baseloadWatts)     || 0,
        },
      };

      await saveConfig(config);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error saving config.');
    } finally {
      setSaving(false);
    }
  }

  const stepProps = { state, set };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="font-display uppercase text-2xl">
          {initialConfig ? 'Recalibrate the clocks' : 'The intake form'}
        </h2>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/55 mt-1">
          {initialConfig
            ? 'Change what the homestead looks like on paper'
            : 'Four short pages, then the clocks start'}
        </p>
      </div>

      <StepIndicator current={step} />

      <div className="card-paper grain p-6">
        <div className="relative z-[2]">
          {step === 0 && <StepHousehold {...stepProps} />}
          {step === 1 && <StepWater     {...stepProps} />}
          {step === 2 && <StepEnergy    {...stepProps} />}
          {step === 3 && <StepReview    state={state} />}

          {error && (
            <div className="mt-6 flex items-center gap-3 px-3 py-2 border-2 border-rust text-rust font-mono text-[0.72rem]">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-ink">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className={`flex items-center gap-1 px-4 py-2.5 border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-ink/5 transition-colors ${
                step === 0 ? 'invisible' : ''
              }`}
            >
              <ChevronLeft size={14} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-1 px-4 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-50 disabled:hover:bg-ink disabled:hover:border-ink"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60"
              >
                {saving ? 'Filing it...' : initialConfig ? 'Save the changes' : 'Start the clocks'}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/45 text-center mt-4">
        Stays on your device · no account
      </p>
    </div>
  );
}
