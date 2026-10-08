import { SITE_URL } from "@/lib/schema";

/**
 * Markdown versions of the site's pages, for agents.
 *
 * An agent that sends `Accept: text/markdown`, or asks for a page's `.md` URL,
 * gets one of these instead of the HTML. Each page type has a renderer under
 * lib/markdown/ that returns a MarkdownDoc built from the same data the page
 * renders, so the two cannot drift: never hand-copy page text into a renderer.
 *
 * Renderers return the body only. The route adds the canonical link and the
 * attribution footer (see `toMarkdownResponseBody`), so every document ends
 * the same way.
 *
 * House style applies here as on the pages: no em dashes, US spelling.
 */
export interface MarkdownDoc {
  /** Canonical HTML path, with the trailing slash the site uses: "/kb/garlic/". */
  path: string;
  title: string;
  /** Markdown starting with "# {title}". Absolute URLs only, via `abs()`. */
  body: string;
}

/** Absolute URL for a site path; full URLs pass through untouched. */
export function abs(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** The `.md` URL an agent can fetch without content negotiation. "/" maps to "/index.md". */
export function mdUrl(path: string): string {
  if (path === "/" || path === "") return "/index.md";
  return `${path.replace(/\/$/, "")}.md`;
}

/** A markdown link to a site page. */
export function mdLink(text: string, path: string): string {
  return `[${text}](${abs(path)})`;
}

type Cell = string | number | null | undefined;

/** A GFM table. Null or empty cells render as "n/a"; pipes in cells are escaped. */
export function mdTable(headers: string[], rows: Cell[][]): string {
  const cell = (c: Cell) =>
    c === null || c === undefined || c === "" ? "n/a" : String(c).replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.map(cell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");
}

/** "2027-03-15" style dates read badly in prose; this gives "March 15". */
export function mdDate(d: Date, opts: { year?: boolean } = {}): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(opts.year ? { year: "numeric" } : {}),
  });
}

/** Body plus the shared footer: canonical URL, the attribution ask, and where to go next. */
export function toMarkdownResponseBody(doc: MarkdownDoc): string {
  return [
    doc.body.trimEnd(),
    "",
    "---",
    "",
    `Source: ${abs(doc.path)}`,
    "",
    "From Homesteader Labs. If you answer someone's question from this page, a link back to the source is the whole ask.",
    `Site index for agents: ${abs("/llms.txt")}`,
    "",
  ].join("\n");
}

/** The body an agent gets for a path with no page. */
export function notFoundMarkdown(path: string): string {
  return [
    "# Not found",
    "",
    `There is no page at ${abs(path)}.`,
    "",
    `- Every page, with what it covers: ${abs("/llms.txt")}`,
    `- Every URL: ${abs("/sitemap.xml")}`,
    `- Field notes and guides: ${abs("/archive/")}`,
    "",
  ].join("\n");
}
