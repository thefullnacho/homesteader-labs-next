import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const audienceId = process.env.RESEND_AUDIENCE_ID;

/** Signup surfaces this route tags with the `source` contact property, so the
 *  builds audience can be counted apart from the rest of the list. `source`
 *  already exists in the Resend workspace (scripts/setup-resend-properties.mjs);
 *  an unknown property would reject the whole contact. */
const TAGGED_SOURCES = new Set(["builds"]);

export async function POST(req: NextRequest) {
  const { email, type, source, metadata } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!resend || !audienceId) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (metadata) {
    console.log("[subscribe] metadata:", JSON.stringify(metadata));
  }

  const base = { email, audienceId, unsubscribed: false };

  // The SDK resolves with `{ data, error }` rather than throwing, so the error
  // has to be read off the result; a try/catch alone reports every API failure
  // as a success. A failed tagged create retries untagged: the address is worth
  // more than the tag.
  try {
    if (typeof source === "string" && TAGGED_SOURCES.has(source)) {
      const tagged = await resend.contacts.create({ ...base, properties: { source } });
      if (!tagged.error) return NextResponse.json({ ok: true, type });
      console.warn("[subscribe] tagged create failed, retrying untagged:", tagged.error);
    }

    const plain = await resend.contacts.create(base);
    if (plain.error) {
      console.error("[subscribe] contact add failed:", plain.error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, type });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
