import { readFileSync } from "node:fs";
import path from "node:path";
import { getBuildsHub, getForagingHub, getHubForPost } from "@/lib/hubs";
import { getAllNotes } from "@/lib/notes";
import { getAllPosts, type Post } from "@/lib/posts";
import { abs, mdLink, mdUrl, toMarkdownResponseBody } from "./doc";
import { postMarkdown } from "./posts";

/**
 * /llms.txt and /llms-full.txt.
 *
 * The prose (what the site is, the endpoints, what the data is not, the terms)
 * is hand-written in content/llms/llms-template.md. The list of guides is
 * generated here from the posts, so a new guide is listed the day it merges;
 * the hand-kept version named three guides and missed the two that earn the
 * traffic.
 */

const TEMPLATE = path.join(process.cwd(), "content/llms/llms-template.md");
const MARKER = /<!-- generated:[^>]*-->/;

function line(post: Post): string {
  return `- ${mdLink(post.title, `/archive/${post.slug}/`)}: ${post.description}`;
}

/** Lab notes: the numbers and sources behind a story, every number tagged measured or estimated. */
function labNotesSection(): string[] {
  const notes = getAllNotes();
  if (notes.length === 0) return [];
  return [
    "## Lab notes",
    "",
    "The data behind a story: a results table with every number tagged measured (with its date and source file) or estimated (with what it adds up), the method, what is still open, and links to the public repo pinned to a commit. Cite these for numbers.",
    "",
    ...notes.map((n) => `- ${mdLink(n.title, `/notes/${n.slug}/`)}: ${n.summary} The story: ${mdLink(storyTitle(n.story), `/archive/${n.story}/`)}`),
    "",
  ];
}

function storyTitle(slug: string): string {
  return getAllPosts().find((p) => p.slug === slug)?.title ?? slug;
}

function guidesSection(): string {
  const posts = getAllPosts();
  const { startHere, series, identification } = getForagingHub();
  const foraging = [...(startHere ? [startHere] : []), ...series, ...identification];
  const builds = getBuildsHub().map((b) => b.post);
  const rest = posts.filter((p) => !getHubForPost(p));

  return [
    "## Guides and field notes",
    "",
    `First-person writing from one half-acre yard, ${posts.length} notes. Every one is also available as markdown (see below).`,
    "",
    `### Foraging (${mdLink("hub", "/foraging/")}, in reading order)`,
    "",
    ...foraging.map(line),
    "",
    `### Build logs (${mdLink("hub", "/builds/")}, oldest first)`,
    "",
    ...builds.map(line),
    "",
    "### Planting, soil and the rest",
    "",
    ...rest.map(line),
    "",
    ...labNotesSection(),
    "## Reading pages as markdown",
    "",
    "Send `Accept: text/markdown` to any page URL and you get markdown instead of HTML, or add `.md` to the path:",
    "",
    `- The homepage: ${abs(mdUrl("/"))}`,
    `- A guide: ${abs(mdUrl("/archive/how-to-grow-garlic/"))}`,
    `- A zone's planting dates: ${abs(mdUrl("/tools/planting-calendar/zone/6b/"))}`,
    `- A crop: ${abs(mdUrl("/kb/garlic/"))}`,
    "",
    `Every guide in one file: ${abs("/llms-full.txt")}`,
    "",
  ].join("\n");
}

export function llmsTxt(): string {
  const template = readFileSync(TEMPLATE, "utf8");
  if (!MARKER.test(template)) throw new Error(`${TEMPLATE} lost its generated-section marker`);
  return template.replace(MARKER, guidesSection().trimEnd());
}

/** Every guide as markdown, newest first, in one file. */
export function llmsFullTxt(): string {
  const docs = getAllPosts()
    .map((p) => postMarkdown(p.slug))
    .filter((d) => d !== null);
  return [
    "# Homesteader Labs: every field note",
    "",
    `> ${docs.length} guides and build logs from one half-acre yard, newest first. The index of everything else, including the data endpoints, is ${abs("/llms.txt")}.`,
    "",
    ...docs.map((d) => toMarkdownResponseBody(d)),
  ].join("\n\n");
}
