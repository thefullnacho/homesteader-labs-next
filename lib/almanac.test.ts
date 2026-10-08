import { describe, it, expect } from 'vitest';
import { getAllPosts } from './posts';
import { ALMANAC, getAlmanacMonth } from './almanac';

const slugs = new Set(getAllPosts().map((p) => p.slug));

describe('almanac', () => {
  it('links only to guides that exist', () => {
    for (const jobs of Object.values(ALMANAC)) {
      for (const job of jobs ?? []) {
        const slug = job.href.match(/^\/archive\/([^/]+)\/$/)?.[1];
        expect(slug, job.href).toBeTruthy();
        expect(slugs.has(slug!), job.href).toBe(true);
      }
    }
  });

  it('names the month it was asked for', () => {
    expect(getAlmanacMonth(new Date(2026, 9, 7))?.month).toBe('October');
  });

  it('shows nothing for a month with no jobs', () => {
    expect(getAlmanacMonth(new Date(2026, 5, 1))).toBeNull();
  });
});
