'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDB } from '@/lib/caloric-security/db';
import { buildSystemState } from '@/lib/caloric-security/systemState';
import { getTopActions } from '@/lib/caloric-security/scoreActions';
import { getAllActions } from '@/lib/caloric-security/actionLoader';
import FocusCard from './FocusCard';
import type { Actuals } from './ActualsInput';
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

  if (topCards.length === 0) return null;

  return (
    <div className="space-y-2 print:hidden">
      <p className="text-[9px] font-mono uppercase tracking-widest opacity-30">
        Today&apos;s Focus
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {topCards.map(s => (
          <FocusCard key={s.action.id} scored={s} onDismiss={handleDismiss} />
        ))}
      </div>
    </div>
  );
}
