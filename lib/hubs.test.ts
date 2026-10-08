import { describe, it, expect } from 'vitest';
import { getAllPosts } from './posts';
import {
  BUILD_OUTCOMES,
  FORAGING_START_SLUG,
  getBuildsHub,
  getForagingHub,
  getForagingSeries,
  getHubForPost,
  getLastMeasured,
  seriesMonth,
} from './hubs';
import sitemap from '@/app/sitemap';

/**
 * The hubs exist to make the archive read in order, so what these lock down is
 * membership and order: a guide missing from its hub is a guide the hub page
 * never links to, and a build without an outcome line renders as a bare title.
 */

const posts = getAllPosts();

describe('foraging hub', () => {
  const hub = getForagingHub();
  const listed = [hub.startHere, ...hub.series, ...hub.identification].filter(Boolean);

  it('starts with the wild berry guide', () => {
    expect(hub.startHere?.slug).toBe(FORAGING_START_SLUG);
  });

  it('runs the monthly series oldest first, August before September', () => {
    const slugs = hub.series.map((p) => p.slug);
    expect(slugs.indexOf('what-to-forage-august')).toBeGreaterThanOrEqual(0);
    expect(slugs.indexOf('what-to-forage-august')).toBeLessThan(
      slugs.indexOf('what-to-forage-september')
    );
    const dates = hub.series.map((p) => p.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('carries mushroom safety and the ID guides', () => {
    const slugs = hub.identification.map((p) => p.slug);
    expect(slugs).toContain('mushroom-foraging-101');
    expect(slugs).toContain('identify-sugar-maple');
  });

  it('lists every note that names it as its hub, once', () => {
    const members = posts.filter((p) => getHubForPost(p)?.id === 'foraging').map((p) => p.slug);
    const shown = listed.map((p) => p!.slug);
    expect(new Set(shown).size).toBe(shown.length);
    expect([...shown].sort()).toEqual([...members].sort());
  });

  it('keeps the forager build logs out, despite their foraging tag', () => {
    const slugs = listed.map((p) => p!.slug);
    expect(slugs).not.toContain('forager-field-station-hackathon');
    expect(slugs).not.toContain('build-small-hackathon-results');
  });

  it('names each series month from its slug', () => {
    expect(seriesMonth('what-to-forage-september')).toBe('September');
    for (const p of getForagingSeries()) {
      expect(seriesMonth(p.slug)).toMatch(/^[A-Z][a-z]+$/);
    }
  });
});

describe('builds hub', () => {
  const builds = getBuildsHub();

  it('holds every build log, tool build logs included', () => {
    const slugs = builds.map((b) => b.post.slug);
    for (const slug of [
      'build-log-survival-index',
      'build-log-planting-calendar-algorithm',
      'forager-field-station-hackathon',
      'build-small-hackathon-results',
      'hestia-house-brain-build-log',
      'diy-drip-irrigation-raised-beds',
    ]) {
      expect(slugs, slug).toContain(slug);
    }
  });

  it('is chronological, oldest first', () => {
    const dates = builds.map((b) => b.post.date);
    expect(dates).toEqual([...dates].sort());
  });

  it.each(builds.map((b) => [b.post.slug, b] as const))(
    '%s: has a one-line outcome',
    (slug, build) => {
      expect(build.outcome, `${slug} needs an entry in BUILD_OUTCOMES`).not.toBeNull();
      expect(build.outcome!.line).not.toContain('—');
      expect(build.outcome!.line.split(/(?<=\.)\s/).length).toBeLessThanOrEqual(3);
    }
  );

  it('has no outcome lines for posts that are not builds', () => {
    const buildSlugs = new Set(builds.map((b) => b.post.slug));
    for (const slug of Object.keys(BUILD_OUTCOMES)) {
      expect(buildSlugs.has(slug), `${slug} is in BUILD_OUTCOMES but not a build`).toBe(true);
    }
  });
});

describe('homepage ledger', () => {
  const measured = getLastMeasured();

  it('fills all four cells from the build logs', () => {
    expect(measured).toHaveLength(4);
  });

  it('leads with the newest build', () => {
    const dates = measured.map((m) => m.post.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('keeps every figure short enough for display type, with no em dashes', () => {
    for (const m of measured) {
      expect(m.value.length, m.value).toBeLessThanOrEqual(5);
      expect(m.what).not.toContain('—');
    }
  });
});

describe('hub routes', () => {
  it('are in the sitemap', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain('https://homesteaderlabs.com/foraging/');
    expect(urls).toContain('https://homesteaderlabs.com/builds/');
  });
});
