import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const audienceId = process.env.RESEND_AUDIENCE_ID!;

export async function POST(req: NextRequest) {
  const { email, type } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!audienceId) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
    });

    return NextResponse.json({ ok: true, type });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
