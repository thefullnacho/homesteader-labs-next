// ZIP → USDA plant hardiness zone, from the vendored PRISM 2023 table.
//
// This replaced a 10-bucket estimator keyed on the first three ZIP digits, which
// was wrong for every city it had been tested against (06385 returned 5b against
// a true 7a; NYC, Cambridge, Chapel Hill, Seattle and Beverly Hills were all off
// by a half or full zone). The old tests asserted those wrong values, so they
// passed and held the error in place.
//
// SERVER ONLY. The table is ~529KB and must not reach a client bundle. Client
// code should call /api/zone/[zip] instead. Do not import this module from a
// "use client" file.
//
// Source: PRISM Climate Group, Oregon State University
//   https://prism.oregonstate.edu/phzm/  (phzm_{us,ak,hi,pr}_zipcode_2023.csv)
// Per PRISM's terms, this is not the official USDA Plant Hardiness Zone Map.
// Regenerate by re-downloading those four CSVs and rebuilding the JSON.

import zipZones from "@/content/zones/usda-2023-zip-zones.json";

const ZONES = zipZones as Record<string, string>;

/** Every zone present in the table, e.g. "5b". Ordered numerically, then a before b. */
export const ALL_ZONES: readonly string[] = Object.freeze(
  [...new Set(Object.values(ZONES))].sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    return na !== nb ? na - nb : a.localeCompare(b);
  })
);

/**
 * Returns the USDA hardiness zone for a ZIP, or undefined if the ZIP is not in
 * the PRISM dataset. PRISM does not cover every US ZIP (PO-box-only and some
 * newly issued ZIPs are absent), so undefined is a normal result rather than an
 * error. Accepts ZIP+4 and reads the first five digits.
 */
export function getGrowingZoneFromZip(zipCode: string): string | undefined {
  if (typeof zipCode !== "string") return undefined;
  const zip = zipCode.trim().slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return undefined;
  return ZONES[zip];
}

/** Number of ZIPs in the table. Exposed for the data-integrity test. */
export function getZoneTableSize(): number {
  return Object.keys(ZONES).length;
}
