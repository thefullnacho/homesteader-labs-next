import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderSurvivalPlanPreviewPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { getGrowingZoneFromZip } from '@/lib/zoneLookup';
import type { SurvivalPlanInput } from '@/lib/survivalPlan/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const audienceId = process.env.RESEND_AUDIENCE_ID;

export async function POST(req: NextRequest) {
  const { zipCode, email } = await req.json();

  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    return NextResponse.json({ error: 'Valid 5-digit ZIP required' }, { status: 400 });
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const zone = getGrowingZoneFromZip(zipCode) ?? '6a';
  const frostDates = getFrostDatesByZone(zone, zipCode);

  const input: SurvivalPlanInput = {
    zipCode,
    adults: 2,
    kids: 1,
    dietaryRestrictions: [],
    squareFeet: 200,
    gardenType: 'in-ground',
    goal: 'max-calories',
    experience: 'intermediate',
    excludedCropIds: [],
  };

  try {
    const { buffer } = await renderSurvivalPlanPreviewPdf(input, frostDates);

    if (resend && audienceId) {
      try {
        await resend.contacts.create({ email, audienceId, unsubscribed: false });
      } catch (err) {
        console.warn('[preview] contact add failed', err);
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="survival-garden-preview-${zipCode}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[preview]', err);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
