'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Users, Maximize2, Target, Sprout, Ban, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle,
} from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
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
              active ? 'border-accent text-accent bg-accent/10'
              : done ? 'border-foreground-primary/60 text-foreground-primary/60'
              : 'border-foreground-primary/20 text-foreground-primary/20'
            }`}>
              <Icon size={10} />
              <span className="hidden md:inline">{step.label}</span>
              <span className="md:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-2 h-0.5 ${done ? 'bg-foreground-primary/60' : 'bg-foreground-primary/20'}`} />
            )}
          </div>
        );
      })}
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
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Where_Are_You</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Determines your zone, frost dates, growing window</p>
      </div>

      <div>
        <label className="block text-xs font-mono font-bold uppercase tracking-widest mb-2 text-foreground-primary/70">
          ZIP Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={state.zipCode}
            onChange={e => set('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 04401"
            className="flex-1 bg-black/30 border-2 border-foreground-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleLookup}
            disabled={state.zipCode.length !== 5 || frostLoading}
          >
            {frostLoading ? '...' : 'Look_up'}
          </Button>
        </div>
        {frostError && (
          <div className="mt-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/40 text-yellow-200 text-[10px] font-mono uppercase">
            {frostError}
          </div>
        )}
      </div>

      {state.zoneDetected && (
        <div className="px-3 py-3 bg-accent/5 border-2 border-accent/40">
          <p className="text-[10px] font-mono opacity-60 uppercase">Detected</p>
          <p className="text-lg font-mono font-bold text-accent">Zone {state.zoneDetected}</p>
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

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Who_Eats</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Daily calorie target = household size × 2000 kcal</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-foreground-primary/70">Adults</label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('adults', Math.max(1, state.adults - 1))} className="w-9 h-9 border-2 border-foreground-primary flex items-center justify-center font-bold hover:border-accent hover:text-accent">−</button>
            <span className="text-2xl font-mono font-bold w-10 text-center">{state.adults}</span>
            <button onClick={() => set('adults', Math.min(12, state.adults + 1))} className="w-9 h-9 border-2 border-foreground-primary flex items-center justify-center font-bold hover:border-accent hover:text-accent">+</button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-foreground-primary/70">Kids</label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('kids', Math.max(0, state.kids - 1))} className="w-9 h-9 border-2 border-foreground-primary flex items-center justify-center font-bold hover:border-accent hover:text-accent">−</button>
            <span className="text-2xl font-mono font-bold w-10 text-center">{state.kids}</span>
            <button onClick={() => set('kids', Math.min(12, state.kids + 1))} className="w-9 h-9 border-2 border-foreground-primary flex items-center justify-center font-bold hover:border-accent hover:text-accent">+</button>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-black/20 border border-foreground-primary/20 text-[10px] font-mono uppercase opacity-60">
        Daily target: {(state.adults + state.kids) * 2000} kcal
      </div>

      <div>
        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-3 text-foreground-primary/70">
          Dietary restrictions <span className="opacity-40 normal-case">[optional]</span>
        </label>
        <div className="space-y-2">
          {DIETARY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleDietary(opt.value)}
              className={`w-full text-left px-3 py-2 border-2 ${
                state.dietaryRestrictions.includes(opt.value)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-foreground-primary/30 hover:border-foreground-primary'
              }`}
            >
              <span className="text-xs font-mono font-bold uppercase block">{opt.label}</span>
              <span className="text-[10px] font-mono opacity-50 uppercase">{opt.sub}</span>
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
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Garden_Space</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Total square footage available for food crops</p>
      </div>

      <div>
        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-foreground-primary/70">
          Square feet
        </label>
        <input
          type="number"
          value={state.squareFeet}
          onChange={e => set('squareFeet', Math.max(10, parseInt(e.target.value || '0', 10)))}
          min={10}
          max={5000}
          className="w-full bg-black/30 border-2 border-foreground-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
        />
        <p className="text-[10px] font-mono opacity-30 uppercase mt-1">A 4×8 ft raised bed = 32 sq ft</p>
      </div>

      <div>
        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-foreground-primary/70">Garden type</label>
        <div className="grid grid-cols-2 gap-2">
          {GARDEN_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => set('gardenType', opt.value)}
              className={`px-3 py-2 border-2 text-xs font-mono font-bold uppercase ${
                state.gardenType === opt.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-foreground-primary/30 hover:border-foreground-primary'
              }`}
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
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Primary_Goal</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Drives which crops we surface for your plan</p>
      </div>

      <div className="space-y-2">
        {GOAL_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => set('goal', opt.value)}
            className={`w-full text-left px-3 py-3 border-2 ${
              state.goal === opt.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-foreground-primary/30 hover:border-foreground-primary'
            }`}
          >
            <span className="text-sm font-mono font-bold uppercase block">{opt.label}</span>
            <span className="text-[10px] font-mono opacity-60 uppercase">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExperienceStep({ state, set }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Your_Experience</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Filters crop difficulty + applies skill-level yield modifier</p>
      </div>

      <div className="space-y-2">
        {EXPERIENCE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => set('experience', opt.value)}
            className={`w-full text-left px-3 py-3 border-2 ${
              state.experience === opt.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-foreground-primary/30 hover:border-foreground-primary'
            }`}
          >
            <span className="text-sm font-mono font-bold uppercase block">{opt.label}</span>
            <span className="text-[10px] font-mono opacity-60 uppercase">{opt.sub}</span>
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
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Won&apos;t_Grow</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Skip crops you won&apos;t plant — optional</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {COMMON_CROPS.map(crop => (
          <button
            key={crop.id}
            onClick={() => toggle(crop.id)}
            className={`px-3 py-2 border-2 text-left ${
              state.excludedCropIds.includes(crop.id)
                ? 'border-accent bg-accent/10 text-accent line-through'
                : 'border-foreground-primary/30 hover:border-foreground-primary'
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
      <div>
        <Typography variant="h3" className="uppercase tracking-tight mb-1">Review_Plan</Typography>
        <p className="text-xs font-mono opacity-40 uppercase">Confirm before generating your personalized PDF</p>
      </div>

      <div className="divide-y divide-foreground-primary/20">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center py-2.5">
            <span className="text-xs font-mono uppercase opacity-50">{label}</span>
            <span className="text-xs font-mono font-bold">{value}</span>
          </div>
        ))}
      </div>

      <div className="border-2 border-accent/40 bg-accent/5 px-4 py-3">
        <p className="text-[10px] font-mono uppercase opacity-60 mb-1">One-time purchase</p>
        <p className="text-2xl font-mono font-bold text-accent">$19</p>
        <p className="text-[10px] font-mono uppercase opacity-50 mt-1">PDF download · email backup · re-download for 30 days</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <Button variant="primary" size="lg" onClick={onGenerate} disabled={generating || !state.zoneDetected} className="w-full">
        {generating ? 'Generating...' : 'Generate_My_Plan ($19)'}
      </Button>

      {!state.zoneDetected && (
        <p className="text-[10px] font-mono opacity-50 uppercase text-center">Go back to step 1 and look up your ZIP first</p>
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Typography variant="h2" className="uppercase tracking-tight mb-1">Survival_Garden_Plan</Typography>
          <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
            Personalize // Generate
          </Typography>
        </div>
        <Badge variant="status" pulse>Step_{step + 1}_of_{total}</Badge>
      </div>

      <StepIndicator current={step} />

      <BrutalistBlock refTag={`STEP_${step + 1}_OF_${total}`}>
        {step === 0 && <LocationStep   {...stepProps} />}
        {step === 1 && <HouseholdStep  {...stepProps} />}
        {step === 2 && <SpaceStep      {...stepProps} />}
        {step === 3 && <GoalStep       {...stepProps} />}
        {step === 4 && <ExperienceStep {...stepProps} />}
        {step === 5 && <ExclusionsStep {...stepProps} />}
        {step === 6 && <ReviewStep state={state} generating={generating} error={error} onGenerate={handleGenerate} />}

        {step < 6 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-foreground-primary/20">
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0} className={step === 0 ? 'invisible' : ''}>
              <ChevronLeft size={14} className="mr-1" /> Back
            </Button>
            <Button variant="primary" size="sm" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}

        {step === 6 && (
          <div className="flex items-center justify-start mt-8 pt-6 border-t border-foreground-primary/20">
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={14} className="mr-1" /> Back
            </Button>
          </div>
        )}
      </BrutalistBlock>

      <p className="text-[10px] font-mono opacity-20 uppercase text-center mt-4">
        Wizard state saved locally · No account required
      </p>
    </div>
  );
}
