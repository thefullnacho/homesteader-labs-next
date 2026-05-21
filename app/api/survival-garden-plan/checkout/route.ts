import { NextRequest, NextResponse } from 'next/server';
import { renderSurvivalPlanPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';
import type { SurvivalPlanInput } from '@/lib/survivalPlan/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LS_API_KEY      = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID     = process.env.LEMONSQUEEZY_STORE_ID;
const LS_VARIANT_ID   = process.env.LEMONSQUEEZY_VARIANT_ID;
const SITE_URL        = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homesteaderlabs.com';

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

async function createLemonSqueezyCheckout(input: SurvivalPlanInput) {
  if (!LS_API_KEY || !LS_STORE_ID || !LS_VARIANT_ID) return null;

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          custom: {
            plan_input: JSON.stringify(input),
          },
        },
        product_options: {
          redirect_url: `${SITE_URL}/survival-garden-plan/success/{order_id}/`,
          receipt_button_text: 'Download your plan',
          receipt_link_url: `${SITE_URL}/survival-garden-plan/success/{order_id}/`,
        },
      },
      relationships: {
        store:   { data: { type: 'stores',   id: LS_STORE_ID } },
        variant: { data: { type: 'variants', id: LS_VARIANT_ID } },
      },
    },
  };

  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept':        'application/vnd.api+json',
      'Content-Type':  'application/vnd.api+json',
      'Authorization': `Bearer ${LS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LS checkout failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  return json?.data?.attributes?.url as string | undefined;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !validateInput(body.input)) {
    return NextResponse.json({ error: 'Invalid plan input' }, { status: 400 });
  }

  const input = body.input as SurvivalPlanInput;

  try {
    const checkoutUrl = await createLemonSqueezyCheckout(input);
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
