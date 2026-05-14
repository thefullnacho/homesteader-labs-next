import { describe, it, expect } from 'vitest';
import { scoreAction, getTopActions } from './scoreActions';
import type { Action, SystemState } from './actionTypes';

// ============================================================
// Fixtures
// ============================================================

function makeState(overrides: Partial<SystemState> = {}): SystemState {
  return {
    food:   { days_of_supply: 30 },
    water:  { days_of_supply: 30, daily_total: 10, daily_household: 10, unexplained_draw: 0 },
    energy: { days_of_supply: 30, surplus_pct: 100, battery_pct: 80, forecast_solar: 1000, daily_draw: 500 },
    weather:    { precip_forecast_14d: 1.0, dry_days_ahead: 0 },
    calendar:   { days_to_last_frost: null, seedling_deadline_days: null },
    inventory:  {
      canning_jars: 1, seed_tomato: 1, seed_pepper: 1, seed_squash: 1,
      dehydrator: false, food_to_dehydrate: 0, upcoming_harvests: 0, critical_decay_items: 0,
    },
    maintenance: { filter_last_checked_days: 7 },
    ...overrides,
  };
}

const baseAction: Action = {
  id: 'food:test-action',
  title: 'Test action',
  domain: 'food',
  why_template: 'food: {food.days}d',
  impact: { resource: 'food', metric: 'days_of_supply', delta: 1.0, confidence: 'high' },
  preconditions: [{ field: 'food.days_of_supply', op: 'lt', value: 14 }],
  effort: { minutes: 60, intensity: 'moderate' },
};

const noDismiss: Record<string, { until: string; reason: string }> = {};

// ============================================================
// Preconditions — dot-path resolution & operators
// ============================================================

describe('scoreAction — preconditions', () => {
  it('returns null when a hard precondition fails', () => {
    const state = makeState({ food: { days_of_supply: 30 } });
    expect(scoreAction(baseAction, state, noDismiss)).toBeNull();
  });

  it('passes when precondition is satisfied', () => {
    const state = makeState({ food: { days_of_supply: 5 } });
    expect(scoreAction(baseAction, state, noDismiss)).not.toBeNull();
  });

  it('resolves nested dot-paths', () => {
    const action: Action = {
      ...baseAction,
      preconditions: [{ field: 'inventory.canning_jars', op: 'gt', value: 0 }],
    };
    const passing = makeState({ inventory: { ...makeState().inventory, canning_jars: 3 } });
    const failing = makeState({ inventory: { ...makeState().inventory, canning_jars: 0 } });
    expect(scoreAction(action, passing, noDismiss)).not.toBeNull();
    expect(scoreAction(action, failing, noDismiss)).toBeNull();
  });

  it('returns null when dot-path resolves to a missing field', () => {
    const action: Action = {
      ...baseAction,
      preconditions: [{ field: 'nonsense.path.deep', op: 'gt', value: 0 }],
    };
    expect(scoreAction(action, makeState(), noDismiss)).toBeNull();
  });

  it('soft preconditions (weight < 1.0) do not gate', () => {
    const action: Action = {
      ...baseAction,
      preconditions: [
        { field: 'food.days_of_supply', op: 'lt', value: 14 },
        { field: 'energy.surplus_pct',  op: 'gt', value: 200, weight: 0.5 },
      ],
    };
    // surplus_pct=100 fails the soft condition, but it shouldn't block
    const state = makeState({ food: { days_of_supply: 5 } });
    expect(scoreAction(action, state, noDismiss)).not.toBeNull();
  });

  it.each([
    ['lt',  3, 5, true],  ['lt',  5, 3, false],
    ['lte', 5, 5, true],  ['lte', 6, 5, false],
    ['gt',  6, 5, true],  ['gt',  5, 5, false],
    ['gte', 5, 5, true],  ['gte', 4, 5, false],
    ['eq',  5, 5, true],  ['eq',  4, 5, false],
    ['neq', 4, 5, true],  ['neq', 5, 5, false],
  ] as const)('operator %s with actual=%d value=%d → %s', (op, actual, value, expected) => {
    const action: Action = {
      ...baseAction,
      preconditions: [{ field: 'food.days_of_supply', op, value }],
    };
    const result = scoreAction(action, makeState({ food: { days_of_supply: actual } }), noDismiss);
    expect(result !== null).toBe(expected);
  });
});

// ============================================================
// Dismissal
// ============================================================

describe('scoreAction — dismissal', () => {
  const state = makeState({ food: { days_of_supply: 5 } });

  it('suppresses an action when dismissal is still active', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const dismissed = { 'food:test-action': { until: future, reason: 'skip_today' } };
    expect(scoreAction(baseAction, state, dismissed)).toBeNull();
  });

  it('does NOT suppress when dismissal has expired', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const dismissed = { 'food:test-action': { until: past, reason: 'skip_today' } };
    expect(scoreAction(baseAction, state, dismissed)).not.toBeNull();
  });
});

// ============================================================
// Window gates
// ============================================================

describe('scoreAction — window gates', () => {
  const state = makeState({ food: { days_of_supply: 5 } });

  it('passes when no window is defined', () => {
    expect(scoreAction(baseAction, state, noDismiss)).not.toBeNull();
  });

  it('hour gate blocks outside range', () => {
    const action: Action = {
      ...baseAction,
      window: { hours: [9, 16], months: null, zone_adjusted: false },
    };
    const morning = new Date('2026-05-14T07:00:00');
    const midday  = new Date('2026-05-14T12:00:00');
    expect(scoreAction(action, state, noDismiss, morning)).toBeNull();
    expect(scoreAction(action, state, noDismiss, midday)).not.toBeNull();
  });

  it('month gate blocks outside listed months', () => {
    const action: Action = {
      ...baseAction,
      window: { hours: null, months: [3, 4, 5], zone_adjusted: false },
    };
    const may  = new Date('2026-05-14T12:00:00');
    const dec  = new Date('2026-12-14T12:00:00');
    expect(scoreAction(action, state, noDismiss, may)).not.toBeNull();
    expect(scoreAction(action, state, noDismiss, dec)).toBeNull();
  });

  it('solar_gate blocks when surplus is below threshold', () => {
    const action: Action = {
      ...baseAction,
      window: { hours: null, months: null, zone_adjusted: false, solar_gate: 'surplus_above_150pct' },
    };
    const lowSolar  = makeState({ food: { days_of_supply: 5 }, energy: { ...makeState().energy, surplus_pct: 100 } });
    const highSolar = makeState({ food: { days_of_supply: 5 }, energy: { ...makeState().energy, surplus_pct: 200 } });
    expect(scoreAction(action, lowSolar,  noDismiss)).toBeNull();
    expect(scoreAction(action, highSolar, noDismiss)).not.toBeNull();
  });
});

// ============================================================
// Scoring math
// ============================================================

describe('scoreAction — scoring math', () => {
  it('flat-scores actions with delta=0 as opportunity', () => {
    const action: Action = {
      ...baseAction,
      impact: { resource: 'food', metric: 'days_of_supply', delta: 0 },
    };
    const result = scoreAction(action, makeState({ food: { days_of_supply: 5 } }), noDismiss);
    expect(result?.score).toBe(0.3);
    expect(result?.tier).toBe('opportunity');
  });

  it('bottleneck weight rises sharply as food days drop', () => {
    const lowFood  = scoreAction(baseAction, makeState({ food: { days_of_supply: 3  } }), noDismiss)!;
    const medFood  = scoreAction(baseAction, makeState({ food: { days_of_supply: 10 } }), noDismiss)!;
    expect(lowFood.score).toBeGreaterThan(medFood.score);
  });

  it('clamps bottleneck weight at 5.0 (very low days_of_supply)', () => {
    // delta=1.0 high confidence, no window decay, effort=60 → score = (5.0 * 1.0 * 1.0) / 60 ≈ 0.0833
    const result = scoreAction(baseAction, makeState({ food: { days_of_supply: 0.001 } }), noDismiss)!;
    expect(result.score).toBeCloseTo(5.0 / 60, 4);
  });

  it('applies confidence multiplier (low confidence → lower score)', () => {
    const high: Action = { ...baseAction, impact: { ...baseAction.impact, confidence: 'high'  } };
    const low:  Action = { ...baseAction, impact: { ...baseAction.impact, confidence: 'low'   } };
    const state = makeState({ food: { days_of_supply: 5 } });
    expect(scoreAction(high, state, noDismiss)!.score)
      .toBeGreaterThan(scoreAction(low, state, noDismiss)!.score);
  });

  it('shorter effort produces higher score', () => {
    const slow: Action = { ...baseAction, effort: { minutes: 240 } };
    const fast: Action = { ...baseAction, effort: { minutes: 30  } };
    const state = makeState({ food: { days_of_supply: 5 } });
    expect(scoreAction(fast, state, noDismiss)!.score)
      .toBeGreaterThan(scoreAction(slow, state, noDismiss)!.score);
  });

  it('window decay maxes out as planting deadline closes', () => {
    const action: Action = {
      ...baseAction,
      preconditions: [],  // no gating — isolate window decay
      window: { hours: null, months: [3, 4, 5], zone_adjusted: false },
    };
    const farOut = makeState({
      calendar: { days_to_last_frost: 90, seedling_deadline_days: 48 },
    });
    const now    = new Date('2026-05-14T12:00:00');
    const closer = makeState({
      calendar: { days_to_last_frost: 50, seedling_deadline_days: 8 },
    });
    const farScore  = scoreAction(action, farOut,  noDismiss, now)!.score;
    const nearScore = scoreAction(action, closer, noDismiss, now)!.score;
    expect(nearScore).toBeGreaterThan(farScore);
  });

  it('assigns priority tiers based on score thresholds', () => {
    // Tier boundaries: urgent>4, this_week>1.5, on_track>0.5, otherwise opportunity
    const action: Action = {
      ...baseAction,
      effort: { minutes: 5 },  // small effort → big inverse
      impact: { resource: 'food', metric: 'days_of_supply', delta: 5.0, confidence: 'high' },
    };
    const urgent = scoreAction(action, makeState({ food: { days_of_supply: 3 } }), noDismiss)!;
    expect(urgent.tier).toBe('urgent');
  });
});

// ============================================================
// Why interpolation
// ============================================================

describe('scoreAction — why interpolation', () => {
  it('substitutes known tokens from state', () => {
    const action: Action = {
      ...baseAction,
      why_template: 'food: {food.days}d → after: {food.days_after}d',
    };
    const result = scoreAction(action, makeState({ food: { days_of_supply: 5 } }), noDismiss)!;
    expect(result.interpolatedWhy).toBe('food: 5.0d → after: 6.0d');
  });

  it('leaves unknown tokens intact', () => {
    const action: Action = { ...baseAction, why_template: 'food: {food.days} unknown: {bogus.token}' };
    const result = scoreAction(action, makeState({ food: { days_of_supply: 5 } }), noDismiss)!;
    expect(result.interpolatedWhy).toContain('{bogus.token}');
  });
});

// ============================================================
// getTopActions — sorting, capping, effort budget
// ============================================================

describe('getTopActions', () => {
  function actionWith(overrides: Partial<Action>): Action {
    return { ...baseAction, ...overrides, id: overrides.id ?? `food:${Math.random()}` };
  }

  it('sorts by score descending and caps at maxCount', () => {
    const actions = [
      actionWith({ id: 'a', effort: { minutes: 300 } }),  // low score
      actionWith({ id: 'b', effort: { minutes: 60  } }),  // mid
      actionWith({ id: 'c', effort: { minutes: 10  } }),  // high
    ];
    const result = getTopActions(actions, makeState({ food: { days_of_supply: 5 } }), noDismiss, 2);
    expect(result).toHaveLength(2);
    expect(result[0].action.id).toBe('c');
    expect(result[1].action.id).toBe('b');
  });

  it('respects effort budget when adding non-passive items', () => {
    const actions = [
      actionWith({ id: 'a', effort: { minutes: 200, intensity: 'moderate' } }),
      actionWith({ id: 'b', effort: { minutes: 100, intensity: 'moderate' } }),
      actionWith({ id: 'c', effort: { minutes: 60,  intensity: 'moderate' } }),
    ];
    // total budget 240; first two together = 300 > 240 → second excluded
    const result = getTopActions(actions, makeState({ food: { days_of_supply: 5 } }), noDismiss, 4, 240);
    const minuteSum = result.reduce((s, r) => s + (r.action.effort?.minutes ?? 0), 0);
    expect(minuteSum).toBeLessThanOrEqual(240);
  });

  it('passive actions do not count against the effort budget', () => {
    const actions = [
      actionWith({ id: 'big',     effort: { minutes: 240, intensity: 'moderate' } }),
      actionWith({ id: 'passive', effort: { minutes: 500, intensity: 'passive'  } }),
    ];
    const result = getTopActions(actions, makeState({ food: { days_of_supply: 5 } }), noDismiss, 4, 240);
    expect(result.map(r => r.action.id)).toContain('passive');
  });

  it('excludes actions that fail preconditions or are dismissed', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const actions = [
      actionWith({ id: 'pass'  }),
      actionWith({ id: 'gated', preconditions: [{ field: 'food.days_of_supply', op: 'gt', value: 999 }] }),
      actionWith({ id: 'dismissed' }),
    ];
    const dismissed = { 'dismissed': { until: future, reason: 'skip_today' } };
    const result = getTopActions(actions, makeState({ food: { days_of_supply: 5 } }), dismissed);
    expect(result.map(r => r.action.id)).toEqual(['pass']);
  });
});
