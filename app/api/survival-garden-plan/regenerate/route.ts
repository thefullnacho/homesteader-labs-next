import { NextRequest, NextResponse } from 'next/server';
import { renderSurvivalPlanPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';
import type { SurvivalPlanInput } from '@/lib/survivalPlan/types';
import { stripe, decodePlanInputFromMetadata } from '@/lib/survivalPlan/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fetchOrderInputs(orderId: string): Promise<SurvivalPlanInput | null> {
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(orderId);
    // Only honor downloads for completed payments.
    if (session.payment_status !== 'paid') return null;
    return decodePlanInputFromMetadata(session.metadata);
  } catch (err) {
    // Invalid/unknown session id → treat as not found.
    if (err && typeof err === 'object' && (err as { statusCode?: number }).statusCode === 404) {
      return null;
    }
    throw err;
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
