import { NextResponse } from "next/server";
import { pestCrops } from "@/lib/pestData";

// Index of the pest-emergence table. Lists which crops are covered and which
// pests carry a real emergence threshold, so a caller can decide what to fetch
// without pulling every record.
//
// The per-crop detail lives at /api/pests/[crop].

export const dynamic = "force-static";

const SHARED_HEADERS = {
  "Cache-Control": "public, max-age=86400",
  "Access-Control-Allow-Origin": "*",
};

export async function GET() {
  const crops = pestCrops.map((crop) => ({
    cropId: crop.cropId,
    href: `/api/pests/${crop.cropId}/`,
    pests: crop.pests.map((pest) => ({
      name: pest.name,
      alertable: pest.alertable !== false,
      basis:
        "gddThreshold" in pest && pest.gddThreshold
          ? "growing-degree-days"
          : "soil-temperature",
    })),
  }));

  return NextResponse.json(
    {
      dataset: "pest-companions",
      description:
        "Phenology-aware pest emergence thresholds and evidence-rated companion plantings, per crop.",
      terms: "https://homesteaderlabs.com/data/",
      cropCount: crops.length,
      crops,
    },
    { headers: SHARED_HEADERS }
  );
}
