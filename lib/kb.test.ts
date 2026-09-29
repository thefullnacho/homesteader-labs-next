import { describe, it, expect } from 'vitest';
import kbData from '@/content/kb/crops.json';
import { KB_RETIRED, getKbCrop, getKbSlugs } from './kb';

/**
 * Retired duplicates 301 to a survivor (next.config.mjs reads the same map), so
 * a bad entry here ships as a redirect to a 404 or a redirect chain.
 */
describe('retired KB slugs', () => {
  const recovered = new Set((kbData as { slug: string }[]).map((c) => c.slug));
  const live = new Set(getKbSlugs());

  it('only retires slugs that exist in the recovered data', () => {
    for (const retired of KB_RETIRED.keys()) {
      expect(recovered.has(retired), retired).toBe(true);
    }
  });

  it('points every retired slug at a live page, never at another retired one', () => {
    for (const [retired, survivor] of KB_RETIRED) {
      expect(live.has(survivor), `${retired} -> ${survivor}`).toBe(true);
      expect(KB_RETIRED.has(survivor), `${retired} -> ${survivor} chains`).toBe(false);
    }
  });

  it('drops retired slugs from pages, listings and the sitemap source', () => {
    for (const retired of KB_RETIRED.keys()) {
      expect(live.has(retired), retired).toBe(false);
      expect(getKbCrop(retired), retired).toBeUndefined();
    }
  });
});
