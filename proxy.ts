import { NextResponse, type NextRequest } from "next/server";
import { prefersMarkdown } from "@/lib/markdown/negotiate";

/**
 * Markdown for agents, at the page's own URL.
 *
 * The matcher only lets requests whose Accept header mentions markdown reach
 * this function, so browser traffic never runs it and keeps hitting the CDN
 * cache as before. A request that prefers markdown is rewritten to the
 * markdown route (app/md), which answers for real pages and returns a
 * markdown 404 for anything else.
 */
export function proxy(request: NextRequest) {
  if (!prefersMarkdown(request.headers.get("accept"))) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname === "/" ? "/md" : `/md${request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    {
      // Pages only: not Next's own assets, the API, the markdown route itself,
      // media, the CMS, or anything that looks like a file.
      source: "/((?!_next/|api/|md/|images/|videos/|keystatic)(?!.*\\.\\w+$).*)",
      has: [{ type: "header", key: "accept", value: ".*text/(x-)?markdown.*" }],
    },
  ],
};
