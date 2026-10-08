import { abs, notFoundMarkdown, toMarkdownResponseBody, type MarkdownDoc } from "@/lib/markdown/doc";
import { markdownPaths, normalizePath, renderMarkdown } from "@/lib/markdown/render";

/* The markdown version of a page. Nobody links here: proxy.ts rewrites a
   request that prefers text/markdown to this route, and next.config.mjs maps
   "/path.md" here, so the agent keeps the page's own URL. */

// Zone and state pages count "what you can still sow" from today, so these
// re-render daily, like the HTML pages they mirror.
export const revalidate = 86400;

export function generateStaticParams() {
  return markdownPaths().map((p) => ({ path: p.split("/").filter(Boolean) }));
}

const BASE_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  // The HTML page is the one to index; this is a copy for agents.
  "X-Robots-Tag": "noindex",
};

export async function GET(_request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const pathname = normalizePath(path.join("/"));

  let doc: MarkdownDoc | null = null;
  try {
    doc = renderMarkdown(pathname);
  } catch (error) {
    console.error(`markdown render failed for ${pathname}`, error);
  }

  if (!doc) {
    return new Response(notFoundMarkdown(pathname), { status: 404, headers: BASE_HEADERS });
  }
  return new Response(toMarkdownResponseBody(doc), {
    headers: { ...BASE_HEADERS, Link: `<${abs(doc.path)}>; rel="canonical"` },
  });
}
