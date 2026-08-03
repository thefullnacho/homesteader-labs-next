import { describe, it, expect } from 'vitest';
import {
  STATE_PAGES,
  MATERIAL_SHARE,
  getStatePageData,
  isPageState,
  statesForZone,
  type StatePageData,
} from './statePages';
import { STATE_TABLE, stateByAbbr, stateBySlug } from './stateTable';
import { isPageZone } from './zonePages';
import { hasFrostNormals } from '@/lib/frostNormals';

// Built once. getStatePageData walks every ZIP in the state, and ten states
// rebuilt per assertion is the difference between a fast suite and a slow one.
const PAGES: StatePageData[] = STATE_PAGES.map(getStatePageData);
const byslug = new Map(PAGES.map((p) => [p.slug, p]));

describe('the pilot set', () => {
  it('is the ten states decided 2026-08-01', () => {
    expect(STATE_PAGES).toHaveLength(10);
    expect([...STATE_PAGES].sort()).toEqual([
      'california', 'florida', 'georgia', 'kentucky', 'michigan',
      'new-york', 'north-carolina', 'ohio', 'pennsylvania', 'texas',
    ]);
  });

  it('spans all three shape branches, so the pilot exercises every prose path', () => {
    const branches = new Set(PAGES.map((p) => p.shape.band));
    expect(branches).toEqual(new Set(['narrow', 'broad', 'wide']));
  });

  it('rejects states without a page', () => {
    expect(isPageState('texas')).toBe(true);
    expect(isPageState('wyoming')).toBe(false); // real state, wave 2
    expect(isPageState('hawaii')).toBe(false);  // mostly 11a+, no frost normals
    expect(isPageState('TX')).toBe(false);      // abbreviations 308 to the slug
    expect(isPageState('nonsense')).toBe(false);
  });

  it('throws rather than half-rendering a state with no page', () => {
    expect(() => getStatePageData('wyoming')).toThrow(/STATE_PAGES/);
    expect(() => getStatePageData('nonsense')).toThrow();
  });
});

describe('the state table', () => {
  it('holds fifty states, uniquely keyed', () => {
    expect(STATE_TABLE).toHaveLength(50);
    expect(new Set(STATE_TABLE.map((s) => s.abbr)).size).toBe(50);
    expect(new Set(STATE_TABLE.map((s) => s.slug)).size).toBe(50);
  });

  it('slugs are the lowercased name, per spec §3', () => {
    for (const s of STATE_TABLE) {
      expect(s.slug).toBe(s.name.toLowerCase().replace(/ /g, '-'));
    }
  });

  // Adjacency is hand-authored, which is the shape of the frost-normals bug.
  // Symmetry is the cheapest assertion that catches a typo in either direction.
  it('adjacency is symmetric', () => {
    for (const s of STATE_TABLE) {
      for (const n of s.neighbours) {
        const other = stateByAbbr(n);
        expect(other, `${s.abbr} lists unknown neighbour ${n}`).toBeDefined();
        expect(
          other!.neighbours,
          `${s.abbr} lists ${n}, but ${n} does not list ${s.abbr}`
        ).toContain(s.abbr);
      }
    }
  });

  it('gives every state but the two islands at least one neighbour', () => {
    const isolated = STATE_TABLE.filter((s) => s.neighbours.length === 0);
    expect(isolated.map((s) => s.abbr)).toEqual(['AK', 'HI']);
  });

  it('resolves both ways', () => {
    expect(stateBySlug('north-carolina')?.abbr).toBe('NC');
    expect(stateByAbbr('nc')?.name).toBe('North Carolina');
    expect(stateBySlug('puerto-rico')).toBeUndefined();
  });
});

describe('bands are derived, not asserted', () => {
  it.each(STATE_PAGES)('%s has a material band set', (slug) => {
    const p = byslug.get(slug)!;
    expect(p.zipCount).toBeGreaterThan(500);
    expect(p.bands.length).toBeGreaterThanOrEqual(2);
    expect(p.minorZones.every((z) => !p.bands.some((b) => b.zone === z))).toBe(true);
  });

  it('orders bands coldest first and minor zones with them', () => {
    for (const p of PAGES) {
      const order = p.bands.map((b) => parseInt(b.zone, 10) * 2 + (b.zone.endsWith('b') ? 1 : 0));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
  });

  it('holds every band at or above the 2% threshold and nothing below it', () => {
    for (const p of PAGES) {
      for (const b of p.bands) expect(b.share).toBeGreaterThanOrEqual(MATERIAL_SHARE);
      const material = p.bands.reduce((n, b) => n + b.zipCount, 0);
      expect(material).toBeLessThanOrEqual(p.zipCount);
      // Minor zones are the whole remainder: no ZIP is dropped on the floor.
      expect(p.zipCount - material).toBeLessThan(p.zipCount * MATERIAL_SHARE * p.minorZones.length + 1);
    }
  });

  it('picks the dominant band by share', () => {
    for (const p of PAGES) {
      const max = Math.max(...p.bands.map((b) => b.share));
      expect(p.dominant.share).toBe(max);
    }
  });

  // The pilot was chosen on these numbers. If the vendored tables move under
  // us, the shape branches move with them and the pilot stops spanning three.
  it('matches the band counts the pilot was chosen on', () => {
    const expected: Record<string, number> = {
      texas: 7, california: 5, 'new-york': 7, pennsylvania: 5, florida: 5,
      michigan: 5, ohio: 3, 'north-carolina': 4, georgia: 4, kentucky: 2,
    };
    for (const [slug, n] of Object.entries(expected)) {
      expect(byslug.get(slug)!.bands.length, slug).toBe(n);
    }
  });
});

// Spec §8. These fail the build, they are not a review step. The city plan
// would have failed 1 and 2, which is the whole reason they exist.
describe('§8 the substance gate', () => {
  it('1. no two states share a band table', () => {
    const seen = new Map<string, string>();
    for (const p of PAGES) {
      const fingerprint = p.bands
        .map((b) => `${b.zone}:${Math.round(b.share * 100)}`)
        .join('|');
      const clash = seen.get(fingerprint);
      expect(
        clash,
        `${p.slug} and ${clash} render an identical band table; one should not exist`
      ).toBeUndefined();
      seen.set(fingerprint, p.slug);
    }
  });

  it('2. per-state text share clears 35%', () => {
    // Data-layer measure: the prose and figures this module owns. The full
    // rendered-page version lands with the route in phase 4; this is the floor
    // under it, since a page cannot be more distinct than its data.
    const texts = PAGES.map((p) => {
      const table = p.bands
        .map(
          (b) =>
            `${b.zone} ${Math.round(b.share * 100)}% ${b.frostFreeDays ?? 'frost free'} ` +
            `${b.lastSpringFrost?.toDateString() ?? ''} ${b.firstFallFrost?.toDateString() ?? ''}`
        )
        .join(' ');
      return `${p.name} ${p.shape.headline} ${p.shape.body} ${table} ${p.spreadDays} ${p.minorZones.join(' ')}`
        .toLowerCase()
        .split(/[^a-z0-9%]+/)
        .filter(Boolean);
    });

    const common = texts.reduce<Set<string>>(
      (acc, t) => new Set([...acc].filter((tok) => t.includes(tok))),
      new Set(texts[0])
    );

    PAGES.forEach((p, i) => {
      const t = texts[i];
      const unique = t.filter((tok) => !common.has(tok)).length / t.length;
      expect(unique, `${p.slug} text share ${(unique * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.35);
    });
  });

  it('3. every material band resolves, none is silently dropped', () => {
    for (const p of PAGES) {
      for (const b of p.bands) {
        if (b.hasPage) {
          expect(isPageZone(b.zone)).toBe(true);
          expect(b.lastSpringFrost).toBeInstanceOf(Date);
        } else {
          // The only sanctioned uncovered case: no normals exist, so §5.6
          // renders the frost-free wording instead of a link.
          expect(hasFrostNormals(b.zone), `${p.slug} band ${b.zone}`).toBe(false);
          expect(b.frostFreeDays).toBeNull();
        }
      }
      const linkable = p.bands.filter((b) => b.hasPage);
      expect(p.nowSowing().map((s) => s.band.zone)).toEqual(linkable.map((b) => b.zone));
    }
  });

  it('4. frost-free days never shorten as bands warm', () => {
    // The regression test for §2.3. This is the assertion that would have
    // caught the 4a and 10a normals years ago, had anything rendered them.
    for (const p of PAGES) {
      const seasons = p.bands
        .map((b) => b.frostFreeDays)
        .filter((d): d is number => d !== null);
      for (let i = 1; i < seasons.length; i++) {
        expect(seasons[i], `${p.slug} band ${i}`).toBeGreaterThanOrEqual(seasons[i - 1]);
      }
    }
  });
});

describe('the shape prose', () => {
  it('branches on material band count', () => {
    for (const p of PAGES) {
      const n = p.bands.length;
      const expected = n <= 2 ? 'narrow' : n <= 4 ? 'broad' : 'wide';
      expect(p.shape.band, p.slug).toBe(expected);
    }
  });

  it('puts kentucky alone on the narrow branch', () => {
    // If KY fails the text-share bar, that branch needs rethinking before
    // wave 2 adds the dozen other two-band states.
    const narrow = PAGES.filter((p) => p.shape.band === 'narrow');
    expect(narrow.map((p) => p.slug)).toEqual(['kentucky']);
  });

  it('interpolates real per-state figures, so same-branch states still differ', () => {
    const wide = PAGES.filter((p) => p.shape.band === 'wide');
    expect(wide.length).toBeGreaterThan(1);
    expect(new Set(wide.map((p) => p.shape.body)).size).toBe(wide.length);
    for (const p of PAGES) {
      expect(p.shape.body).toContain(p.name);
      expect(p.shape.body).toContain(String(p.spreadDays));
    }
  });

  it('carries no em dashes', () => {
    for (const p of PAGES) {
      expect(p.shape.headline).not.toContain('—');
      expect(p.shape.body).not.toContain('—');
    }
  });
});

describe('spread and season', () => {
  it('measures spread between the extreme bands that have normals', () => {
    for (const p of PAGES) {
      const withNormals = p.bands.filter((b) => b.lastSpringFrost);
      expect(p.spreadDays).toBeGreaterThan(0);
      expect(p.spreadDays).toBe(
        Math.round(
          Math.abs(
            withNormals[withNormals.length - 1].lastSpringFrost!.getTime() -
              withNormals[0].lastSpringFrost!.getTime()
          ) / 86400000
        )
      );
    }
  });

  it('gives a wide state a wider spread than a narrow one', () => {
    // The thesis of the whole feature. If this inverts, the premise is wrong.
    expect(byslug.get('texas')!.spreadDays).toBeGreaterThan(byslug.get('kentucky')!.spreadDays);
    expect(byslug.get('kentucky')!.spreadDays).toBeLessThan(30);
  });

  it('reports a season range that brackets every band', () => {
    for (const p of PAGES) {
      const [lo, hi] = p.seasonRange;
      expect(lo).toBeLessThanOrEqual(hi);
      for (const b of p.bands) {
        if (b.frostFreeDays === null) continue;
        expect(b.frostFreeDays).toBeGreaterThanOrEqual(lo);
        expect(b.frostFreeDays).toBeLessThanOrEqual(hi);
      }
    }
  });
});

describe('coverage and the honesty note', () => {
  it('covers eight of the ten pilot states completely', () => {
    const short = PAGES.filter((p) => p.coverage < 0.999);
    expect(short.map((p) => p.slug)).toEqual(['california', 'florida']);
  });

  it('leaves california a rounding error short, not a section', () => {
    // A minor 11a band, well under the 2% threshold, so it never reaches the
    // table. §5.6's note is for Florida; California should not trigger it.
    const ca = byslug.get('california')!;
    expect(ca.coverage).toBeGreaterThan(0.98); // 98.9%, the spec's 99%
    expect(ca.bands.every((b) => b.hasPage)).toBe(true);
    expect(ca.minorZones).toContain('11a');
  });

  it('caps florida at 88%, which is 11a and warmer having no frost normals', () => {
    const fl = byslug.get('florida')!;
    expect(fl.coverage).toBeGreaterThan(0.87);
    expect(fl.coverage).toBeLessThan(0.89);
    const uncovered = fl.bands.filter((b) => !b.hasPage);
    expect(uncovered.map((b) => b.zone)).toEqual(['11a']);
    // The bug this guards against: getFrostDatesByZone falls back to 6a for an
    // unknown key, which would print a March last frost over tropical Florida.
    expect(uncovered[0].lastSpringFrost).toBeNull();
  });
});

describe('reciprocal linking', () => {
  it('lists the states where a zone is a material band, heaviest first', () => {
    const s = statesForZone('6a');
    expect(s.map((x) => x.slug)).toContain('michigan');
    expect(s.map((x) => x.slug)).toContain('ohio');
    expect(s).toEqual([...s].sort((a, b) => b.share - a.share));
  });

  it('caps the list, since this is a link section and not a directory', () => {
    expect(statesForZone('8a', 2)).toHaveLength(2);
  });

  it('returns nothing for a zone no pilot state carries materially', () => {
    expect(statesForZone('4a')).toEqual([]);
  });

  it('puts neighbours with pages of their own first', () => {
    const ky = byslug.get('kentucky')!.neighbours;
    const firstWithout = ky.findIndex((s) => !isPageState(s));
    const lastWith = ky.map((s) => isPageState(s)).lastIndexOf(true);
    expect(lastWith).toBeLessThan(firstWithout === -1 ? ky.length : firstWithout);
    expect(ky).toContain('ohio');
  });
});

describe('purity', () => {
  it('returns identical data for repeated calls', () => {
    const a = getStatePageData('georgia');
    const b = getStatePageData('georgia');
    expect(a.bands).toEqual(b.bands);
    expect(a.shape).toEqual(b.shape);
    expect(a.coverage).toBe(b.coverage);
  });

  it('takes a date for now-sowing rather than reading the clock', () => {
    const p = byslug.get('north-carolina')!;
    const july = p.nowSowing(new Date(2026, 6, 1));
    const october = p.nowSowing(new Date(2026, 9, 1));
    const count = (s: typeof july) => s.reduce((n, x) => n + x.rows.length, 0);
    expect(count(july)).toBeGreaterThan(count(october));
  });
});
