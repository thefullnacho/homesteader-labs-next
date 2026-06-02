import { NextRequest, NextResponse } from 'next/server';
import { renderSurvivalPlanPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';
import type { SurvivalPlanInput } from '@/lib/survivalPlan/types';
import {
  stripe,
  STRIPE_PRICE_ID,
  SITE_URL,
  PLAN_INPUT_METADATA_KEY,
  encodePlanInputForMetadata,
} from '@/lib/survivalPlan/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validateInput(input: unknown): input is SurvivalPlanInput {
  if (!input || typeof input !== 'object') return false;
  const i = input as Record<string, unknown>;
  return (
    typeof i.zipCode === 'string' && /^\d{5}$/.test(i.zipCode) &&
    typeof i.adults === 'number' && i.adults > 0 &&
    typeof i.kids === 'number' && i.kids >= 0 &&
    Array.isArray(i.dietaryRestrictions) &&
    typeof i.squareFeet === 'number' && i.squareFeet >= 10 &&
    typeof i.gardenType === 'string' &&
    typeof i.goal === 'string' &&
    typeof i.experience === 'string' &&
    Array.isArray(i.excludedCropIds)
  );
}

async function createStripeCheckout(input: SurvivalPlanInput) {
  if (!stripe || !STRIPE_PRICE_ID) return null;

  // {CHECKOUT_SESSION_ID} is substituted by Stripe on redirect — it becomes the
  // orderId used by the success page + regenerate download link.
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    metadata: {
      [PLAN_INPUT_METADATA_KEY]: encodePlanInputForMetadata(input),
    },
    success_url: `${SITE_URL}/survival-garden-plan/success/{CHECKOUT_SESSION_ID}/`,
    cancel_url: `${SITE_URL}/survival-garden-plan/wizard/`,
  });

  return session.url ?? undefined;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !validateInput(body.input)) {
    return NextResponse.json({ error: 'Invalid plan input' }, { status: 400 });
  }

  const input = body.input as SurvivalPlanInput;

  try {
    const checkoutUrl = await createStripeCheckout(input);
    if (checkoutUrl) {
      return NextResponse.json({ checkoutUrl });
    }

    if (process.env.NODE_ENV !== 'production') {
      const zone = getGrowingZoneFromZip(input.zipCode) ?? '6a';
      const frostDates = getFrostDatesByZone(zone, input.zipCode);
      const { buffer } = await renderSurvivalPlanPdf(input, frostDates);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="survival-garden-plan-dev.pdf"`,
          'X-Dev-Mode': 'true',
        },
      });
    }

    return NextResponse.json({
      error: 'Checkout is currently unavailable. Please try again later.',
    }, { status: 503 });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
