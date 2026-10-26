import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Lab notes: the agent-facing companion to a story in the archive, at
 * /notes/<slug>/. The story is the human post; its lab notes carry the
 * finding, a results table with every number tagged measured or estimated,
 * the method, what is open, and links to the public repo. Each note names its
 * story, and the two link both ways.
 *
 * Files live in content/notes/*.mdx. The lab notes are written and maintained
 * on the project side (for Hestia, the hestia repo's posts brief); run its
 * privacy sweep before one lands here.
 */

const NOTES_DIR = path.join(process.cwd(), 'content/notes');

export interface LabNote {
  slug: string;
  /** States the finding, not a teaser. */
  title: string;
  /** Date of the work, not of publishing. */
  date: string;
  /** Two sentences: the finding and its numbers. */
  summary: string;
  /** Slug of the story in /archive/ this note belongs to. */
  story: string;
  repo?: string;
  /** Commit the repo links are pinned to. */
  commit?: string;
  content: string;
}

function read(file: string): LabNote {
  const slug = file.replace(/\.mdx$/, '');
  const { data, content } = matter(fs.readFileSync(path.join(NOTES_DIR, file), 'utf8'));
  for (const key of ['title', 'date', 'summary', 'story'] as const) {
    if (typeof data[key] !== 'string' || !data[key]) {
      throw new Error(`content/notes/${file} is missing "${key}"`);
    }
  }
  return {
    slug,
    title: data.title,
    date: data.date,
    summary: data.summary,
    story: data.story,
    repo: data.repo,
    commit: data.commit,
    content,
  };
}

/** Every lab note, newest work first. */
export function getAllNotes(): LabNote[] {
  if (!fs.existsSync(NOTES_DIR)) return [];
  return fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map(read)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getNote(slug: string): LabNote | null {
  return getAllNotes().find((n) => n.slug === slug) ?? null;
}

/** The lab notes for a story, if it has any. */
export function getNoteForStory(storySlug: string): LabNote | null {
  return getAllNotes().find((n) => n.story === storySlug) ?? null;
}
