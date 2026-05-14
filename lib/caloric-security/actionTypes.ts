// ============================================================
// Action Library — Type Definitions
//
// Follows the schema defined in the action library spec.
// Actions are authored in data/actions/*.json and evaluated
// dynamically against live SystemState to produce ScoredActions.
// ============================================================

export type ActionDomain     = 'food' | 'water' | 'energy' | 'maintenance' | 'planning';
export type ImpactResource   = 'food' | 'water' | 'energy';
export type ImpactMetric     = 'days_of_supply' | 'kcal_stored' | 'gallons_stored' | 'wh_stored' | 'daily_draw' | 'daily_inflow';
export type ImpactConfidence = 'high' | 'medium' | 'low' | 'guess';
export type PreconditionOp   = 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq' | 'in' | 'not_in';
export type EffortIntensity  = 'passive' | 'light' | 'moderate' | 'heavy';
export type RecurrenceType   = 'one_shot' | 'periodic' | 'state_triggered';
export type DismissalOption  = 'done' | 'skip_today' | 'already_handled' | 'not_relevant' | 'snooze_days';

export interface Impact {
  resource:          ImpactResource;
  metric:            ImpactMetric;
  delta:             number;
  confidence?:       ImpactConfidence;
  secondary_impacts?: Impact[];
}

export interface Precondition {
  field:   string;                         // dot-path into SystemState
  op:      PreconditionOp;
  value:   number | string | string[];
  weight?: number;                         // 0–1; defaults to 1.0 (hard gate)
}

export interface ActionWindow {
  hours?:        [number, number] | null;  // valid hour range [start, end] 24h
  months?:       number[]        | null;   // valid months 1-12; null = year-round
  zone_adjusted: boolean;                  // if true, months shift by growing zone
  weather_gate?: string          | null;   // e.g. "no_rain", "temp_above_50f"
  solar_gate?:   string          | null;   // e.g. "surplus_above_150pct"
}

export interface Effort {
  minutes:            number;
  intensity?:         EffortIntensity;
  requires_presence?: boolean;
}

export interface Recurrence {
  type:                        RecurrenceType;
  interval_days?:              number;   // for periodic type
  cooldown_after_completion?:  number;   // days to suppress after done
}

export interface Dismissal {
  options:                    DismissalOption[];
  resurface_on_state_change?: boolean;
  state_change_threshold?:    number;    // 0.0–1.0 fraction change that overrides dismissal
}

export interface Action {
  id:            string;           // format: domain:verb-noun
  title:         string;
  domain:        ActionDomain;
  tags?:         string[];
  why_template:  string;           // {key} tokens interpolated from SystemState at render time
  impact:        Impact;
  preconditions: Precondition[];
  window?:       ActionWindow | null;
  effort?:       Effort;
  recurrence?:   Recurrence;
  dismissal?:    Dismissal;
}

// ============================================================
// SystemState — the flat scoring surface built from live data
// Populated by buildSystemState() in systemState.ts
// ============================================================

export interface SystemState {
  food: {
    days_of_supply: number;
  };
  water: {
    days_of_supply:   number;
    daily_total:      number;
    daily_household:  number;
    unexplained_draw: number;
  };
  energy: {
    days_of_supply: number;
    surplus_pct:    number;   // (averageDailySolar / dailyDraw) × 100
    battery_pct:    number;
    forecast_solar: number;   // total projected Wh over forecast window
    daily_draw:     number;   // baseload Wh/day
  };
  weather: {
    precip_forecast_14d: number;   // sum of precipitation inches over 14 days
    dry_days_ahead:      number;   // consecutive days with precip < 0.05 in
  };
  calendar: {
    days_to_last_frost:     number | null;
    seedling_deadline_days: number | null;  // days_to_last_frost - 42 (tomato lead time)
  };
  inventory: {
    canning_jars:         number;
    seed_tomato:          number;
    seed_pepper:          number;
    seed_squash:          number;
    dehydrator:           boolean;
    food_to_dehydrate:    number;   // stored items with 10–50% decay — prime for dehydrating
    upcoming_harvests:    number;   // active items with expectedHarvestDate within 7 days
    critical_decay_items: number;   // stored items with daysRemaining < 7
  };
  maintenance: {
    filter_last_checked_days: number;
  };
}

// ============================================================
// ScoredAction — result of scoreAction()
// ============================================================

export type PriorityTier = 'urgent' | 'this_week' | 'on_track' | 'opportunity';

export interface ScoredAction {
  action:          Action;
  score:           number;
  tier:            PriorityTier;
  interpolatedWhy: string;
}
