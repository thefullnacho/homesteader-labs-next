import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { getAllNotes } from './notes';
import { getPostBySlug } from './posts';
import { renderMarkdown } from './markdown/render';
import { llmsTxt } from './markdown/llms';

const notes = getAllNotes();

describe('lab notes', () => {
  it('exist', () => {
    expect(notes.length).toBeGreaterThan(0);
  });

  for (const note of notes) {
    describe(note.slug, () => {
      it('names a story that exists and links back to these notes', () => {
        const story = getPostBySlug(note.story);
        expect(story).not.toBeNull();
        expect(story!.content).toContain(`(/notes/${note.slug}/)`);
      });

      it('tags its numbers measured or estimated', () => {
        expect(note.content).toMatch(/measured 20\d\d-\d\d-\d\d/);
        const rows = note.content.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Piece') && !l.startsWith('|---'));
        for (const row of rows) expect(row, row).toMatch(/measured|estimate|not measured/);
      });

      it('passes the privacy sweep: no addresses, hostnames, or private paths', () => {
        const raw = fs.readFileSync(path.join(process.cwd(), 'content/notes', `${note.slug}.mdx`), 'utf8');
        expect(raw).not.toMatch(/\b(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01])|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\.\d{1,3}\.\d{1,3}(?:\.\d{1,3})?\b/);
        expect(raw).not.toMatch(/\.ts\.net|\.local\b|tailnet|tailscale/i);
        expect(raw).not.toMatch(/(?:^|[\s(`/])(?:private|data|secrets|memory)\//m);
        expect(raw).not.toMatch(/\/home\/|~\//);
      });

      it('has a markdown version and is listed in llms.txt', () => {
        expect(renderMarkdown(`/notes/${note.slug}/`)?.body).toContain(`# ${note.title}`);
        expect(llmsTxt()).toContain(`/notes/${note.slug}/`);
      });
    });
  }
});
