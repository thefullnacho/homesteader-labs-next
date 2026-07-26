import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getAllPosts } from '@/lib/posts';

/**
 * Structural checks that apply to every archive post. Each one here corresponds
 * to a mistake that actually shipped or nearly shipped:
 *
 *  - a table row written with one cell too many rendered short and silently
 *  - a duplicate body H1 restated the title the template already renders
 *  - em dashes survived the sweep in files nobody thought to re-check
 *  - a link to a post that does not exist reads as a 404 to a reader
 */

const ARCHIVE = path.join(process.cwd(), 'content/archive');
const slugs = fs
  .readdirSync(ARCHIVE)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

const body = (slug: string) =>
  fs.readFileSync(path.join(ARCHIVE, `${slug}.mdx`), 'utf8').replace(/^---[\s\S]*?\n---\n/, '');

describe('archive posts are structurally sound', () => {
  it('finds the posts', () => {
    expect(slugs.length).toBeGreaterThanOrEqual(14);
  });

  it.each(slugs)('%s: every table row has the header\'s column count', (slug) => {
    const lines = body(slug).split('\n');
    let expected: number | null = null;
    lines.forEach((raw, i) => {
      const l = raw.trim();
      if (!l.startsWith('|')) {
        expected = null;
        return;
      }
      const cells = l.replace(/^\||\|$/g, '').split('|').length;
      if (/^\|[\s:|-]+\|$/.test(l)) return; // separator sets nothing
      if (expected === null) {
        expected = cells; // header row of a new table
        return;
      }
      expect(cells, `${slug} line ${i + 1}: "${l.slice(0, 60)}"`).toBe(expected);
    });
  });

  it.each(slugs)('%s: no body H1, the template renders the title', (slug) => {
    // Fenced code blocks legitimately contain "# comment" lines.
    const withoutCode = body(slug).replace(/```[\s\S]*?```/g, '');
    const h1s = withoutCode.split('\n').filter((l) => /^# /.test(l));
    expect(h1s, `${slug} duplicates its frontmatter title in the body`).toHaveLength(0);
  });

  it.each(slugs)('%s: no em dashes', (slug) => {
    const hits = body(slug).split('\n').filter((l) => l.includes('—'));
    expect(hits, `${slug} has em dashes: ${hits[0]?.slice(0, 70) ?? ''}`).toHaveLength(0);
  });

  it.each(slugs)('%s: internal archive links resolve', (slug) => {
    const links = [...body(slug).matchAll(/\]\((\/archive\/[a-z0-9-]+)\/?\)/g)].map((m) => m[1]);
    for (const href of links) {
      const target = href.replace('/archive/', '');
      expect(slugs, `${slug} links to a post that does not exist: ${href}`).toContain(target);
    }
  });

  it.each(slugs)('%s: images referenced actually exist', (slug) => {
    const imgs = [...body(slug).matchAll(/!\[[^\]]*\]\((\/[^)]+)\)/g)].map((m) => m[1]);
    for (const src of imgs) {
      const onDisk = path.join(process.cwd(), 'public', src);
      expect(fs.existsSync(onDisk), `${slug} references a missing image: ${src}`).toBe(true);
    }
  });
});

describe('archive frontmatter', () => {
  const posts = getAllPosts();

  it.each(posts.map((p) => [p.slug, p] as const))('%s: has the required fields', (slug, post) => {
    expect(post.title, `${slug} title`).toBeTruthy();
    expect(post.description, `${slug} description`).toBeTruthy();
    expect(post.date, `${slug} date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(post.author, `${slug} author`).toBeTruthy();
  });

  it.each(posts.map((p) => [p.slug, p] as const))('%s: date is real and not absurd', (slug, post) => {
    const d = new Date(post.date);
    expect(Number.isNaN(d.getTime()), `${slug} unparseable date`).toBe(false);
    // The deep-watering note carried 2020-03-17, six years before the site
    // existed, and the sitemap published it as a real lastmod.
    expect(d.getFullYear(), `${slug} suspiciously old`).toBeGreaterThanOrEqual(2025);
    expect(d.getTime(), `${slug} dated in the future`).toBeLessThanOrEqual(
      Date.now() + 7 * 86400000
    );
  });
});
