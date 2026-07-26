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
  gddBase?: number;
  gddBiofix?: string;
  gddEvent?: string;
  source?: string;
  thresholdNote?: string;
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

  it('marks pests whose model needs an observed biofix as not alertable', () => {
    // Colorado potato beetle is not continuous: it has a real emergence event.
    // But its published model counts 120-200 GDD base 52 from the first adult
    // you actually see, and a calendar accumulation cannot supply that
    // observation. Firing it from Jan 1 would be inventing a date.
    for (const [cropId, pest] of allPests) {
      if (pest.name !== 'colorado-beetle') continue;
      expect(pest.alertable, `${cropId}:${pest.name}`).toBe(false);
      expect(pest.notAlertableReason).toMatch(/biofix/i);
      expect(pest.gddThreshold, 'must not carry a calendar-frame threshold').toBeUndefined();
    }
  });

  it('never leaves a threshold in place without a source', () => {
    // hornworm carried an unsourced 150, which is also cabbageworm's
    // first-flight figure, suggesting it was copied across.
    for (const [cropId, pest] of allPests) {
      if (pest.gddThreshold !== undefined) continue;
      if (pest.alertable === false) continue;
      // No threshold and still alertable means soil-temp only, which hestia
      // labels as lower confidence. That is fine, but say so.
      expect(
        pest.thresholdNote !== undefined || pest.companions !== undefined,
        `${cropId}:${pest.name} silently falls back to soil temp`
      ).toBe(true);
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
    // Was recorded as a known inconsistency: cabbage:cabbage-worm carried 100
    // while broccoli and kale carried none. Sourced 2026-07-26 to 150 on all
    // three, so this is now a hard equality.
    const byName = new Map<string, Set<number | undefined>>();
    for (const [, pest] of allPests) {
      if (!byName.has(pest.name)) byName.set(pest.name, new Set());
      byName.get(pest.name)!.add(pest.gddThreshold);
    }
    const inconsistent = [...byName.entries()]
      .filter(([, vals]) => vals.size > 1)
      .map(([name]) => name);
    expect(inconsistent, 'same pest carries different thresholds on different crops').toEqual([]);
  });

  it('states the frame and a source for every threshold it publishes', () => {
    // A threshold without its base and biofix is unreproducible, and mixing
    // frames is exactly what made the whole table unusable. 900 GDD means
    // nothing until you know it is base 50 accumulated from Jan 1.
    for (const [cropId, pest] of allPests) {
      if (pest.gddThreshold === undefined) continue;
      const where = `${cropId}:${pest.name}`;
      expect(pest.gddBase, `${where} needs gddBase`).toBe(50);
      expect(pest.gddBiofix, `${where} needs gddBiofix`).toBe('jan-1');
      expect(pest.source, `${where} needs a citable source`).toMatch(/^https?:\/\//);
    }
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
