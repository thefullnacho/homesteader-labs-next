import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';
import { markdownPaths, normalizePath, renderMarkdown } from './render';
import { mdUrl } from './doc';

const SITE = 'https://homesteaderlabs.com';
const sitemapPaths = sitemap().map((e) => normalizePath(e.url.slice(SITE.length)));

describe('normalizePath', () => {
  it('gives every form of a path the site trailing slash', () => {
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('/kb/garlic')).toBe('/kb/garlic/');
    expect(normalizePath('kb/garlic/')).toBe('/kb/garlic/');
  });
});

describe('mdUrl', () => {
  it('maps the homepage to /index.md and pages to path.md', () => {
    expect(mdUrl('/')).toBe('/index.md');
    expect(mdUrl('/archive/how-to-grow-garlic/')).toBe('/archive/how-to-grow-garlic.md');
  });
});

describe('renderMarkdown', () => {
  it('has a markdown version of every page in the sitemap', () => {
    const missing = sitemapPaths.filter((p) => renderMarkdown(p) === null);
    expect(missing).toEqual([]);
  });

  it('pre-renders every sitemap page', () => {
    const paths = new Set(markdownPaths());
    expect(sitemapPaths.filter((p) => !paths.has(p))).toEqual([]);
  });

  it.each(markdownPaths().map((p) => [p]))('%s: titled, canonical, absolute links', (path) => {
    const doc = renderMarkdown(path)!;
    expect(doc, path).not.toBeNull();
    expect(doc.path).toBe(path);
    expect(doc.body.startsWith('# ')).toBe(true);
    expect(doc.body).not.toMatch(/\]\(\//);
  });

  it('answers null for paths with no page', () => {
    for (const path of ['/some-path-that-does-not-exist/', '/archive/nope/', '/kb/not-a-crop/', '/kb/garlic/extra/']) {
      expect(renderMarkdown(path), path).toBeNull();
    }
  });
});
