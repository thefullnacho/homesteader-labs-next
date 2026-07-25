# Pest alert feed, spec

Zone-level pest emergence windows, published as subscribable calendar feeds. Drafted 2026-07-24.

## What it is

A `.ics` feed per growing zone. A user adds the URL to Google Calendar, Apple Calendar or Outlook,
and pest emergence windows appear in their calendar automatically, refreshing every season without
any further action.

Not an email list. Not an app. A URL.

## Constraints it must satisfy

1. **Zero personal data.** No email, no account, no per-user storage. The user subscribes by
   pasting a URL; we never learn who they are. This is what makes the feature compatible with the
   privacy claims in `app/privacy/page.tsx`.
2. **No client-side analytics.** Interest is measured server-side from request counts.
3. **No database.** See "Idempotency by derivation" below, which removes the need for one.
4. **Zone-level geography only.** Never ZIP. A zone spans enough territory to be non-identifying.

## Blocker: the GDD model is wrong today

This must be fixed before anything else, because it is the core calculation.

`lib/plantingIndex.ts:138` `calculateGDD` sums the **next 14 forecast days**:

```js
forecast.slice(0, 14).forEach((day) => {
  const avgTemp = (day.maxTemp + day.minTemp) / 2;
  if (avgTemp > baseTemp) totalGDD += avgTemp - baseTemp;
});
return { current: Math.round(totalGDD), target: 200, percentage };
```

It returns that forward sum as `current`. Then
`app/tools/caloric-security/companions/page.tsx:402` passes it as both arguments:

```js
getPressureLabel(pressure, pest.gddThreshold, forecastGDD, forecastGDD)
//                                            ^current      ^forecast
```

So `getDaysUntilPestActive` computes `remaining = gddThreshold - currentGDD` where `currentGDD` is
a two-week forward sum rather than accumulation since spring. With thresholds of 100 to 150 and a
summer fortnight easily exceeding 200, `remaining` goes negative, the function returns `null`, and
the "~N d by GDD" label silently never appears. In spring it renders a number that compares two
incompatible quantities.

**Pest emergence needs GDD accumulated from a biofix date**, conventionally January 1st or March 1st,
summed daily to today. That is a different function and it needs historical weather.

The plumbing exists: `lib/weatherApi.ts:535` already calls
`https://archive-api.open-meteo.com/v1/archive`. It is currently used for a ±15-day comparison
window and would need widening to a Jan-1-to-today range.

### Correct model

```
GDD_day  = max(0, (Tmax + Tmin) / 2 - Tbase)
GDD_accum = Σ GDD_day  from biofix to today
```

Decisions to lock before implementing:

- **Base temperature.** 50°F is the common default and matches the current code, but some pests are
  modelled at 39.2°F. Pick per pest, store it alongside the threshold, do not assume one base.
- **Biofix date.** January 1st is simplest and most commonly published. Record which one each
  threshold assumes, since a threshold is meaningless without its biofix.
- **Upper cutoff.** Many extension models cap the daily average (e.g. 86°F) because development
  does not accelerate past it. Decide whether to implement the cap or document its absence.
- **Zone representative point.** A zone is an area, not a coordinate. Pick one representative
  lat/lon per zone and say so on the page, or the number is unfalsifiable.

## Pest selection

**Selection criterion is not search volume.** It is whether the pest has a *discrete emergence
event* that GDD predicts. Aphids are the highest-volume term we found (821/wk on Bing) and the
worst possible fit: they accumulate rather than emerge, which is why they got a content piece
instead (`content/archive/aphid-control-plan.mdx`).

The existing data already encodes this distinction. In `content/crops/pest-companions.json`, every
pest with a discrete emergence carries a `gddThreshold` and every aphid entry leaves it `undefined`.

Candidates, in order:

| Pest | Bing vol/wk | Fit | Existing threshold |
|---|---|---|---|
| Squash vine borer | 56 | sharp emergence, classic "found out too late" | none in data |
| Japanese beetle | 536 | sharp, well documented | none in data |
| Colorado potato beetle | 47 | well documented | `100` |
| Cabbage worm | 23 | reasonable | `100` |
| Squash bug | 134 | moderate | none in data |

**Every threshold needs sourcing before launch.** The two values already in the file (`100` for
both colorado-beetle and cabbage-worm, `150` for hornworm) are certainly not base-50-from-Jan-1
figures: Waterford CT stands at 1608 GDD on 25 July, so a threshold of 100 would have been crossed
in April and the tool would call every pest active all summer. Treat them as unverified.

Sourced so far, both base 50°F accumulated from January 1:

| Pest | Threshold | Upper cutoff | Note |
|---|---|---|---|
| Squash vine borer | **900 to 1000** | not specified | genuine disagreement between sources; use both ends as the window |
| Japanese beetle | **1030** | **100°F** | sources converge; emergence *continues* to 2150 GDD |

Two things this settled. The published sources agree on the frame, base 50 accumulated from
January 1, so there is no unit conversion to untangle and a spread like 900-to-1000 is real
disagreement rather than the same figure in different units. And the upper cutoff is per pest
(100°F for Japanese beetle, not the 86°F assumed earlier), so it must be stored alongside each
threshold rather than applied globally.

Japanese beetle's 1030-to-2150 span is not uncertainty. It is a genuinely protracted emergence of
roughly two months, and it should be presented as an activity period rather than folded into the
window.

Still to source: Colorado potato beetle, cabbage worm, squash bug.

## Architecture: no cron, no storage

The naive design is a daily cron that checks thresholds and sends. It needs a scheduler, and it
needs to remember what it already sent, which means a database.

**Neither is necessary, because the feed is a pure function of weather history.**

Serve the `.ics` from a route handler that computes the current season's windows on request:

```
app/feeds/pests/[zone]/route.ts   ->   text/calendar
```

Each poll recomputes from archive weather plus forecast and emits the events. A calendar client
polling daily always sees current data. There is nothing to schedule and nothing to store.

### Idempotency by derivation

Because the crossing date is derived rather than recorded, running the calculation twice yields the
same answer. There is no "did I already send this" flag, so there is no state to drift.

### Caching

Recomputing six months of daily GDD per request is wasteful. Use route segment revalidation
(`export const revalidate = 86400`) so the feed regenerates daily and serves cheaply in between.

## Event shape

One `VEVENT` per pest per season. Emit a **window**, never a point:

```
SUMMARY:     Squash vine borer window (zone 6b)
DTSTART;VALUE=DATE:  <date the LOW published threshold is crossed>
DTEND;VALUE=DATE:    <date the HIGH published threshold is crossed>
DESCRIPTION: Sources put emergence between 900 and 1000 GDD (base 50F, from
             Jan 1). Your area crossed 900 on Jun 26. Scout stem bases now.
             Sources: <extension link>, <extension link>
URL:         https://homesteaderlabs.com/pests/squash-vine-borer/zone-6b/
```

**Window width is derived, never a fixed number of days.** The original draft of this spec said
"crossing date + 10 days", which was an invented hedge. Measured against real data, the published
900-to-1000 GDD spread for squash vine borer converts to:

```
  Waterford CT     900 Jun 26 -> 1000 Jul 01   =  5 days
  Minneapolis MN   900 Jun 26 -> 1000 Jun 30   =  4 days
  Raleigh NC       900 May 04 -> 1000 May 11   =  7 days
```

because the day-cost of 100 GDD depends entirely on the local accumulation rate:

```
  Waterford, April   2.9 GDD/day   100 GDD = 34 days
              May    9.1 GDD/day   100 GDD = 11 days
              June  20.6 GDD/day   100 GDD =  5 days
              July  23.9 GDD/day   100 GDD =  4 days
```

The same uncertainty is nearly seven times wider in spring than in midsummer, so any fixed day
count is wrong by construction. Take both published thresholds, run each through
`findThresholdCrossing` against the subscriber's own series, and let the dates fall where they fall.
The window is then exactly the range the sources disagree over, which is defensible and citable.

Never promise a single date. Where sources agree on one threshold, the window collapses to a day
and any protracted emergence period is shown separately (see Japanese beetle below).

Include the accumulated figure and the source link in every description, so the claim is checkable
from inside the calendar without visiting the site.

## Measurement

Server-side only. A subscribed calendar polls on a schedule, so **request counts measure sustained
subscribers**, which is a better signal than a click. Someone who subscribed and kept it is visible;
someone who clicked once and lost interest fades from the count.

Caveat: with revalidation, cache hits will not invoke the function. Count at the **edge request**
level in Vercel observability rather than function invocations, or the numbers will undercount
badly.

## Dependency: zone accuracy

The feed is keyed by zone, and `lib/zoneLookup.ts` `getGrowingZoneFromZip` is currently the
10-bucket estimator that returns 5b for 06385 where the truth is 7a. **Ship the vendored USDA 2023
ZIP-to-zone table first.** A pest feed that hands someone the wrong zone's dates is worse than no
feed, and that fix is already approved and unstarted.

## SEO surface

The per-zone, per-pest pages are the third programmatic axis identified in the July keyword
research, alongside zones and states. `squash vine borer` and `japanese beetles` are searched at
their annual peak in July, and a page showing a live window for the reader's own zone is a better
answer than anything currently ranking.

The feed and the pages are the same data rendered twice. Build the calculation once.

## Phasing

1. **Fix GDD.** Accumulated-from-biofix function, widen the archive fetch, correct the companions
   page call site that passes `forecastGDD` twice.
2. **Source the thresholds.** Four or five pests, each with base temp, biofix, and a citable link.
3. **Zone table.** The approved USDA fix.
4. **Pages.** Per-zone per-pest, showing the live accumulation against the threshold.
5. **Feed.** The `.ics` route, once the pages prove the calculation reads correctly.
6. **Measure.** Edge request counts. Decide on expansion from that, not from enthusiasm.

## Open questions

- One feed per zone, or one feed per zone per pest so users can subscribe selectively? Per zone is
  simpler and probably right for v1.
- Southern zones with two generations per season: does the model emit a second window, or do we
  scope v1 to single-generation pests and say so?
- What happens in a year where the threshold is never reached? Emitting nothing is correct but
  looks broken. Consider a dated "no window forecast this season" event.
