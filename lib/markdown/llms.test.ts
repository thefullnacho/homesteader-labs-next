import { describe, it, expect } from 'vitest';
import { getAllPosts } from '@/lib/posts';
import { llmsFullTxt, llmsTxt } from './llms';

describe('llms.txt', () => {
  const txt = llmsTxt();

  it('keeps the hand-written sections around the generated list', () => {
    expect(txt.startsWith('# Homesteader Labs')).toBe(true);
    expect(txt).toContain('## Data endpoints');
    expect(txt).toContain('## Terms');
    expect(txt).not.toContain('<!-- generated');
  });

  it('lists every guide, including the ones that earn the traffic', () => {
    for (const p of getAllPosts()) expect(txt, p.slug).toContain(`/archive/${p.slug}/`);
    expect(txt).toContain('wild-berry-guide');
    expect(txt).toContain('google-assistant-shutdown-what-actually-stops-working');
  });

  it('tells agents how to get markdown', () => {
    expect(txt).toContain('Accept: text/markdown');
    expect(txt).toContain('/llms-full.txt');
  });
});

describe('llms-full.txt', () => {
  it('holds every guide in full', () => {
    const full = llmsFullTxt();
    for (const p of getAllPosts()) expect(full, p.slug).toContain(`# ${p.title}`);
  });
});
