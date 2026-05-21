import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { renderSurvivalPlanPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';
import type { SurvivalPlanInput } from '@/lib/survivalPlan/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const FROM_EMAIL = process.env.SGP_FROM_EMAIL ?? 'orders@homesteaderlabs.com';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function verifySignature(secret: string, body: string, signature: string | null): boolean {
  if (!signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!LS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get('x-signature');

  if (!verifySignature(LS_WEBHOOK_SECRET, raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: { meta?: { event_name?: string }; data?: { attributes?: Record<string, unknown> } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = payload.meta?.event_name;
  if (event !== 'order_created') {
    return NextResponse.json({ ok: true, skipped: event });
  }

  const attrs = payload.data?.attributes ?? {};
  const customerEmail = (attrs.user_email ?? attrs.customer_email) as string | undefined;
  const firstOrderItem = (attrs.first_order_item ?? {}) as Record<string, unknown>;
  const customData = (firstOrderItem.custom_data ?? attrs['checkout_data'] ?? {}) as Record<string, unknown>;
  const planInputRaw = (customData.custom as Record<string, unknown>)?.plan_input ?? customData.plan_input;

  if (!customerEmail || !planInputRaw || typeof planInputRaw !== 'string') {
    return NextResponse.json({ error: 'Missing email or plan input' }, { status: 400 });
  }

  let input: SurvivalPlanInput;
  try {
    input = JSON.parse(planInputRaw);
  } catch {
    return NextResponse.json({ error: 'Invalid plan input JSON' }, { status: 400 });
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
        text: `Thanks for ordering. Your personalized survival garden plan is attached.\n\nDownload anytime at: https://homesteaderlabs.com/survival-garden-plan/success/${attrs.id ?? ''}/`,
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
