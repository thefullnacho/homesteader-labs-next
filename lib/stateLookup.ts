// ZIP → US state, from the vendored Census ZCTA table.
//
// Exists for the state pages (docs/STATE_PAGES_SPEC.md). Zone pages need only
// the zone; a state page needs to know which zones fall inside a state and in
// what proportion, and nothing in the repo could answer that before this.
//
// SERVER ONLY. The table is ~523KB and must not reach a client bundle, the same
// rule and the same reason as lib/zoneLookup.ts. Client code should call an API
// route. Do not import this module from a "use client" file.
//
// Source: US Census Bureau 2020 ZCTA-to-county relationship file (public domain)
//   https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/
//     tab20_zcta520_county20_natl.txt
// State is taken from the first two digits of GEOID_COUNTY_20. A ZCTA can
// straddle a state line (137 of them do), and those are attributed to whichever
// state holds the most of the ZCTA's land area, per AREALAND_PART.
//
// Two-tier resolution, because ZCTAs do not cover every ZIP:
//   82.7% of PRISM ZIPs resolve directly against a ZCTA.
//   16.8% resolve by SCF prefix, that is the first three digits. The prefix
//         table is derived from the ZCTA join itself rather than hand-entered,
//         and 879 of its 896 prefixes are unambiguous; the seventeen that are
//         not disagree by a single ZIP on a state border.
//   0.58% (233 ZIPs) do not resolve at all and return undefined. They sit in
//         21 prefixes that are entirely PO-box or single-entity and therefore
//         have no ZCTA anywhere: 885 (El Paso), 942 (Sacramento state offices),
//         332, 569, 311 and similar. Nearest-prefix guessing was rejected here,
//         since 885 borders New Mexico's 870-884 range and would resolve to the
//         wrong state.
//
// The table is keyed to exactly the PRISM ZIP set, so every ZIP with a zone has
// a state entry or is one of the documented 233. Enforced by stateLookup.test.ts.

import zipStates from "@/content/zones/zip-states.json";

const STATES = zipStates as Record<string, string>;

/** Every jurisdiction present in the table: 50 states, DC and PR. */
export const ALL_STATES: readonly string[] = Object.freeze(
  [...new Set(Object.values(STATES))].sort()
);

/**
 * Returns the two-letter state for a ZIP, or undefined when the ZIP is absent
 * from the table. Undefined is a normal result, not an error: see the header
 * for the 233 ZIPs that legitimately have no state. Accepts ZIP+4 and reads the
 * first five digits.
 */
export function getStateFromZip(zipCode: string): string | undefined {
  if (typeof zipCode !== "string") return undefined;
  const zip = zipCode.trim().slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return undefined;
  return STATES[zip];
}

/** Every ZIP attributed to a state, ascending. Empty for an unknown state. */
export function getZipsForState(state: string): string[] {
  const want = state.toUpperCase();
  return Object.keys(STATES).filter((z) => STATES[z] === want).sort();
}

/** Number of ZIPs in the table. Exposed for the data-integrity test. */
export function getStateTableSize(): number {
  return Object.keys(STATES).length;
}
