'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDB } from '@/lib/caloric-security/db';
import { buildSystemState } from '@/lib/caloric-security/systemState';
import { getTopActions } from '@/lib/caloric-security/scoreActions';
import { getAllActions } from '@/lib/caloric-security/actionLoader';
import FocusCard from './FocusCard';
import type { Actuals } from '@/lib/caloric-security/types';
import type { CaloricTotals, WaterAutonomyResult, EnergyAutonomyResult, InventoryItem } from '@/lib/caloric-security/types';
import type { ForecastDay } from '@/lib/weatherTypes';
import type { DismissalOption } from '@/lib/caloric-security/actionTypes';

// ============================================================
// FocusCardDeck
//
// Evaluates the action library against current system state
// and surfaces the top 1–4 scored focus cards above the clocks.
//
// Owns dismissal state — persisted to localStorage so cards
// stay dismissed across page refreshes.
//
// Self-contained: loads frost dates from Dexie internally so
// AutonomyDashboard doesn't need to change its data flow.
// ============================================================

const DISMISS_KEY = 'hl_dismissed_actions';

type DismissalStore = Record<string, { until: string; reason: string }>;

function loadDismissals(): DismissalStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveDismissals(store: DismissalStore): void {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(store));
  } catch { /* storage errors are non-fatal */ }
}

interface FocusCardDeckProps {
  caloricTotals:  CaloricTotals       | null;
  waterAutonomy:  WaterAutonomyResult | null;
  energyAutonomy: EnergyAutonomyResult | null;
  inventory:      InventoryItem[];
  actuals:        Actuals;
  forecastDays:   ForecastDay[];
}

export default function FocusCardDeck({
  caloricTotals, waterAutonomy, energyAutonomy,
  inventory, actuals, forecastDays,
}: FocusCardDeckProps) {
  const [dismissed, setDismissed] = useState<DismissalStore>({});

  useEffect(() => {
    setDismissed(loadDismissals());
  }, []);

  // Frost dates needed for calendar preconditions
  const frostDates = useLiveQuery(() => getDB().frostDates.get('singleton')) ?? null;

  const systemState = buildSystemState({
    caloricTotals, waterAutonomy, energyAutonomy,
    inventory, actuals, forecastDays,
    frostDates: frostDates ?? null,
  });

  const allActions = getAllActions();
  const topCards   = getTopActions(allActions, systemState, dismissed);

  function handleDismiss(id: string, option: DismissalOption, cooldownDays: number) {
    const until = new Date();
    until.setDate(until.getDate() + cooldownDays);
    const updated: DismissalStore = { ...dismissed, [id]: { until: until.toISOString(), reason: option } };
    setDismissed(updated);
    saveDismissals(updated);
  }

  if (topCards.length === 0) {
    return (
      <div className="border-2 border-dashed border-ink/40 p-8 text-center print:hidden">
        <p className="font-display uppercase text-lg mb-1">Nothing pressing on the docket</p>
        <p className="text-ink/70 text-[0.95rem] max-w-md mx-auto">
          The scored to-do list fills in as the clocks, forecast, and inventory
          give it something to work with. Dismissed items come back when their
          cooldown runs out.
        </p>
      </div>
    );
  }

  return (
    <div className="card-paper grain p-6 print:hidden">
      <div className="border-b-2 border-ink pb-2 mb-4 flex items-center justify-between relative z-[2]">
        <h3 className="font-display uppercase text-lg">The docket</h3>
        <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
          ordered by what it buys you
        </span>
      </div>
      <div className="space-y-3.5 relative z-[2]">
        {topCards.map(s => (
          <FocusCard key={s.action.id} scored={s} onDismiss={handleDismiss} />
        ))}
      </div>
    </div>
  );
}
