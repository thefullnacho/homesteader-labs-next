'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Users, Maximize2, Target, Sprout, Ban, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useFieldStation } from '@/app/context/FieldStationContext';
import { decodeInputs } from '@/lib/survivalPlan/inputEncoding';
import type {
  DietaryRestriction,
  ExperienceLevel,
  GardenType,
  PlanGoal,
  SurvivalPlanInput,
} from '@/lib/survivalPlan/types';

const STORAGE_KEY = 'survival-garden-plan-draft';

const STEPS = [
  { id: 'location',    label: 'Location',    icon: MapPin },
  { id: 'household',   label: 'Household',   icon: Users },
  { id: 'space',       label: 'Space',       icon: Maximize2 },
  { id: 'goal',        label: 'Goal',        icon: Target },
  { id: 'experience',  label: 'Experience',  icon: Sprout },
  { id: 'exclusions',  label: 'Exclusions',  icon: Ban },
  { id: 'review',      label: 'Review',      icon: CheckCircle },
];

/* Paper-system form primitives */
const inputCls =
  'bg-paper border-2 border-ink px-3 py-2 font-mono text-sm focus:border-marker focus:outline-none transition-colors';
const primaryBtn =
  'bg-ink text-paper border-2 border-ink px-5 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker disabled:opacity-40 transition-colors';
const secondaryBtn =
  'inline-flex items-center border-2 border-ink bg-paper px-4 py-2 font-mono text-[0.72rem] uppercase tracking-wider hover:bg-kraft disabled:opacity-40 transition-colors';
const optionBtn = (selected: boolean) =>
  `border-2 transition-colors ${
    selected
      ? 'border-marker bg-kraft/60'
      : 'border-ink/30 bg-paper hover:border-ink hover:bg-kraft/40'
  }`;

interface WizardState extends SurvivalPlanInput {
  zoneDetected: string | null;
}

const INITIAL_STATE: WizardState = {
  zipCode: '',
  adults: 2,
  kids: 0,
  dietaryRestrictions: [],
  squareFeet: 200,
  gardenType: 'in-ground',
  goal: 'max-calories',
  experience: 'intermediate',
  excludedCropIds: [],
  zoneDetected: null,
};

const GOAL_OPTIONS: Array<{ value: PlanGoal; label: string; sub: string }> = [
  { value: 'max-calories', label: 'Max Calories',    sub: 'Pure caloric yield per sq ft' },
  { value: 'balanced',     label: 'Balanced',        sub: 'Calories + nutrition + storage' },
  { value: 'preservation', label: 'Preservation',    sub: 'Storage crops for winter pantry' },
  { value: 'fresh',        label: 'Fresh Eating',    sub: 'Quick-maturing seasonal variety' },
];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceLevel; label: string; sub: string }> = [
  { value: 'beginner',     label: 'Beginner',     sub: 'First season or two' },
  { value: 'intermediate', label: 'Intermediate', sub: '3-5 years growing' },
  { value: 'advanced',     label: 'Advanced',     sub: 'Includes perennials and finicky crops' },
];

const GARDEN_TYPE_OPTIONS: Array<{ value: GardenType; label: string }> = [
  { value: 'in-ground',  label: 'In-ground' },
  { value: 'raised',     label: 'Raised beds' },
  { value: 'containers', label: 'Containers' },
  { value: 'mixed',      label: 'Mixed' },
];

const DIETARY_OPTIONS: Array<{ value: DietaryRestriction; label: string; sub: string }> = [
  { value: 'no-nightshades', label: 'No nightshades', sub: 'Excludes tomato, pepper, potato, eggplant' },
  { value: 'no-alliums',     label: 'No alliums',     sub: 'Excludes onion, garlic, leek' },
  { value: 'no-brassicas',   label: 'No brassicas',   sub: 'Excludes broccoli, cabbage, kale, radish' },
  { value: 'no-legumes',     label: 'No legumes',     sub: 'Excludes beans and peas' },
];

const COMMON_CROPS = [
  { id: 'tomato', name: 'Tomatoes' },
  { id: 'pepper-bell', name: 'Bell peppers' },
  { id: 'potato', name: 'Potatoes' },
  { id: 'corn', name: 'Corn' },
  { id: 'squash-winter', name: 'Winter squash' },
  { id: 'cabbage', name: 'Cabbage' },
  { id: 'kale', name: 'Kale' },
  { id: 'carrot', name: 'Carrots' },
  { id: 'onion', name: 'Onions' },
  { id: 'garlic', name: 'Garlic' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <div className={`flex items-center gap-1.5 px-2 py-1 border-2 text-[10px] font-mono font-bold uppercase ${
              active ? 'border-marker text-marker bg-kraft'
              : done ? 'border-ink/60 text-ink/60'
              : 'border-ink/20 text-ink/30'
            }`}>
              <Icon size={10} />
              <span className="hidden md:inline">{step.label}</span>
              <span className="md:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-2 h-0.5 ${done ? 'bg-ink/60' : 'bg-ink/20'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="font-display uppercase text-2xl tracking-tight mb-1">{title}</h2>
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/50">{sub}</p>
    </div>
  );
}

interface StepProps {
  state: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

function LocationStep({ state, set }: StepProps) {
  const { lookupFrostDates, frostLoading, frostError } = useFieldStation();

  async function handleLookup() {
    if (!/^\d{5}/.test(state.zipCode)) return;
    const result = await lookupFrostDates(state.zipCode);
    if (result?.growingZone) set('zoneDetected', result.growingZone);
  }

  return (
    <div className="space-y-6">
      <StepHeading title="Where are you" sub="Determines your zone, frost dates, growing window" />

      <div>
        <label className="block font-mono text-[0.72rem] font-bold uppercase tracking-wider mb-2 text-ink/70">
          ZIP Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={state.zipCode}
            onChange={e => set('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 04401"
            className={`flex-1 ${inputCls}`}
          />
          <button
            onClick={handleLookup}
            disabled={state.zipCode.length !== 5 || frostLoading}
            className={primaryBtn}
          >
            {frostLoading ? '…' : 'Look up'}
          </button>
        </div>
        {frostError && (
          <div className="mt-2 px-3 py-2 border-2 border-rust/50 bg-rust/10 text-rust font-mono text-[0.68rem] uppercase">
            {frostError}
          </div>
        )}
      </div>

      {state.zoneDetected && (
        <div className="px-4 py-3 border-2 border-ink bg-kraft">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55">Detected</p>
          <p className="font-display uppercase text-xl text-moss">Zone {state.zoneDetected}</p>
        </div>
      )}
    </div>
  );
}

function HouseholdStep({ state, set }: StepProps) {
  function toggleDietary(value: DietaryRestriction) {
    const next = state.dietaryRestrictions.includes(value)
      ? state.dietaryRestrictions.filter(d => d !== value)
      : [...state.dietaryRestrictions, value];
    set('dietaryRestrictions', next);
  }

  const stepperBtn =
    'w-9 h-9 border-2 border-ink bg-paper flex items-center justify-center font-bold hover:bg-kraft transition-colors';

  return (
    <div className="space-y-6">
      <StepHeading title="Who eats" sub="Daily calorie target = household size × 2000 kcal" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-[0.68rem] font-bold uppercase tracking-wider mb-2 text-ink/70">Adults</label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('adults', Math.max(1, state.adults - 1))} className={stepperBtn}>−</button>
            <span className="text-2xl font-display w-10 text-center tabular-nums">{state.adults}</span>
            <button onClick={() => set('adults', Math.min(12, state.adults + 1))} className={stepperBtn}>+</button>
          </div>
        </div>

        <div>
          <label className="block font-mono text-[0.68rem] font-bold uppercase tracking-wider mb-2 text-ink/70">Kids</label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('kids', Math.max(0, state.kids - 1))} className={stepperBtn}>−</button>
            <span className="text-2xl font-display w-10 text-center tabular-nums">{state.kids}</span>
            <button onClick={() => set('kids', Math.min(12, state.kids + 1))} className={stepperBtn}>+</button>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-kraft/60 border border-ink/20 font-mono text-[0.68rem] uppercase tracking-wider text-ink/60">
        Daily target: {(state.adults + state.kids) * 2000} kcal
      </div>

      <div>
        <label className="block font-mono text-[0.68rem] font-bold uppercase tracking-wider mb-3 text-ink/70">
          Dietary restrictions <span className="text-ink/40 normal-case">[optional]</span>
        </label>
        <div className="space-y-2">
          {DIETARY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleDietary(opt.value)}
              className={`w-full text-left px-3 py-2 ${optionBtn(state.dietaryRestrictions.includes(opt.value))}`}
            >
              <span className="text-xs font-mono font-bold uppercase block">{opt.label}</span>
              <span className="text-[10px] font-mono text-ink/50 uppercase">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpaceStep({ state, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeading title="Garden space" sub="Total square footage available for food crops" />

      <div>
        <label className="block font-mono text-[0.68rem] font-bold uppercase tracking-wider mb-2 text-ink/70">
          Square feet
        </label>
        <input
          type="number"
          value={state.squareFeet}
          onChange={e => set('squareFeet', Math.max(10, parseInt(e.target.value || '0', 10)))}
          min={10}
          max={5000}
          className={`w-full ${inputCls}`}
        />
        <p className="font-mono text-[0.64rem] text-ink/40 uppercase mt-1">A 4×8 ft raised bed = 32 sq ft</p>
      </div>

      <div>
        <label className="block font-mono text-[0.68rem] font-bold uppercase tracking-wider mb-2 text-ink/70">Garden type</label>
        <div className="grid grid-cols-2 gap-2">
          {GARDEN_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => set('gardenType', opt.value)}
              className={`px-3 py-2 text-xs font-mono font-bold uppercase ${optionBtn(state.gardenType === opt.value)}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalStep({ state, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeading title="Primary goal" sub="Drives which crops we surface for your plan" />

      <div className="space-y-2">
        {GOAL_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => set('goal', opt.value)}
            className={`w-full text-left px-3 py-3 ${optionBtn(state.goal === opt.value)}`}
          >
            <span className="text-sm font-mono font-bold uppercase block">{opt.label}</span>
            <span className="text-[10px] font-mono text-ink/60 uppercase">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExperienceStep({ state, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeading title="Your experience" sub="Filters crop difficulty + applies skill-level yield modifier" />

      <div className="space-y-2">
        {EXPERIENCE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => set('experience', opt.value)}
            className={`w-full text-left px-3 py-3 ${optionBtn(state.experience === opt.value)}`}
          >
            <span className="text-sm font-mono font-bold uppercase block">{opt.label}</span>
            <span className="text-[10px] font-mono text-ink/60 uppercase">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExclusionsStep({ state, set }: StepProps) {
  function toggle(id: string) {
    const next = state.excludedCropIds.includes(id)
      ? state.excludedCropIds.filter(x => x !== id)
      : [...state.excludedCropIds, id];
    set('excludedCropIds', next);
  }

  return (
    <div className="space-y-6">
      <StepHeading title="Won't grow" sub="Skip crops you won't plant (optional)" />

      <div className="grid grid-cols-2 gap-2">
        {COMMON_CROPS.map(crop => (
          <button
            key={crop.id}
            onClick={() => toggle(crop.id)}
            className={`px-3 py-2 text-left ${optionBtn(state.excludedCropIds.includes(crop.id))} ${
              state.excludedCropIds.includes(crop.id) ? 'line-through' : ''
            }`}
          >
            <span className="text-xs font-mono font-bold uppercase">{crop.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewStep({ state, generating, error, onGenerate }: { state: WizardState; generating: boolean; error: string | null; onGenerate: () => void }) {
  const rows = [
    ['ZIP / Zone',           `${state.zipCode} / ${state.zoneDetected ?? '—'}`],
    ['Household',            `${state.adults} adult${state.adults !== 1 ? 's' : ''}${state.kids > 0 ? `, ${state.kids} kid${state.kids !== 1 ? 's' : ''}` : ''}`],
    ['Dietary',              state.dietaryRestrictions.length > 0 ? state.dietaryRestrictions.join(', ') : 'none'],
    ['Space',                `${state.squareFeet} sq ft / ${state.gardenType}`],
    ['Goal',                 state.goal.replace('-', ' ')],
    ['Experience',           state.experience],
    ['Exclusions',           state.excludedCropIds.length > 0 ? `${state.excludedCropIds.length} excluded` : 'none'],
  ];

  return (
    <div className="space-y-6">
      <StepHeading title="Review plan" sub="Confirm before generating your personalized PDF" />

      <div>
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center py-2.5 border-b border-dotted border-ink/40 last:border-b-0">
            <span className="font-mono text-[0.72rem] uppercase tracking-wider text-ink/55">{label}</span>
            <span className="text-xs font-mono font-bold">{value}</span>
          </div>
        ))}
      </div>

      <div className="border-2 border-ink bg-kraft px-4 py-3">
        <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 mb-1">One-time purchase</p>
        <p className="font-display text-3xl">$19</p>
        <p className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/50 mt-1">PDF download · email backup · re-download for 30 days</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border-2 border-rust/50 bg-rust/10 text-rust font-mono text-[0.72rem]">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <button onClick={onGenerate} disabled={generating || !state.zoneDetected} className={`w-full ${primaryBtn}`}>
        {generating ? 'Generating…' : 'Generate my plan ($19)'}
      </button>

      {!state.zoneDetected && (
        <p className="font-mono text-[0.64rem] text-ink/50 uppercase text-center">Go back to step 1 and look up your ZIP first</p>
      )}
    </div>
  );
}

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('p');
    if (urlToken) {
      const decoded = decodeInputs(urlToken);
      if (decoded) {
        setState({ ...decoded, zoneDetected: null });
        setStep(6);
        setHydrated(true);
        return;
      }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { step: number; state: WizardState };
        if (parsed.state) setState(parsed.state);
        if (typeof parsed.step === 'number') setStep(parsed.step);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, state })); } catch { /* ignore */ }
  }, [step, state, hydrated]);

  const set = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  function canAdvance(): boolean {
    if (step === 0) return Boolean(state.zoneDetected) && state.zipCode.length === 5;
    if (step === 2) return state.squareFeet >= 10;
    return true;
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const input: SurvivalPlanInput = {
        zipCode: state.zipCode,
        adults: state.adults,
        kids: state.kids,
        dietaryRestrictions: state.dietaryRestrictions,
        squareFeet: state.squareFeet,
        gardenType: state.gardenType,
        goal: state.goal,
        experience: state.experience,
        excludedCropIds: state.excludedCropIds,
      };
      const res = await fetch('/api/survival-garden-plan/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Checkout unavailable');
      }
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.pdfUrl) {
        window.location.href = data.pdfUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout');
    } finally {
      setGenerating(false);
    }
  }

  const stepProps = { state, set };
  const total = STEPS.length;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display uppercase text-3xl tracking-tight mb-1">Survival Garden Plan</h1>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/50">
            Intake worksheet
          </p>
        </div>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] bg-kraft border border-ink/40 px-2 py-1 shrink-0">
          Step {step + 1} of {total}
        </span>
      </div>

      <StepIndicator current={step} />

      <div className="card-paper grain p-6">
        <div className="relative z-[2]">
          {step === 0 && <LocationStep   {...stepProps} />}
          {step === 1 && <HouseholdStep  {...stepProps} />}
          {step === 2 && <SpaceStep      {...stepProps} />}
          {step === 3 && <GoalStep       {...stepProps} />}
          {step === 4 && <ExperienceStep {...stepProps} />}
          {step === 5 && <ExclusionsStep {...stepProps} />}
          {step === 6 && <ReviewStep state={state} generating={generating} error={error} onGenerate={handleGenerate} />}

          {step < 6 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-ink/20">
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className={`${secondaryBtn} ${step === 0 ? 'invisible' : ''}`}>
                <ChevronLeft size={14} className="mr-1" /> Back
              </button>
              <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} className={primaryBtn}>
                Next <ChevronRight size={14} className="ml-1 inline" />
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="flex items-center justify-start mt-8 pt-6 border-t border-ink/20">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>
                <ChevronLeft size={14} className="mr-1" /> Back
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="font-mono text-[0.64rem] text-ink/40 uppercase text-center mt-4">
        Wizard state saved locally · No account required
      </p>
    </div>
  );
}
