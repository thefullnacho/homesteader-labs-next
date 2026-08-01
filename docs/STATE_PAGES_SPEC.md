# State Pages Spec

**Created:** August 1, 2026
**Status:** spec, unstarted
**Replaces:** the two-line brief at `PROGRAMMATIC_SEO_STRATEGY.md:31`
**Sequenced:** Oct-Nov 2026 in `KEYWORD_RESEARCH_2026-07.md:198`

State pages are the second programmatic axis. Zone pages shipped in `b2c7723` and cover the
`zone 7 planting calendar` shape of the demand. This document covers the
`what to plant in august in texas` shape, which the July keyword research measured as the larger
of the two.

```
what to plant in august in texas       (100)     zone 7    (54)
                        in florida      (83)     zone 6    (39)
                        in california   (80)
                        in georgia      (43)
                        in nc           (38)
```

State modifiers outrank zone modifiers on the same query. This is the higher-value half of the
programmatic plan and the half that was never built.

---

## §0 The decision this document makes

A state page is **not** a planting calendar. A state spans several zones, so a single schedule
would be wrong for most of the state's readers. The page's job is to establish the spread, help
the reader place themselves in it, and hand them to the right zone page.

That is a genuinely different page shape from a zone page, and the measurements in §1 confirm it
is a substantive one rather than a navigational stub.

---

## §1 Does a state page have unique substance?

Zone pages passed a measured bar before they were built: every crop's sow date shifts between
every adjacent zone pair, zero byte-identical data rows, 39-46% of visible text per-zone. State
pages need their own bar, because the city plan died for failing exactly this test.

**Measured** across all 51 state-level jurisdictions, joining the PRISM 2023 ZIP table against
approximate SCF prefix ranges:

| Metric | Result |
|---|---|
| Median material zone bands per state (>=2% of state ZIPs) | **4** |
| States with a single material band | **0** |
| Narrowest state | RI, 2 bands (7a 53%, 6b 45%) |
| Widest states | AZ and NV, 8 bands; AK, 13 |

Representative spread:

```
state  ZIPs   zones  >=2%  range
TX     2569   9      7     6b -> 10b
CA     2554   12     5     5b -> 11a
FL     1454   7      5     8b -> 11b
GA      937   5      4     7a -> 9a
NC     1072   6      4     6b -> 9a
VT      306   6      4     4a -> 6b
RI       88   3      2     6b -> 7b
```

**The premise holds.** No state reduces to one zone, so no state page is a redirect wearing a
hat. The zone distribution is the per-state payload, and it is different for every state: Texas
is a seven-band problem where the panhandle and the valley are three months apart, Rhode Island
is a two-band problem where the question is which half of a small state you are in. Those want
different pages, not the same page with a different H1.

The substance gate in §8 makes this a build-time assertion rather than a claim.

---

## §2 Three blockers, all found by measuring

### 2.1 There is no ZIP-to-state data in the repo

`lib/zoneLookup.ts` is `Record<zip, zone>` and nothing more. `content/zones/` holds one file. The
join that every number in §1 depends on does not exist in the codebase.

The measurements above used approximate SCF prefix ranges, which are good enough to size the
opportunity and wrong enough that they must not ship. Prefixes cross state lines in a handful of
places, and territory prefixes are folded in.

**Required:** a vendored ZIP-to-state table, same treatment as the PRISM file. Source should be
the Census ZCTA-to-state relationship file, which is public domain and authoritative. Land it at
`content/zones/zip-states.json` as `Record<zip, stateAbbr>`, with a data-integrity test mirroring
`getZoneTableSize()`.

### 2.2 Zone page coverage is short where the demand is

State pages hand readers to zone pages. `ZONE_PAGES` is 5a through 9b, which is 87.9% of US ZIPs
and was the right call for zone pages standing alone. Against states it fails unevenly:

```
state  zone-page coverage
ND       0%      MT      44%
HI       0%      SD      46%
MN      29%      CA      54%
AK      40%      WI      64%
FL      42%      WY      72%
                 VT      74%
```

**Florida is 42% covered and is the number two state query.** California is 54% and is number
three. A Florida page whose three dominant bands (10a 30%, 10b 15%, 11a 12%) all dead-end is not
shippable.

**Fix:** extend `ZONE_PAGES` to `4a, 4b, 10a, 10b`. That is four new pages and it moves national
coverage from 87.9% to **98.0%**, cutting the sub-90% state list from thirteen to five (HI, AK,
MN, ND, FL). `content/frost-zones.json` already carries normals for all four, so this costs no new
data acquisition. Hawaii and Alaska stay uncovered and should be excluded from the launch set
rather than shipped broken.

Florida's last 12% sits in 11a and 11b, which have no frost normals at all (the file stops at
10b). A frost-free tropical zone is arguably a different page anyway. Handle it as §5.6.

### 2.3 The frost normals are non-monotonic at 4a and 10a

> **FIXED 2026-08-01.** Corrected in `content/frost-zones.json`, with the invariants below locked
> by `lib/frostNormals.test.ts` (202 assertions). The audit now returns clean across all twenty
> zones. Phase 0 of §9 is done. The rest of this section is kept as the record of what was wrong.

Auditing `content/frost-zones.json` across all twenty zones, two entries invert:

```
zone  last    first   frost-free
3b    05-01   09-20      142
4a    05-10   09-15      128   <-- later last frost and a shorter season than 3b
4b    05-05   09-22      140
...
9b    01-10   12-28      352
10a   02-08   12-10      305   <-- shorter season than 9b, and 8b's exact last frost
10b   01-01   12-31      364
```

4a is colder than 3b in the data, and 10a is colder than 9b. Both are impossible. 4a duplicates
3a's last spring frost exactly, and 10a duplicates 8b's, which is the signature of a
copy-paste during data entry.

This has been latent and invisible because a zone page renders one zone and nobody can see the
neighbours. **A state page renders several bands in one table.** A Florida page would show 10a
with a shorter season than 9b directly above it, on the page targeting the number two state query.

**Both must be corrected before state pages ship,** and both are in the set §2.2 wants to promote
to full pages.

**What the correction did.** The bracketing zones were left untouched and the broken entries were
linearly interpolated between them, which keeps the repair inside the dataset's own scale rather
than importing a second source at a different calibration. A third fault surfaced during the
audit: 4b's last frost sat later than 3b's, a milder inversion of the same kind, so 4b moved with
4a. 10b also carried a stored `frostFreeDays` of 365 against a computed 364, invisible at runtime
because `getFrostDatesByZone` recomputes the field and never reads it.

```
4a   05-10 -> 04-27   last frost 13 days earlier, season 128 -> 151 days
4b   05-05 -> 04-23   last frost 12 days earlier, season 140 -> 160 days
10a  02-08 -> 01-05   last frost 34 days earlier, season 305 -> 358 days
10b  frostFreeDays 365 -> 364
```

**Blast radius: 3,332 ZIPs, 8.2% of the country, and zero shipped pages.** All three corrected
zones sit outside `ZONE_PAGES` (5a-9b), so no live static zone page moved. What did move is the
interactive planting calendar, `FieldStationContext`, and the survival garden plan for readers in
those ZIPs. Plans already delivered are unaffected; a regenerate will produce different dates.

The header of the JSON file also overclaimed. It cited NOAA 1991-2020 normals "by USDA hardiness
zone", but NOAA publishes no such product: USDA zones key on winter minimum temperature, not frost
timing, so the by-zone table is an aggregation we derived. The `_source` line now says so and a
`_caveat` states it plainly.

---

## §3 Route and URL

```
/tools/planting-calendar/state/[state]/
```

Sibling to `zone/[zone]/`, which keeps the tool's two programmatic axes visibly parallel and
reuses the existing breadcrumb spine.

**Slug is the full lowercased state name:** `/state/texas/`, not `/state/tx/`. The queries are
`what to plant in august in texas` and `in florida`. `in nc` appears in the data but as a minority
form, so abbreviations get a 308 to the full-name canonical rather than their own page.

Launch set is the **50 states**. DC is a single metro inside one zone band and belongs in the zone
system, not this one. Hawaii and Alaska are excluded until §2.2 and §5.6 resolve, which makes the
launch set **48**.

`export const dynamic = "force-static"` and `generateStaticParams`, exactly as the zone route
does. Everything on the page is a pure function of two vendored tables.

---

## §4 Data layer

New module `lib/tools/planting-calendar/statePages.ts`, mirroring `zonePages.ts` in shape and in
purity. It composes existing pieces and owns no scheduling logic of its own.

```ts
export interface StateZoneBand {
  zone: string;              // "8a"
  zipCount: number;
  share: number;             // 0..1 of the state's ZIPs
  hasPage: boolean;          // in ZONE_PAGES, so linkable
  lastSpringFrost: Date;
  firstFallFrost: Date;
  frostFreeDays: number;
}

export interface StatePageData {
  slug: string;              // "texas"
  name: string;              // "Texas"
  abbr: string;              // "TX"
  zipCount: number;
  /** Bands at >=2% of state ZIPs, coldest first. The page's spine. */
  bands: StateZoneBand[];
  /** Present but below threshold. Named in prose, never tabulated. */
  minorZones: string[];
  dominant: StateZoneBand;
  /** Days between coldest and warmest material band's last spring frost. */
  spreadDays: number;
  seasonRange: [number, number];
  /** Share of state ZIPs whose band has a zone page. Gates the honesty note. */
  coverage: number;
  shape: StateShape;
  /** Per band, what can still go in the ground. Delegates to zonePages. */
  nowSowing: (from?: Date) => Array<{ band: StateZoneBand; rows: FallSowRow[] }>;
}
```

**The 2% threshold** is the anti-noise device. Texas has nine zones present but seven that matter,
and tabulating a zone holding 0.3% of the state's ZIPs invites a reader in the other 99.7% to
follow the wrong link.

### StateShape, and why it exists

`zonePages.ts` has `seasonConstraint()`: prose that changes between zones because the constraint
genuinely changes, not because sentences were reshuffled. It is the single largest contributor to
the zone pages' per-page text share, and state pages need the same device or they will fail §8.

```ts
export interface StateShape {
  band: "narrow" | "broad" | "wide";
  headline: string;
  body: string;
}
```

Keyed on **material band count and spread in days**, which is a real structural property:

- **narrow** (1-2 bands): the state is effectively one calendar with an edge case. The advice is
  about the edge, typically elevation or coast.
- **broad** (3-4 bands): the median state. The advice is that state-level planting advice from
  local media is averaged and therefore wrong for both ends.
- **wide** (5+ bands): the state contains genuinely different agricultures. The advice is that
  the state name is useless as a gardening input and the zone is the only thing that matters.

The body must interpolate real per-state numbers (`spreadDays`, the two extreme zones, the
dominant band's share) so that two states in the same band still differ in every sentence that
carries a figure.

---

## §5 Page anatomy

Follows the paper field-notebook shell in `CLAUDE.md` and the exact section rhythm of
`zone/[zone]/page.tsx`: kraft header band, stamp row, `font-display` h1, italic serif deck,
`SectionHead` per section, mono station footer.

### 5.1 Header

- Breadcrumb: Tools / Planting Calendar / Texas
- Right-hand live fact: `{bands.length} zones, {spreadDays} days apart`
- Stamps: `{Name}`, `PRISM 2023`
- H1: `Texas Planting Calendar`
- Deck: the spread stated in one sentence, with both extreme dates.

### 5.2 §1 The spread

The page's thesis and its most defensible content. Three stat cards: coldest band and its last
frost, warmest band and its last frost, spread in days. Then the `StateShape` body in a
`card-paper`.

For Texas this reads as a 64-day spread between 6b and 10b. For Rhode Island it reads as 10 days.
That difference is the page.

### 5.3 §2 Find your zone

A ZIP input resolving against the existing `/api/zone/[zip]`, with the result linking straight to
the zone page. This is the page's actual job and it sits above the fold's second screen.

Client component, reuses the planting calendar's existing resolution path. On a zone outside
`ZONE_PAGES`, say so plainly and link the interactive tool instead of 404ing.

### 5.4 §3 What to plant now, by band

The section that earns the target query. For each material band, the band's still-sowable crops
from `getZonePageData(zone).fallSowing()`, capped at the top five by deadline, with the full list
behind the zone page link.

Presented as one table with a band column, not as N repeated tables. A reader in Texas should see
that the valley has six more weeks than the panhandle, in one glance, which is a fact no zone page
can show them.

### 5.5 §4 Zones in this state

Every material band as a row: zone, share of state, last frost, first frost, season length, link.
Minor zones named in a following sentence, unlinked.

This table is the per-state data payload and is the primary input to the §8 gate.

### 5.6 Uncovered bands

When `coverage < 1`, the page says which share of the state has no page yet and links the
interactive tool. Never a dead link, never a silent omission. For 11a and above, where no frost
normals exist, the honest line is that the band is effectively frost-free and the calendar is a
heat calendar rather than a frost one.

### 5.7 §5 Other states

Neighbouring states first, then the full list. Neighbours by shared border, hand-authored once in
the state table, since it is fifty entries and adjacency does not change.

---

## §6 Metadata and schema

```
title:       {Name} Planting Calendar: Zones, Frost Dates and What to Plant Now
description: {Name} spans zones {lo} to {hi}, a {spreadDays}-day spread in last frost.
             Find your zone by ZIP and see what still has time to finish.
canonical:   /tools/planting-calendar/state/{slug}/
```

Title must not be templated past the state name. Interpolate `spreadDays` and the band count into
the description so no two descriptions match.

JSON-LD via the existing helpers in `lib/schema.ts`: `breadcrumbList` plus a `WebPage` node, same
as the zone route. Add a `spatialCoverage` of type `State`. Do **not** use `LocalBusiness`, which
the superseded city plan reached for and which we do not qualify as.

---

## §7 Internal linking and sitemap

- State page links to every material band's zone page. Roughly 4 outbound links each.
- Zone page gains a reciprocal section: "states where {zone} is a major band", capped at eight.
  This is the link equity payoff and it is why both axes are worth more together than apart.
- Index at `/tools/planting-calendar/state/`, mirroring `47303b3`, linking all 48.
- `app/sitemap.ts` gains `STATE_PAGES` alongside `ZONE_PAGES`, same no-lastmod treatment, since
  the data is fixed normals rather than dated content.

---

## §8 The substance gate

**This is the gate that the city plan would have failed, and it is a test, not a review step.**
Add to `statePages.test.ts`, failing the build:

1. **No two state pages share a band table.** For every pair, the set of `(zone, share rounded to
   whole percent)` tuples must differ. A collision means two pages will render identical §5.5
   tables and at least one of them should not exist.
2. **Per-state text share >= 35%.** Compute rendered visible text, subtract the tokens common to
   all fifty, assert the remainder clears the bar. Zones measured 39-46%; 35% is the floor.
3. **Every material band resolves.** Either `hasPage` is true, or the page renders the §5.6
   fallback. No band is silently dropped.
4. **Monotonicity.** Within a state, bands sorted coldest to warmest must have monotonically
   non-decreasing `frostFreeDays`. This is the regression test for §2.3 and it is the assertion
   that would have caught 4a and 10a years ago.

If a state fails 1 or 2, it does not ship. Fewer good pages beats a complete set, which is the
whole lesson of the city plan.

---

## §9 Sequencing

| Phase | Work | Gate |
|---|---|---|
| ~~0~~ | ~~Fix 4a and 10a frost normals, own commit~~ **DONE 2026-08-01** | ~~§8.4 passes on existing zones~~ green |
| 1 | Vendor Census ZCTA-to-state, add integrity test | join covers >=99% of PRISM ZIPs |
| 2 | Extend `ZONE_PAGES` to 4a, 4b, 10a, 10b | national coverage 98%, FL to 88% |
| 3 | `statePages.ts` plus `StateShape`, unit tested | pure, no page yet |
| 4 | Route, index, sitemap, schema | §8 green on all 48 |
| 5 | Reciprocal links on zone pages | |

Phases 0 through 2 are prerequisites and none of them are state page work as such. That is the
honest cost of this feature: roughly a third of it is repairing and widening the zone layer
underneath.

---

## §10 Open decisions

1. **48 states or fewer at launch.** The spec says ship all 48 that pass §8. The alternative is a
   ten-state pilot on the states the keyword data names (TX, FL, CA, GA, NC and neighbours),
   proving indexation before committing the rest. The pilot is the more conservative read of the
   city-plan lesson and costs one sprint of delay.
2. **Whether 11a/11b earn frost normals** or whether tropical Florida and Hawaii get a different
   page type entirely. Deferred, and it caps Florida at 88%.
3. **ZIP count as a proxy for readership.** Share-of-ZIPs is an area-weighted measure and biases
   toward rural bands, since urban ZIPs are small. A population weighting would rank bands
   differently in states like California. The 2% threshold is doing real work here and may need
   raising once GSC shows which bands readers actually land on.

---

## §11 Out of scope

City pages. They remain dead for the reasons in the superseded banner, and state pages do not
revive them. A state page linking to zone pages is a hierarchy. A state page linking to 500 city
pages that each restate the same zone schedule is the doorway set Google judges as a set.
