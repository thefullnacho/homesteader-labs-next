import { NextResponse } from "next/server";
import { pestCrops } from "@/lib/pestData";

// Per-crop pest emergence thresholds and companion plantings.
//
// Two things here are deliberately in the response rather than inferred by the
// caller. `alertable` says whether a pest has a real emergence event to predict
// at all: aphids and nematodes do not, so anything that turns this into a
// notification has to skip them rather than fire on a soil-temp fallback all
// season. `evidenceLevel` on each companion is the same refusal in miniature,
// since "widely repeated" and "trialled" should not read the same to a machine.

export const dynamic = "force-static";

const SHARED_HEADERS = {
  "Cache-Control": "public, max-age=86400",
  "Access-Control-Allow-Origin": "*",
};

export function generateStaticParams() {
  return pestCrops.map((crop) => ({ crop: crop.cropId }));
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ crop: string }> }
) {
  const { crop } = await ctx.params;
  const cropId = crop?.trim().toLowerCase() ?? "";
  const record = pestCrops.find((entry) => entry.cropId === cropId);

  if (!record) {
    return NextResponse.json(
      {
        cropId,
        error: "No pest record for that crop",
        index: "/api/pests/",
      },
      { status: 404, headers: SHARED_HEADERS }
    );
  }

  return NextResponse.json(
    {
      cropId: record.cropId,
      terms: "https://homesteaderlabs.com/data/",
      pests: record.pests,
    },
    { headers: SHARED_HEADERS }
  );
}
