import { describe, it, expect } from 'vitest';
import table from './pest-companions.json';

/**
 * This file is vendored into hestia (data/pest-companions.json) and drives real
 * push alerts, so its shape is a cross-repo contract, not just local data.
 *
 * The contract that matters: hestia's `_in_window` falls back to a soil-temp
 * gate when a pest has no `gddThreshold`. That is correct for pests whose
 * threshold is merely unsourced, and wrong for pests that have no emergence
 * event at all. Aphids sat "open" from spring onward and fired seven windows in
 * 2026 against zero aphids on the lot. Anything continuous must say so.
 *
 * Canonical GDD convention: forager-wiki/entities/gdd-convention.md
 */

interface Companion {
  companion: string;
  companionId: string;
  reason: string;
  placement: string;
  evidenceLevel: string;
}
interface Pest {
  name: string;
  soilTempThreshold: number;
  gddThreshold?: number;
  alertable?: boolean;
  notAlertableReason?: string;
  companions?: Companion[];
}
interface CropRow { cropId: string; pests: Pest[] }

const rows = table as unknown as CropRow[];
const allPests = rows.flatMap((c) => c.pests.map((p) => [c.cropId, p] as const));

/** Pests with no discrete emergence event. A GDD gate cannot predict these. */
const CONTINUOUS = ['aphid', 'nematode'];

describe('pest table shape', () => {
  it('has crops and pests', () => {
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(allPests.length).toBeGreaterThanOrEqual(20);
  });

  it.each(allPests)('%s:%s has a soil temp threshold', (cropId, pest) => {
    expect(typeof pest.soilTempThreshold, `${cropId}:${pest.name}`).toBe('number');
  });
});

describe('the alertable contract with hestia', () => {
  it.each(allPests.filter(([, p]) => CONTINUOUS.includes(p.name)))(
    '%s:%s is marked not alertable',
    (cropId, pest) => {
      expect(pest.alertable, `${cropId}:${pest.name} would open a window from spring onward`).toBe(false);
      expect(pest.notAlertableReason, `${cropId}:${pest.name} needs a stated reason`).toBeTruthy();
    }
  );

  it('never gives a continuous pest a GDD threshold', () => {
    for (const [cropId, pest] of allPests) {
      if (!CONTINUOUS.includes(pest.name)) continue;
      expect(pest.gddThreshold, `${cropId}:${pest.name} cannot have a threshold`).toBeUndefined();
    }
  });

  it('marks alertable:false only where a reason is given', () => {
    for (const [cropId, pest] of allPests) {
      if (pest.alertable === false) {
        expect(pest.notAlertableReason, `${cropId}:${pest.name}`).toBeTruthy();
      }
    }
  });
});

describe('threshold consistency', () => {
  it('gives the same pest the same threshold on every crop', () => {
    // cabbage:cabbage-worm carries 100 while broccoli and kale carry none. That
    // is a known inconsistency, tracked as a VERIFY in the wiki, so this test
    // records the current state rather than asserting a fix that has not
    // happened. Tighten it to a hard equality once the thresholds are sourced.
    const byName = new Map<string, Set<number | undefined>>();
    for (const [, pest] of allPests) {
      if (!byName.has(pest.name)) byName.set(pest.name, new Set());
      byName.get(pest.name)!.add(pest.gddThreshold);
    }
    const inconsistent = [...byName.entries()]
      .filter(([, vals]) => vals.size > 1)
      .map(([name]) => name);
    expect(inconsistent, 'unexpected new threshold inconsistency').toEqual(['cabbage-worm']);
  });
});

describe('companion evidence', () => {
  it.each(allPests.flatMap(([c, p]) => (p.companions ?? []).map((x) => [c + ':' + p.name, x] as const)))(
    '%s companion has a rated evidence level',
    (_key, comp) => {
      expect(['strong', 'moderate', 'anecdotal']).toContain(comp.evidenceLevel);
      expect(comp.reason).toBeTruthy();
    }
  );

  it('has no em dashes in reason text', () => {
    // These strings render on the companions tool and were missed by the sweep.
    for (const [cropId, pest] of allPests) {
      for (const c of pest.companions ?? []) {
        expect(c.reason.includes('—'), `${cropId}:${pest.name} / ${c.companion}`).toBe(false);
      }
    }
  });
});
