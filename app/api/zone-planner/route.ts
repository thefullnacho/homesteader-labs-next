import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { renderZonePlannerPdf } from "@/lib/zonePlanner/generator";
import { isPageZone } from "@/lib/tools/planting-calendar/zonePages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const audienceId = process.env.RESEND_AUDIENCE_ID;

/** Contact properties this route sets. Both must already exist in the Resend
 *  workspace; see scripts/setup-resend-properties.mjs.
 *
 *  Not exported: a route file may only export the HTTP handlers and Next's
 *  reserved config fields, and anything else fails the build. */
const PLANNER_SOURCE = "fall-planner";

/**
 * Adds the subscriber, tagged with their zone where possible.
 *
 * Two things about the Resend SDK make the obvious version of this wrong.
 *
 * It resolves with `{ data, error }` instead of throwing, so wrapping the call
 * in try/catch swallows every API error silently: the promise settles, the
 * catch never runs, and a failed create looks identical to a successful one.
 * The error has to be read off the result.
 *
 * And custom properties must already exist in the workspace. Setting an unknown
 * key rejects the whole create with a 422, so a missing label costs the
 * subscriber entirely. The address is worth more than the tag, so an untagged
 * retry follows.
 */
async function addContact(email: string, zone: string): Promise<void> {
  if (!resend || !audienceId) {
    console.warn("[zone-planner] RESEND_API_KEY or RESEND_AUDIENCE_ID unset, contact dropped");
    return;
  }

  const base = { email, audienceId, unsubscribed: false };

  try {
    const tagged = await resend.contacts.create({
      ...base,
      properties: { zone, source: PLANNER_SOURCE },
    });
    if (!tagged.error) return;

    console.warn("[zone-planner] tagged create failed, retrying untagged:", tagged.error);
    const plain = await resend.contacts.create(base);
    if (plain.error) console.warn("[zone-planner] contact add failed:", plain.error);
  } catch (err) {
    // Network or client-side failure, the one case that genuinely throws.
    console.warn("[zone-planner] contact add threw:", err);
  }
}

export async function POST(req: NextRequest) {
  let body: { zone?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const { zone, email } = body;

  if (!zone || !isPageZone(zone)) {
    return NextResponse.json({ error: "Unknown zone" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  try {
    const buffer = await renderZonePlannerPdf(zone, "fall");

    await addContact(email, zone);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fall-planner-zone-${zone}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[zone-planner]", err);
    return NextResponse.json({ error: "Failed to generate planner" }, { status: 500 });
  }
}
