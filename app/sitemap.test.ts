import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';
import { getAllPosts } from '@/lib/posts';
import { ZONE_PAGES } from '@/lib/tools/planting-calendar/zonePages';

/**
 * The sitemap is where two real failures lived:
 *
 *  - every URL was published on the apex host while production redirected apex
 *    to www with a 307, so Google never crawled a single page
 *  - every route reported `lastModified: new Date()`, so each fetch claimed the
 *    whole site had changed seconds ago and crawlers stopped trusting lastmod
 *
 * These lock both down, plus coverage of the routes we care about.
 */

const entries = sitemap();
const urls = entries.map((e) => e.url);

describe('host and shape', () => {
  it('publishes every URL on the apex host', () => {
    // www 308-redirects to apex; publishing www URLs would reintroduce the loop.
    for (const url of urls) {
      expect(url.startsWith('https://homesteaderlabs.com'), url).toBe(true);
      expect(url).not.toContain('www.');
    }
  });

  it('has no duplicate URLs', () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('uses trailing slashes, matching trailingSlash in next.config', () => {
    for (const url of urls) {
      const path = url.replace('https://homesteaderlabs.com', '');
      if (path === '') continue; // bare origin is fine
      expect(path.endsWith('/'), url).toBe(true);
    }
  });
});

describe('lastmod is honest or absent', () => {
  it('omits lastModified on routes with no real change signal', () => {
    const shouldBeBare = [
      'https://homesteaderlabs.com',
      'https://homesteaderlabs.com/shop/',
      'https://homesteaderlabs.com/tools/planting-calendar/',
    ];
    for (const url of shouldBeBare) {
      const entry = entries.find((e) => e.url === url);
      expect(entry, `${url} missing from sitemap`).toBeDefined();
      expect(entry!.lastModified, `${url} should not claim a lastmod`).toBeUndefined();
    }
  });

  it('never reports a lastmod of today for a static route', () => {
    // The original bug: `new Date()` on every entry, so all of them read "now".
    const today = new Date().toISOString().slice(0, 10);
    const staticish = entries.filter(
      (e) => !e.url.includes('/archive/') && !e.url.includes('/kb/')
    );
    const claimingNow = staticish.filter(
      (e) => e.lastModified && new Date(e.lastModified).toISOString().slice(0, 10) === today
    );
    expect(claimingNow.map((e) => e.url)).toEqual([]);
  });

  it('dates archive entries from their own frontmatter', () => {
    for (const post of getAllPosts()) {
      const entry = entries.find((e) => e.url.endsWith(`/archive/${post.slug}/`));
      expect(entry, `${post.slug} missing from sitemap`).toBeDefined();
      expect(entry!.lastModified, `${post.slug} lastmod`).toBeDefined();
      expect(new Date(entry!.lastModified!).toISOString().slice(0, 10)).toBe(
        new Date(post.updated || post.date).toISOString().slice(0, 10)
      );
    }
  });
});

describe('coverage', () => {
  it('lists every published archive post', () => {
    for (const post of getAllPosts()) {
      expect(urls).toContain(`https://homesteaderlabs.com/archive/${post.slug}/`);
    }
  });

  it('lists every zone page', () => {
    for (const zone of ZONE_PAGES) {
      expect(urls).toContain(
        `https://homesteaderlabs.com/tools/planting-calendar/zone/${zone}/`
      );
    }
  });

  it('omits routes that robots.txt disallows or that are noindex', () => {
    // Cart, gated funnel steps and the personal-data inventory page.
    for (const path of [
      '/requisition/',
      '/survival-garden-plan/wizard/',
      '/tools/caloric-security/inventory/',
    ]) {
      expect(urls.some((u) => u.endsWith(path)), `${path} should not be listed`).toBe(false);
    }
  });
});
