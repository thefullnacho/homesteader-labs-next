import { describe, it, expect } from 'vitest';
import { getAllPosts } from '@/lib/posts';
import {
  archiveIndexMarkdown,
  buildsHubMarkdown,
  foragingHubMarkdown,
  homeMarkdown,
  mdxToMarkdown,
  postMarkdown,
} from './posts';

const posts = getAllPosts();

describe('mdxToMarkdown', () => {
  it('turns FieldVideo into a link to the file, with its caption', () => {
    const out = mdxToMarkdown('<FieldVideo src="/videos/a.mp4" poster="/images/a.jpg" caption="79 seconds" />');
    expect(out).toBe('[Video: 79 seconds](https://homesteaderlabs.com/videos/a.mp4)');
  });

  it('drops any other component instead of leaking JSX', () => {
    expect(mdxToMarkdown('before <SomethingNew foo="bar" /> after')).toBe('before  after');
  });

  it('makes site-relative links and images absolute', () => {
    expect(mdxToMarkdown('![a](/images/x.jpg) and [b](/archive/y/)')).toBe(
      '![a](https://homesteaderlabs.com/images/x.jpg) and [b](https://homesteaderlabs.com/archive/y/)'
    );
  });
});

describe('post markdown', () => {
  it.each(posts.map((p) => [p.slug]))('%s renders with no JSX and no relative links', (slug) => {
    const doc = postMarkdown(slug)!;
    expect(doc.body.startsWith(`# ${doc.title}\n`)).toBe(true);
    expect(doc.body).not.toMatch(/<[A-Z][A-Za-z]*\b/);
    expect(doc.body).not.toMatch(/\]\(\//);
  });

  it('is null for a note that does not exist', () => {
    expect(postMarkdown('not-a-note')).toBeNull();
  });
});

describe('hubs and homepage', () => {
  it('lists every note in the archive index', () => {
    const body = archiveIndexMarkdown().body;
    for (const p of posts) expect(body).toContain(`/archive/${p.slug}/`);
  });

  it('carries the build logs and the foraging guides', () => {
    expect(buildsHubMarkdown().body).toContain('diy-drip-irrigation-raised-beds');
    expect(foragingHubMarkdown().body).toContain('wild-berry-guide');
  });

  it('leads the homepage with the sentence and the measured numbers', () => {
    const body = homeMarkdown(new Date(2026, 9, 7)).body;
    expect(body.startsWith('# One half acre. Every build measured.')).toBe(true);
    expect(body).toContain('$539');
    expect(body).toContain('**October:**');
  });

  it('uses no em dashes in our own templates', () => {
    for (const doc of [archiveIndexMarkdown(), buildsHubMarkdown(), foragingHubMarkdown(), homeMarkdown()]) {
      expect(doc.body, doc.path).not.toContain('—');
    }
  });
});
