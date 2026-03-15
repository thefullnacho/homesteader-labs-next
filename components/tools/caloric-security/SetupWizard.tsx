'use client';

import { useState } from 'react';
import {
  Users, Droplets, Zap, CheckCircle,
  ChevronRight, ChevronLeft, AlertTriangle,
} from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import {
  COLLECTION_METHOD_PRESETS,
  estimateCollectionArea,
  buildCatchmentConfig,
} from '@/lib/caloric-security/catchmentConfig';
import { saveConfig } from '@/lib/caloric-security/homesteadStore';
import type { HomesteadConfig, CollectionMethod } from '@/lib/caloric-security/types';

// ============================================================
// Types
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
  { value: 0.6, label: 'Novice',       sub: 'First season or two' },
  { value: 0.8, label: 'Intermediate', sub: '3–5 years growing' },
  { value: 1.0, label: 'Expert',       sub: 'Experienced homesteader' },
];

const STEPS = [
  { id: 'household', label: 'Household',  icon: Users },
  { id: 'water',     label: 'Water',      icon: Droplets },
  { id: 'energy',    label: 'Energy',     icon: Zap },
  { id: 'review',    label: 'Confirm',    icon: CheckCircle },
];

// ============================================================
// Sub-components
// ============================================================

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-mono font-bold uppercase transition-all ${
              active  ? 'border-accent text-accent bg-accent/10' :
              done    ? 'border-border-primary/60 text-foreground-primary/60' :
                        'border-border-primary/20 text-foreground-primary/20'
            }`}>
              <Icon size={12} />
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-0.5 ${done ? 'bg-border-primary/60' : 'bg-border-primary/20'}`} />
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
      <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-1 text-foreground-primary/70">
        {label}
        {unit && <span className="ml-2 opacity-40 normal-case">[{unit}]</span>}
      </label>
      {sub && <p className="text-[10px] font-mono opacity-40 uppercase mb-2">{sub}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min} max={max} step={step}
        placeholder={placeholder}
        className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono text-foreground-primary placeholder:opacity-30 transition-colors"
      />
    </div>
  );
}

// ============================================================
// Steps
// ============================================================

function StepHousehold({ state, set }: { state: WizardState; set: (k: keyof WizardState, v: WizardState[keyof WizardState]) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Household_Profile</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Calibrates daily calorie and water targets</p>
      </div>

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-1 text-foreground-primary/70">
          Household Size <span className="opacity-40">[persons]</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => set('householdSize', Math.max(1, state.householdSize - 1))}
            className="w-10 h-10 border-2 border-border-primary flex items-center justify-center text-lg font-bold hover:border-accent hover:text-accent transition-colors"
          >−</button>
          <span className="text-4xl font-mono font-bold w-12 text-center">{state.householdSize}</span>
          <button
            onClick={() => set('householdSize', Math.min(20, state.householdSize + 1))}
            className="w-10 h-10 border-2 border-border-primary flex items-center justify-center text-lg font-bold hover:border-accent hover:text-accent transition-colors"
          >+</button>
        </div>
        <p className="text-[10px] font-mono opacity-30 uppercase mt-2">
          Daily target: {state.householdSize * 2000} kcal · {state.householdSize} gal water
        </p>
      </div>

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-3 text-foreground-primary/70">
          Skill Level
        </label>
        <div className="space-y-2">
          {SKILL_LEVELS.map(s => (
            <button
              key={s.value}
              onClick={() => set('skillLevel', s.value)}
              className={`w-full flex items-center justify-between px-4 py-3 border-2 text-left transition-all ${
                state.skillLevel === s.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-primary/30 hover:border-border-primary'
              }`}
            >
              <div>
                <span className="text-sm font-mono font-bold uppercase">{s.label}</span>
                <span className="block text-[10px] opacity-50 uppercase font-mono">{s.sub}</span>
              </div>
              <span className="text-xs font-mono opacity-60">{(s.value * 100).toFixed(0)}%</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono opacity-30 uppercase mt-2">
          Applied to planned/active crops. Stored yield is already realised.
        </p>
      </div>

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-3 text-foreground-primary/70">
          Seed Saving Reserve <span className="opacity-40 normal-case">[optional]</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0} max={30} step={5}
            value={state.seedSavingPct}
            onChange={e => set('seedSavingPct', parseInt(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="text-sm font-mono font-bold w-10 text-right tabular-nums">
            {state.seedSavingPct}%
          </span>
        </div>
        <p className="text-[10px] font-mono opacity-30 uppercase mt-2">
          Deducted from projected yield — reserved for year-two seed saving.
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
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Water_Catchment</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Powers the Days_of_Water clock</p>
      </div>

      {/* Method selector */}
      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-3 text-foreground-primary/70">
          Collection Method
        </label>
        <div className="space-y-2">
          {(Object.entries(COLLECTION_METHOD_PRESETS) as [CollectionMethod, typeof preset][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => set('collectionMethod', key)}
              className={`w-full flex items-start gap-4 px-4 py-3 border-2 text-left transition-all ${
                state.collectionMethod === key
                  ? 'border-accent bg-accent/10'
                  : 'border-border-primary/30 hover:border-border-primary'
              }`}
            >
              <div className="flex-1">
                <span className={`text-sm font-mono font-bold uppercase ${state.collectionMethod === key ? 'text-accent' : ''}`}>
                  {p.label}
                </span>
                <span className="block text-[10px] opacity-50 font-mono mt-0.5">{p.description}</span>
              </div>
              <span className="text-xs font-mono opacity-60 shrink-0 mt-0.5">{(p.efficiency * 100).toFixed(0)}% eff</span>
            </button>
          ))}
        </div>
      </div>

      {/* Collection area */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-mono font-bold uppercase tracking-widest text-foreground-primary/70">
            Collection Area
          </label>
          <button
            onClick={() => set('useManualArea', !state.useManualArea)}
            className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 hover:text-accent transition-colors"
          >
            {state.useManualArea ? 'Use dimensions instead →' : 'Enter sqft directly →'}
          </button>
        </div>

        {state.useManualArea ? (
          <FieldInput
            label="Collection Area" unit="sq ft"
            value={state.manualAreaSqFt}
            onChange={v => set('manualAreaSqFt', v)}
            placeholder="e.g. 1200"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              label="Roof Length" unit="ft"
              value={state.roofLengthFt}
              onChange={v => set('roofLengthFt', v)}
              placeholder="e.g. 40"
            />
            <FieldInput
              label="Roof Width" unit="ft"
              value={state.roofWidthFt}
              onChange={v => set('roofWidthFt', v)}
              placeholder="e.g. 30"
            />
          </div>
        )}

        {collectionAreaSqFt > 0 && (
          <div className="mt-2 px-3 py-2 bg-black/20 border border-border-primary/20 text-[10px] font-mono opacity-60 uppercase">
            Collection area: {collectionAreaSqFt.toLocaleString()} sq ft
            {!state.useManualArea && ' (footprint — rain falls vertically)'}
          </div>
        )}
      </div>

      <FieldInput
        label="Storage Tank Capacity" unit="gallons"
        sub="Total capacity of your tank, barrel, or cistern"
        value={state.storageCap}
        onChange={v => set('storageCap', v)}
        placeholder="e.g. 500"
      />

      {collectionAreaSqFt > 0 && parseFloat(state.storageCap) > 0 && (
        <div className="px-3 py-2 bg-accent/5 border border-accent/20 text-[10px] font-mono uppercase space-y-1">
          <p className="opacity-60">Estimated per-inch yield:</p>
          <p className="text-accent">
            {(collectionAreaSqFt * 0.623 * preset.efficiency - preset.firstFlushGallons).toFixed(0)} gal/inch rain
            <span className="opacity-40 ml-2">(after {preset.firstFlushGallons} gal first-flush)</span>
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
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Energy_Profile</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Powers the Days_of_Energy clock</p>
      </div>

      <FieldInput
        label="Battery Bank Capacity" unit="Ah"
        sub="Total amp-hours at 12V (multiply 24V systems by 2, 48V by 4)"
        value={state.batteryCapacityAh}
        onChange={v => set('batteryCapacityAh', v)}
        placeholder="e.g. 400"
      />

      <FieldInput
        label="Solar Array" unit="watts"
        sub="Combined panel wattage (peak, STC rating)"
        value={state.solarArrayWatts}
        onChange={v => set('solarArrayWatts', v)}
        placeholder="e.g. 800"
      />

      <FieldInput
        label="Baseload Draw" unit="watts"
        sub="Continuous household power consumption (fridge, lights, fans)"
        value={state.baseloadWatts}
        onChange={v => set('baseloadWatts', v)}
        placeholder="e.g. 200"
      />

      {dailyWh > 0 && (
        <div className="px-3 py-2 bg-accent/5 border border-accent/20 text-[10px] font-mono uppercase space-y-1">
          <p className="opacity-60">Rough estimate (assumes 12V, 50% DoD, 5 peak sun hours):</p>
          <p className="text-accent">{daysRough.toFixed(1)} days of energy autonomy</p>
          <p className="opacity-40">Refined calculation uses live solar forecast in Phase 4.</p>
        </div>
      )}

      <div className="border border-border-primary/20 px-3 py-2">
        <p className="text-[10px] font-mono opacity-30 uppercase leading-relaxed">
          [i] Skip this section if you don&apos;t have solar/battery yet — the energy clock will show as unconfigured and can be set up later.
        </p>
      </div>
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
    ['Household size',    `${state.householdSize} person${state.householdSize !== 1 ? 's' : ''}`],
    ['Skill level',       SKILL_LEVELS.find(s => s.value === state.skillLevel)?.label ?? '—'],
    ['Seed saving',       state.seedSavingPct > 0 ? `${state.seedSavingPct}% reserved` : 'None'],
    ['Collection method', COLLECTION_METHOD_PRESETS[state.collectionMethod].label],
    ['Collection area',   collectionAreaSqFt > 0 ? `${collectionAreaSqFt.toLocaleString()} sq ft` : '—'],
    ['Storage tank',      state.storageCap ? `${parseFloat(state.storageCap).toLocaleString()} gal` : '—'],
    ['Battery bank',      state.batteryCapacityAh ? `${state.batteryCapacityAh} Ah` : 'Not configured'],
    ['Solar array',       state.solarArrayWatts ? `${state.solarArrayWatts} W` : 'Not configured'],
    ['Baseload draw',     state.baseloadWatts ? `${state.baseloadWatts} W` : 'Not configured'],
  ];

  return (
    <div className="space-y-8">
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Review_Config</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Verify before initialising survival clocks</p>
      </div>

      <div className="divide-y divide-border-primary/20">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center py-2.5">
            <span className="text-xs font-mono uppercase opacity-50">{label}</span>
            <span className="text-xs font-mono font-bold">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 px-3 py-3 bg-accent/5 border border-accent/20">
        <CheckCircle size={14} className="text-accent mt-0.5 shrink-0" />
        <p className="text-[10px] font-mono uppercase opacity-70 leading-relaxed">
          Config is saved locally to your device (IndexedDB). Nothing is sent to a server.
          You can update any value later from the dashboard settings.
        </p>
      </div>
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Typography variant="h2" className="uppercase tracking-tight mb-1">
            {initialConfig ? 'Update_Config' : 'Homestead_Setup'}
          </Typography>
          <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
            {initialConfig ? 'Edit // Re-calibrate_Survival_Clocks' : 'First_Run // Initialising_Survival_Clocks'}
          </Typography>
        </div>
        <Badge variant="status" pulse>{initialConfig ? 'Editing' : 'Config_Required'}</Badge>
      </div>

      <StepIndicator current={step} />

      <BrutalistBlock refTag={`STEP_${step + 1}_OF_${STEPS.length}`}>
        {step === 0 && <StepHousehold {...stepProps} />}
        {step === 1 && <StepWater     {...stepProps} />}
        {step === 2 && <StepEnergy    {...stepProps} />}
        {step === 3 && <StepReview    state={state} />}

        {error && (
          <div className="mt-6 flex items-center gap-3 px-3 py-2 border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-mono">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-primary/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className={step === 0 ? 'invisible' : ''}
          >
            <ChevronLeft size={14} className="mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : initialConfig ? 'Save_Changes' : 'Initialise_Clocks'}
            </Button>
          )}
        </div>
      </BrutalistBlock>

      <p className="text-[10px] font-mono opacity-20 uppercase text-center mt-4">
        All data stored locally // No account required
      </p>
    </div>
  );
}
