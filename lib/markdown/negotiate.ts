/**
 * Whether an Accept header asks for markdown over HTML.
 *
 * Browsers never list text/markdown, so they always get HTML. An agent that
 * lists both gets whichever it weights higher, and markdown wins a tie, since
 * listing it at all is the signal. `*\/*` alone is not a request for markdown.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  let markdown = 0;
  let html = 0;
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const weight = q ? Number.parseFloat(q.slice(2)) : 1;
    if (Number.isNaN(weight)) continue;
    if (type === "text/markdown" || type === "text/x-markdown") markdown = Math.max(markdown, weight);
    if (type === "text/html" || type === "application/xhtml+xml") html = Math.max(html, weight);
  }
  return markdown > 0 && markdown >= html;
}
