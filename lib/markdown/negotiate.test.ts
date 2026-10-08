import { describe, it, expect } from 'vitest';
import { prefersMarkdown } from './negotiate';

describe('prefersMarkdown', () => {
  it('never sends a browser markdown', () => {
    const chrome =
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
    expect(prefersMarkdown(chrome)).toBe(false);
    expect(prefersMarkdown('*/*')).toBe(false);
    expect(prefersMarkdown(null)).toBe(false);
  });

  it('sends markdown to an agent that asks for it', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true);
    expect(prefersMarkdown('text/markdown, text/html;q=0.9')).toBe(true);
    expect(prefersMarkdown('text/x-markdown')).toBe(true);
  });

  it('respects an agent that weights HTML higher', () => {
    expect(prefersMarkdown('text/html, text/markdown;q=0.5')).toBe(false);
  });

  it('lets markdown win a tie, since listing it is the signal', () => {
    expect(prefersMarkdown('text/html, text/markdown')).toBe(true);
  });
});
