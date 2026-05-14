// ============================================================
// scoreActions
//
// Pure scoring functions for the action library.
//
// Core formula (per schema spec):
//   score = bottleneck_weight × impact_delta × window_decay × (1 / effort_minutes)
//
// Maintenance/periodic actions (impact.delta = 0) get a flat
// score of 0.3 — they surface by recurrence, not urgency.
// ============================================================

import type {
  Action, SystemState, ScoredAction, PriorityTier,
  PreconditionOp, DismissalOption,
} from './actionTypes';

// re-export DismissalOption so callers only need one import
export type { DismissalOption };

// ── Dot-path field resolver ─────────────────────────────────
function getField(state: SystemState, path: string): number | string | boolean | null {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = state;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[p];
  }
  if (cur === undefined) return null;
  return cur as number | string | boolean;
}

// ── Precondition operator evaluator ────────────────────────
function evalOp(
  actual: number | string | boolean | null,
  op:     PreconditionOp,
  value:  number | string | string[],
): boolean {
  if (actual === null || actual === undefined) return false;

  const n = typeof actual === 'number' ? actual : parseFloat(String(actual));
  const v = typeof value  === 'number' ? value  : parseFloat(String(value));

  switch (op) {
    case 'lt':     return n < v;
    case 'lte':    return n <= v;
    case 'gt':     return n > v;
    case 'gte':    return n >= v;
    case 'eq':     return String(actual) === String(value);
    case 'neq':    return String(actual) !== String(value);
    case 'in':     return Array.isArray(value) && value.includes(String(actual));
    case 'not_in': return Array.isArray(value) && !value.includes(String(actual));
    default:       return false;
  }
}

const CONFIDENCE_MULT: Record<string, number> = {
  high: 1.0, medium: 0.7, low: 0.4, guess: 0.2,
};

// ── Window validity check ───────────────────────────────────
function isInWindow(action: Action, state: SystemState, now: Date): boolean {
  const w = action.window;
  if (!w) return true;

  // Hour gate
  if (w.hours) {
    const h = now.getHours();
    if (h < w.hours[0] || h > w.hours[1]) return false;
  }

  // Month gate — zone_adjusted not implemented for MVP; use raw month
  if (w.months && w.months.length > 0) {
    const m = now.getMonth() + 1;  // 1-indexed
    if (!w.months.includes(m)) return false;
  }

  // Solar gate: "surplus_above_Xpct"
  if (w.solar_gate) {
    const match = w.solar_gate.match(/surplus_above_(\d+)pct/);
    if (match) {
      const threshold = parseInt(match[1], 10);
      if (state.energy.surplus_pct < threshold) return false;
    }
  }

  return true;
}

// ── Why template interpolation ──────────────────────────────
function interpolateWhy(template: string, state: SystemState, action: Action): string {
  const ctx: Record<string, string> = {
    'food.days':                    state.food.days_of_supply.toFixed(1),
    'food.days_after':              (state.food.days_of_supply + action.impact.delta).toFixed(1),
    'energy.surplus_pct':           Math.round(state.energy.surplus_pct).toString(),
    'energy.battery_pct':           Math.round(state.energy.battery_pct).toString(),
    'energy.forecast_solar':        Math.round(state.energy.forecast_solar).toString(),
    'energy.daily_draw':            Math.round(state.energy.daily_draw).toString(),
    'water.daily_total':            state.water.daily_total.toFixed(1),
    'water.daily_household':        state.water.daily_household.toFixed(1),
    'water.unexplained_draw':       state.water.unexplained_draw.toFixed(1),
    'water.days':                   state.water.days_of_supply.toFixed(1),
    'weather.dry_days_ahead':       state.weather.dry_days_ahead.toString(),
    'weather.precip_14d':           state.weather.precip_forecast_14d.toFixed(2),
    'calendar.days_to_last_frost':  state.calendar.days_to_last_frost != null
                                       ? state.calendar.days_to_last_frost.toString()
                                       : '—',
    'calendar.seedling_deadline':   state.calendar.seedling_deadline_days?.toString() ?? '—',
    'inventory.upcoming_harvests':  state.inventory.upcoming_harvests.toString(),
    'inventory.critical_decay':     state.inventory.critical_decay_items.toString(),
    'inventory.food_to_dehydrate':  state.inventory.food_to_dehydrate.toString(),
  };

  return template.replace(/\{([^}]+)\}/g, (_, key: string) => ctx[key.trim()] ?? `{${key}}`);
}

// ── Main per-action scorer ──────────────────────────────────
export function scoreAction(
  action:    Action,
  state:     SystemState,
  dismissed: Record<string, { until: string; reason: string }>,
  now:       Date = new Date(),
): ScoredAction | null {
  // Dismissed check
  const d = dismissed[action.id];
  if (d && new Date(d.until) > now) return null;

  // Window check
  if (!isInWindow(action, state, now)) return null;

  // Precondition check — all hard gates (weight >= 1.0) must pass
  for (const pre of action.preconditions) {
    const actual = getField(state, pre.field);
    const weight = pre.weight ?? 1.0;
    if (weight >= 1.0 && !evalOp(actual, pre.op, pre.value)) return null;
  }

  // ── Flat score for maintenance/preventive actions (delta = 0) ──
  if (action.impact.delta === 0) {
    return {
      action,
      score: 0.3,
      tier:  'opportunity',
      interpolatedWhy: interpolateWhy(action.why_template, state, action),
    };
  }

  // ── Bottleneck weight: min(30 / days, 5.0) ─────────────────
  let bottleneckDays: number;
  const resource = action.impact.resource;
  if      (resource === 'food')   bottleneckDays = state.food.days_of_supply;
  else if (resource === 'water')  bottleneckDays = state.water.days_of_supply;
  else                            bottleneckDays = state.energy.days_of_supply;

  const bottleneckWeight = Math.min(30 / Math.max(bottleneckDays, 0.1), 5.0);

  // ── Impact delta with confidence weighting ─────────────────
  const confidenceMult = CONFIDENCE_MULT[action.impact.confidence ?? 'medium'] ?? 0.7;
  const impactDelta    = Math.abs(action.impact.delta) * confidenceMult;

  // ── Window decay ───────────────────────────────────────────
  // For seasonal actions (months set + frost deadline known), decay increases
  // as the planting window closes. For all others, 1.0.
  let windowDecay = 1.0;
  if (action.window?.months && action.window.months.length > 0) {
    const deadline = state.calendar.seedling_deadline_days;
    if (deadline != null && deadline > 0) {
      const windowLength = 28;  // ~4-week active window
      windowDecay = 0.3 + 0.7 * (1 - Math.min(deadline / windowLength, 1));
    } else if (deadline != null && deadline <= 0) {
      windowDecay = 1.0;  // deadline passed or imminent — maximum urgency
    }
  }

  const effortMinutes = action.effort?.minutes ?? 30;
  const score = bottleneckWeight * impactDelta * windowDecay * (1 / effortMinutes);

  let tier: PriorityTier;
  if      (score > 4.0)  tier = 'urgent';
  else if (score > 1.5)  tier = 'this_week';
  else if (score > 0.5)  tier = 'on_track';
  else                   tier = 'opportunity';

  return {
    action,
    score,
    tier,
    interpolatedWhy: interpolateWhy(action.why_template, state, action),
  };
}

// ── Top-N with effort budget ────────────────────────────────
export function getTopActions(
  actions:           Action[],
  state:             SystemState,
  dismissed:         Record<string, { until: string; reason: string }>,
  maxCount           = 4,
  effortCapMinutes   = 240,
  now:               Date = new Date(),
): ScoredAction[] {
  const scored = actions
    .map(a  => scoreAction(a, state, dismissed, now))
    .filter((s): s is ScoredAction => s !== null)
    .sort((a, b) => b.score - a.score);

  const result: ScoredAction[] = [];
  let totalEffort = 0;

  for (const s of scored) {
    if (result.length >= maxCount) break;
    const effort    = s.action.effort?.minutes ?? 30;
    const intensity = s.action.effort?.intensity ?? 'light';
    // Passive tasks never count against the budget
    if (intensity === 'passive' || totalEffort + effort <= effortCapMinutes) {
      result.push(s);
      if (intensity !== 'passive') totalEffort += effort;
    }
  }

  return result;
}
