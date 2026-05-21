import { NextRequest, NextResponse } from 'next/server';
import { renderSurvivalPlanPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';
import type { SurvivalPlanInput } from '@/lib/survivalPlan/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY;

async function fetchOrderInputs(orderId: string): Promise<SurvivalPlanInput | null> {
  if (!LS_API_KEY) return null;

  const res = await fetch(`https://api.lemonsqueezy.com/v1/orders/${orderId}`, {
    headers: {
      'Accept':        'application/vnd.api+json',
      'Authorization': `Bearer ${LS_API_KEY}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`LS order fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const customData = json?.data?.attributes?.first_order_item?.custom_data
    ?? json?.data?.attributes?.checkout_data?.custom;
  const planInputRaw = customData?.plan_input;
  if (!planInputRaw) return null;

  try {
    return JSON.parse(planInputRaw) as SurvivalPlanInput;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  try {
    const input = await fetchOrderInputs(orderId);
    if (!input) {
      return NextResponse.json({ error: 'Order not found or missing plan input' }, { status: 404 });
    }

    const zone = getGrowingZoneFromZip(input.zipCode) ?? '6a';
    const frostDates = getFrostDatesByZone(zone, input.zipCode);
    const { buffer } = await renderSurvivalPlanPdf(input, frostDates);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="survival-garden-plan-${orderId}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[regenerate]', err);
    return NextResponse.json({ error: 'Failed to regenerate plan' }, { status: 500 });
  }
}
