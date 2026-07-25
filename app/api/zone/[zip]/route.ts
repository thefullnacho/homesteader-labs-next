import { NextResponse } from "next/server";
import { getGrowingZoneFromZip } from "@/lib/zoneLookup";

// ZIP → hardiness zone. Exists so client code can reach the vendored PRISM
// table without pulling ~529KB into the browser bundle.
//
// The table is static and only changes when USDA republishes the map, roughly
// once a decade, so responses are immutable for caching purposes.

export const dynamic = "force-static";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ zip: string }> }
) {
  const { zip } = await ctx.params;
  const cleaned = zip?.trim().slice(0, 5) ?? "";

  if (!/^\d{5}$/.test(cleaned)) {
    return NextResponse.json(
      { error: "Expected a 5-digit ZIP code" },
      { status: 400 }
    );
  }

  const zone = getGrowingZoneFromZip(cleaned);

  if (!zone) {
    // Not an error: PRISM does not cover every ZIP.
    return NextResponse.json(
      { zip: cleaned, zone: null, source: "PRISM 2023" },
      { status: 404, headers: { "Cache-Control": "public, max-age=86400" } }
    );
  }

  return NextResponse.json(
    { zip: cleaned, zone, source: "PRISM 2023" },
    {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
