import { after, NextRequest, NextResponse } from "next/server";
import { isBot, normalizeChannel, resolveDestination } from "@/lib/affiliates";
import { recordClick } from "@/lib/clicks";

/**
 * /go/<program>/<item>/?src=<channel>: count the click, then forward to the
 * affiliate URL. Destinations come only from lib/affiliates.ts.
 *
 * 302 with no-store, so neither the browser nor the CDN remembers the hop and
 * every click reaches this function. The count is written after the response
 * is sent, so a slow or missing store never delays the visitor.
 */
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ program: string; item?: string[] }> },
) {
  const { program, item } = await params;
  if (item && item.length > 1) return new NextResponse("Not found", { status: 404, headers: HEADERS });

  const channel = normalizeChannel(req.nextUrl.searchParams.get("src"));
  const destination = resolveDestination(program, item?.[0], channel);
  if (!destination) return new NextResponse("Not found", { status: 404, headers: HEADERS });

  if (!isBot(req.headers.get("user-agent"))) {
    after(() =>
      recordClick(program, channel).catch((err) => console.error("[go] count failed:", err)),
    );
  }

  return NextResponse.redirect(destination, { status: 302, headers: HEADERS });
}

/** Link checkers send HEAD; answer it without counting. */
export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ program: string; item?: string[] }> },
) {
  const { program, item } = await params;
  const destination =
    item && item.length > 1 ? null : resolveDestination(program, item?.[0], "other");
  if (!destination) return new NextResponse(null, { status: 404, headers: HEADERS });
  return NextResponse.redirect(destination, { status: 302, headers: HEADERS });
}
