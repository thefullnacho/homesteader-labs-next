import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readClicks, summarize } from "@/lib/clicks";

/**
 * Click counts for /go/ links. Private: send `Authorization: Bearer
 * $GO_STATS_TOKEN`. `?days=` sets the window (default 28, max 366).
 */
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const token = process.env.GO_STATS_TOKEN;
  if (!token) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${token}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });

  const requested = Number(req.nextUrl.searchParams.get("days") ?? 28);
  const days = Number.isFinite(requested) ? Math.min(366, Math.max(1, Math.floor(requested))) : 28;

  try {
    const rows = await readClicks(days);
    if (!rows) return NextResponse.json({ error: "Click store not configured" }, { status: 503, headers });
    return NextResponse.json({ days, ...summarize(rows), rows }, { headers });
  } catch (err) {
    console.error("[go/stats]", err);
    return NextResponse.json({ error: "Click store unavailable" }, { status: 502, headers });
  }
}
