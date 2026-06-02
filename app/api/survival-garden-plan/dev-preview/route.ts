import { NextRequest, NextResponse } from 'next/server';
import { renderSurvivalPlanPdf } from '@/lib/survivalPlan/generator';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import type { SurvivalPlanInput } from '@/lib/survivalPlan/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEV_INPUTS: Record<string, SurvivalPlanInput> = {
  '6a': {
    zipCode: '04401',
    adults: 2,
    kids: 2,
    dietaryRestrictions: [],
    squareFeet: 200,
    gardenType: 'in-ground',
    goal: 'max-calories',
    experience: 'intermediate',
    excludedCropIds: [],
  },
  '8b': {
    zipCode: '30301',
    adults: 2,
    kids: 0,
    dietaryRestrictions: [],
    squareFeet: 400,
    gardenType: 'raised',
    goal: 'preservation',
    experience: 'advanced',
    excludedCropIds: [],
  },
};

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev preview disabled in production' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const zone = (searchParams.get('zone') ?? '6a').toLowerCase();
  const input = DEV_INPUTS[zone] ?? DEV_INPUTS['6a'];
  const frostDates = getFrostDatesByZone(zone, input.zipCode);

  try {
    const { buffer } = await renderSurvivalPlanPdf(input, frostDates);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="survival-garden-plan-${zone}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[dev-preview]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
