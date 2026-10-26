import { getAllNotes, getNote } from "@/lib/notes";
import { getPostBySlug } from "@/lib/posts";
import { mdLink, type MarkdownDoc } from "./doc";
import { mdxToMarkdown } from "./posts";

/* Lab notes are written for agents first, so their markdown is the note
   itself, with the story link on top as on the page. */

export function noteMarkdown(slug: string): MarkdownDoc | null {
  const note = getNote(slug);
  if (!note) return null;
  const story = getPostBySlug(note.story);
  return {
    path: `/notes/${note.slug}/`,
    title: note.title,
    body: [
      `# ${note.title}`,
      "",
      `> ${note.summary}`,
      "",
      `Lab notes, work dated ${note.date}.${story ? ` The story: ${mdLink(story.title, `/archive/${story.slug}/`)}` : ""}`,
      "",
      mdxToMarkdown(note.content),
    ].join("\n"),
  };
}

export function noteMarkdownPaths(): string[] {
  return getAllNotes().map((n) => `/notes/${n.slug}/`);
}
