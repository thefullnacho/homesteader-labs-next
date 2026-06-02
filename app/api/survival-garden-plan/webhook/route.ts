import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { Resend } from 'resend';
import { renderSurvivalPlanPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';
import { stripe, STRIPE_WEBHOOK_SECRET, decodePlanInputFromMetadata } from '@/lib/survivalPlan/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.SGP_FROM_EMAIL ?? 'orders@homesteaderlabs.com';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get('stripe-signature');

  let evt: Stripe.Event;
  try {
    evt = stripe.webhooks.constructEvent(raw, signature ?? '', STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (evt.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, skipped: evt.type });
  }

  const session = evt.data.object as Stripe.Checkout.Session;
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? undefined;
  const input = decodePlanInputFromMetadata(session.metadata);

  if (!customerEmail || !input) {
    return NextResponse.json({ error: 'Missing email or plan input' }, { status: 400 });
  }

  try {
    const zone = getGrowingZoneFromZip(input.zipCode) ?? '6a';
    const frostDates = getFrostDatesByZone(zone, input.zipCode);
    const { buffer } = await renderSurvivalPlanPdf(input, frostDates);

    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: 'Your Survival Garden Plan',
        text: `Thanks for ordering. Your personalized survival garden plan is attached.\n\nDownload anytime at: https://homesteaderlabs.com/survival-garden-plan/success/${session.id}/`,
        attachments: [
          {
            filename: 'survival-garden-plan.pdf',
            content: buffer.toString('base64'),
          },
        ],
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhook]', err);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
