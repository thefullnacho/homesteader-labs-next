// The hand-authored half of the state pages: name, slug and land neighbours.
//
// Everything else about a state page is derived from the two vendored tables
// (PRISM zones, Census ZIP-to-state). This file holds only what no dataset in
// the repo can answer, and it is deliberately separate from statePages.ts so
// that the derived layer stays reviewable without scrolling past fifty rows.
//
// Neighbours are shared land borders, authored once because adjacency does not
// change. They drive the "other states" section (spec §5.7): a reader who has
// just learned their state spans four zones is well served by the state next
// door, and badly served by an alphabetical list starting at Alabama.
//
// Alaska and Hawaii are present in the table but excluded from STATE_PAGES:
// both sit largely outside the zones that have pages, and Hawaii is mostly
// 11a and warmer, where there are no frost normals at all. DC and PR are
// absent by design. DC is a single metro inside one zone band and belongs to
// the zone system, not this one.
//
// Slug is the full lowercased name, per spec §3: the queries are "what to
// plant in august in texas", not "in tx".

export interface StateEntry {
  abbr: string;
  name: string;
  slug: string;
  /** Two-letter codes of states sharing a land border, alphabetical. */
  neighbours: readonly string[];
}

export const STATE_TABLE: readonly StateEntry[] = [
  { abbr: "AL", name: "Alabama", slug: "alabama", neighbours: ["FL", "GA", "MS", "TN"] },
  { abbr: "AK", name: "Alaska", slug: "alaska", neighbours: [] },
  { abbr: "AZ", name: "Arizona", slug: "arizona", neighbours: ["CA", "CO", "NM", "NV", "UT"] },
  { abbr: "AR", name: "Arkansas", slug: "arkansas", neighbours: ["LA", "MO", "MS", "OK", "TN", "TX"] },
  { abbr: "CA", name: "California", slug: "california", neighbours: ["AZ", "NV", "OR"] },
  { abbr: "CO", name: "Colorado", slug: "colorado", neighbours: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"] },
  { abbr: "CT", name: "Connecticut", slug: "connecticut", neighbours: ["MA", "NY", "RI"] },
  { abbr: "DE", name: "Delaware", slug: "delaware", neighbours: ["MD", "NJ", "PA"] },
  { abbr: "FL", name: "Florida", slug: "florida", neighbours: ["AL", "GA"] },
  { abbr: "GA", name: "Georgia", slug: "georgia", neighbours: ["AL", "FL", "NC", "SC", "TN"] },
  { abbr: "HI", name: "Hawaii", slug: "hawaii", neighbours: [] },
  { abbr: "ID", name: "Idaho", slug: "idaho", neighbours: ["MT", "NV", "OR", "UT", "WA", "WY"] },
  { abbr: "IL", name: "Illinois", slug: "illinois", neighbours: ["IA", "IN", "KY", "MO", "WI"] },
  { abbr: "IN", name: "Indiana", slug: "indiana", neighbours: ["IL", "KY", "MI", "OH"] },
  { abbr: "IA", name: "Iowa", slug: "iowa", neighbours: ["IL", "MN", "MO", "NE", "SD", "WI"] },
  { abbr: "KS", name: "Kansas", slug: "kansas", neighbours: ["CO", "MO", "NE", "OK"] },
  { abbr: "KY", name: "Kentucky", slug: "kentucky", neighbours: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"] },
  { abbr: "LA", name: "Louisiana", slug: "louisiana", neighbours: ["AR", "MS", "TX"] },
  { abbr: "ME", name: "Maine", slug: "maine", neighbours: ["NH"] },
  { abbr: "MD", name: "Maryland", slug: "maryland", neighbours: ["DE", "PA", "VA", "WV"] },
  { abbr: "MA", name: "Massachusetts", slug: "massachusetts", neighbours: ["CT", "NH", "NY", "RI", "VT"] },
  { abbr: "MI", name: "Michigan", slug: "michigan", neighbours: ["IN", "OH", "WI"] },
  { abbr: "MN", name: "Minnesota", slug: "minnesota", neighbours: ["IA", "ND", "SD", "WI"] },
  { abbr: "MS", name: "Mississippi", slug: "mississippi", neighbours: ["AL", "AR", "LA", "TN"] },
  { abbr: "MO", name: "Missouri", slug: "missouri", neighbours: ["AR", "IA", "IL", "KS", "KY", "NE", "OK", "TN"] },
  { abbr: "MT", name: "Montana", slug: "montana", neighbours: ["ID", "ND", "SD", "WY"] },
  { abbr: "NE", name: "Nebraska", slug: "nebraska", neighbours: ["CO", "IA", "KS", "MO", "SD", "WY"] },
  { abbr: "NV", name: "Nevada", slug: "nevada", neighbours: ["AZ", "CA", "ID", "OR", "UT"] },
  { abbr: "NH", name: "New Hampshire", slug: "new-hampshire", neighbours: ["MA", "ME", "VT"] },
  { abbr: "NJ", name: "New Jersey", slug: "new-jersey", neighbours: ["DE", "NY", "PA"] },
  { abbr: "NM", name: "New Mexico", slug: "new-mexico", neighbours: ["AZ", "CO", "OK", "TX", "UT"] },
  { abbr: "NY", name: "New York", slug: "new-york", neighbours: ["CT", "MA", "NJ", "PA", "VT"] },
  { abbr: "NC", name: "North Carolina", slug: "north-carolina", neighbours: ["GA", "SC", "TN", "VA"] },
  { abbr: "ND", name: "North Dakota", slug: "north-dakota", neighbours: ["MN", "MT", "SD"] },
  { abbr: "OH", name: "Ohio", slug: "ohio", neighbours: ["IN", "KY", "MI", "PA", "WV"] },
  { abbr: "OK", name: "Oklahoma", slug: "oklahoma", neighbours: ["AR", "CO", "KS", "MO", "NM", "TX"] },
  { abbr: "OR", name: "Oregon", slug: "oregon", neighbours: ["CA", "ID", "NV", "WA"] },
  { abbr: "PA", name: "Pennsylvania", slug: "pennsylvania", neighbours: ["DE", "MD", "NJ", "NY", "OH", "WV"] },
  { abbr: "RI", name: "Rhode Island", slug: "rhode-island", neighbours: ["CT", "MA"] },
  { abbr: "SC", name: "South Carolina", slug: "south-carolina", neighbours: ["GA", "NC"] },
  { abbr: "SD", name: "South Dakota", slug: "south-dakota", neighbours: ["IA", "MN", "MT", "NE", "ND", "WY"] },
  { abbr: "TN", name: "Tennessee", slug: "tennessee", neighbours: ["AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"] },
  { abbr: "TX", name: "Texas", slug: "texas", neighbours: ["AR", "LA", "NM", "OK"] },
  { abbr: "UT", name: "Utah", slug: "utah", neighbours: ["AZ", "CO", "ID", "NM", "NV", "WY"] },
  { abbr: "VT", name: "Vermont", slug: "vermont", neighbours: ["MA", "NH", "NY"] },
  { abbr: "VA", name: "Virginia", slug: "virginia", neighbours: ["KY", "MD", "NC", "TN", "WV"] },
  { abbr: "WA", name: "Washington", slug: "washington", neighbours: ["ID", "OR"] },
  { abbr: "WV", name: "West Virginia", slug: "west-virginia", neighbours: ["KY", "MD", "OH", "PA", "VA"] },
  { abbr: "WI", name: "Wisconsin", slug: "wisconsin", neighbours: ["IA", "IL", "MI", "MN"] },
  { abbr: "WY", name: "Wyoming", slug: "wyoming", neighbours: ["CO", "ID", "MT", "NE", "SD", "UT"] },
] as const;

const BY_ABBR = new Map(STATE_TABLE.map((s) => [s.abbr, s]));
const BY_SLUG = new Map(STATE_TABLE.map((s) => [s.slug, s]));

export function stateByAbbr(abbr: string): StateEntry | undefined {
  return BY_ABBR.get(abbr.toUpperCase());
}

export function stateBySlug(slug: string): StateEntry | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}
