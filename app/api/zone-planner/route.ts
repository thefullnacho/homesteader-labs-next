import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { renderZonePlannerPdf } from "@/lib/zonePlanner/generator";
import { isPageZone } from "@/lib/tools/planting-calendar/zonePages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const audienceId = process.env.RESEND_AUDIENCE_ID;

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

    // Zone, not ZIP. Ten zones cover 88% of US ZIPs, so the tag is coarse
    // enough to be non-identifying while still being the one attribute that
    // changes what a seasonal follow-up should say.
    if (resend && audienceId) {
      try {
        await resend.contacts.create({
          email,
          audienceId,
          unsubscribed: false,
          properties: { zone, source: "fall-planner" },
        });
      } catch (err) {
        // A failed tag must not cost the reader the PDF they asked for.
        console.warn("[zone-planner] contact add failed", err);
      }
    }

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
