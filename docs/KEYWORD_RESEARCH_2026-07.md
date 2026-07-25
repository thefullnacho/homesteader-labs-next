# Keyword research, July 2026

Cross-validated pull across Bing Webmaster Tools and Google Trends, run 2026-07-24.
Companion to `PROGRAMMATIC_SEO_STRATEGY.md`, which this data largely vindicates.

## Methodology and how to read it

**Two sources, deliberately.** Neither is trustworthy alone.

| | Bing Webmaster API | Google Trends |
|---|---|---|
| Access | `BING_WEBMASTER_API_KEY` in `.env.local`, site verified as apex | unofficial widget endpoint, needs a cookie jar |
| Units | broad-match impressions per week, absolute | 0-100, relative within a comparison set |
| Window | last ~6 months, weekly | 5 years, weekly (262 points) |
| Good for | absolute size, "is this term big" | seasonality, multi-year trend, discovery |
| Blind spot | ~3-4% of US search, so long tail vanishes | no absolute volume, ever |

**Three rules for reading anything below.**

1. **Trends values compare only within their own set.** A 55 in the mesh block and a 58 in the
   monthly block are unrelated numbers. Never rank across blocks.
2. **A Bing zero is not a real zero.** 32 of 72 terms in the main pull returned nothing, and they
   were overwhelmingly long-tail or problem-framed. Bing's floor looks like 10-15 impressions/week.
   Absence of data is not absence of demand.
3. **Bing rate-limits gently, Google Trends does not.** The Trends endpoint starts returning HTML
   error pages after roughly 6 comparison sets. Back off to 5s between widget calls and 12s
   between sets, and refresh the cookie jar when it starts failing.

`GetRelatedKeywords` on the Bing API returned zero results for every seed tried. Treat it as dead.
All keyword discovery below came from Google Trends related-queries.

## Finding 1: our tool naming is fine, the modifier is what matters

This one reversed on cross-validation, which is the reason to run two sources.

Bing showed `garden planner` at roughly 6x `planting calendar` and I nearly recommended renaming the
tool. Google shows them level:

```
garden planner       peak 50 (Apr)    5yr avg 25 -> 36   RISING
planting calendar    peak 50 (Mar)    5yr avg 23 -> 33   RISING
```

Same peak, same trajectory. The 6x was Bing sample thinness. **Do not rename the tool.**

The intent lives in the modifiers instead:

```
garden planner free            (100)  <- top related query for the head term
garden planner app              (43)
vegetable garden planner        (39)
ai garden planner          Breakout
free garden planner app        (+50%)
planting calendar by zip code (+150%)
```

`free` is the number one modifier and our tool is free with no login. That is the wedge, and it is
a copy change rather than a rebuild. `planting calendar by zip code` rising +150% is precisely the
ZIP to zone to frost-date flow we already ship.

## Finding 2: meshtastic is the strongest signal in the entire dataset

```
meshtastic         5yr avg  1 -> 55    RISING
garmin inreach             23 -> 34    RISING
gmrs radio                 11 -> 21    RISING
```

A 55x rise over five years, now above `gmrs radio` and tracking with `garmin inreach` inside the
same comparison set. This is not a fad curve.

**But the bare term is navigational.** On Bing, `meshtastic` alone is 1720 impressions/week while
every modifier combined totals roughly 250. People type it to reach meshtastic.org. We will not
outrank the official project for it and the traffic would not convert.

The opportunity is in the breakouts and the neighbours:

```
what is meshtastic     Breakout   <- explainer, top of funnel
meshtastic devices     Breakout
heltec v3              Breakout   <- we sell this
meshcore               Breakout
meshtastic repeater    Breakout
meshtastic mqtt        Breakout
```

Every problem-framed phrasing returned nothing on Bing: `off grid texting`,
`communicate without cell service`, `emergency communication without cell service`,
`shtf communication`, `prepper communication`, `long range communication device`. Combined with
`gmrs radio`'s top related query being `ham radio` (100), the pattern is clear: **this category is
navigated by brand name, not by problem.** Nobody searches for the need, they search for products
they already know.

That makes comparison content the winnable surface. Not "how to communicate off grid" but
meshtastic vs GMRS, vs inReach, vs Baofeng. Baofeng alone is 1058/wk on Bing, inReach 651.

## Finding 3: autumn is real, but it is gardening, not foraging

```
fall garden                peak 58 (Sep)    19 -> 32   RISING
what to plant in august    peak 18 (Aug)     2 ->  5   RISING
mushroom foraging          peaks Sep-Oct
what to forage             FLAT all year     1 ->  5   RISING
```

`what to forage` is flat across all twelve months. That undercuts the seasonal premise behind a
monthly foraging series: foraging demand is growing but it is not seasonal at the query level.
`fall garden` is the genuine autumn term and it is climbing fast.

Geographic and zone modifiers dominate the August query:

```
what to plant in august in texas       (100)
                        in florida      (83)
                        in california   (80)
                        zone 7          (54)
                        zone 6          (39)
                        in georgia      (43)
                        in nc           (38)
```

Another argument for the programmatic zone and state pages.

## Finding 4: spring cluster, confirmed on both sources

```
last frost date     peak 75 (Mar), collapses to 3 by June
morel mushrooms     peak 52 (Apr) against 4 (Jan), a 13x swing
hardiness zone map  peak 11 (Apr-May)
planting zones      peak 23 (Apr)
```

Bing and Google agree closely on both shapes. Publishing deadlines follow directly: frost content
in December, morel content in January. Publishing in-season is publishing too late to be indexed.

`last frost date by zip code` (53) is our tool exactly, and `last frost date 2026` is Breakout, as
the year-stamped variant breaks out every single year. Build once, refresh every December.

Morel related queries hand us a safety angle that matches the refuse-by-default forager
positioning: `false morel mushrooms` (22), `are morel mushrooms poisonous` (+80%),
`can you eat morel mushrooms raw` (+110%), `where to find morel mushrooms near me` (+90%).

## Finding 5: people search conditions and pests, never tools

This is the most repeated pattern in the data and it should shape how we name things.

**Every tool-shaped query returned nothing.** On Bing: `homestead weather station`,
`weather station for garden`, `garden weather app`, `best weather app for gardeners`,
`weather app for farmers`, `frost alert`, `frost warning app`, `garden pest tracking`,
`pest identification app`, `garden pest identification`, `plant disease identification`.

**Every problem-shaped query returned real volume.** Bing impressions/week:

```
aphids                  821      powdery mildew        189
japanese beetles        536      blossom end rot       104
spider mites            334      tomato plant diseases  51
squash bugs             134      organic pest control   14
tomato hornworm          88      garden pest control     6
squash vine borer        56
cucumber beetle          53
colorado potato beetle   47
cabbage worms            23
```

So **"garden pest tracking" is dead as a keyword.** Nobody searches for a tracker. That does not
kill it as a product, it kills it as an SEO entry point. The way in is named-pest and named-disease
pages, which is a third programmatic axis and feeds directly into the garden vision model roadmap
(pest and disease identification).

Same lesson for the weather tool: stop framing it as a weather app, frame it around the conditions
it reports. Note `freeze warning` has **two** peaks and October (13) is bigger than April (10).
Bing only caught the winter side. Autumn frost is the larger moment and nothing in our plan covers it.

**Timing note:** every named pest peaked in the two most recent weeks of the Bing window. Japanese
beetles hit 2484 on 2026-07-11, squash bugs, tomato hornworm, squash vine borer and blossom end rot
all peaked 2026-07-18. Pest demand is at its annual maximum right now.

## Finding 6: kill growing degree days, and stop targeting bare "foraging"

`growing degree days` returned 0 across all twelve months on Google. Bing's 31/wk was sample noise.
Fine as a feature in `plantingIndex.ts`, worthless as a content target.

The bare term `foraging` looks big but its top related queries are `foraging stardew`,
`foraging stardew valley`, `lost ark foraging locations`, `project zomboid foraging`, plus a run of
biology homework questions. The volume is real and it is not our audience. Target
`mushroom foraging`, `foraging near me` (+110%) and `foraging classes near me` (+120%) instead.

## Action list, sequenced by deadline

| When | Action | Why |
|---|---|---|
| **Now** | Fall garden + August planting content | `fall garden` climbs Jul 31 -> Aug 42 -> Sep 58 |
| **Now** | Named-pest pages, start with aphids and japanese beetles | peak demand is this fortnight |
| Aug | `what is meshtastic` explainer | Breakout term, top of a funnel ending at our hardware |
| Aug-Sep | Brand pros/cons series: vs GMRS, vs inReach, vs Baofeng | category is navigated by brand, needs affiliate accounts first |
| Sep | Reframe weather tool copy around conditions, add October frost | tool-shaped queries are all zero |
| Oct-Nov | Programmatic zone + state pages | needs the USDA ZIP-to-zone table (approved, unstarted) |
| Dec | Frost-date page, year-stamped | `last frost date 2026` Breakout, refresh annually |
| Jan | Morel piece, safety-angled | April peak needs a January head start |

## Known data problems this surfaced

**Herb calories in `content/crops/*.json` are wrong.** Ranking every crop by calories per plant puts
Oregano at 31,800 and Sage at 25,200, ahead of Winter Squash at 3,062. The `caloriesPer100g` values
for herbs are dried-weight figures multiplied against fresh-weight `avgPerPlant` yields. Nobody eats
eight pounds of sage. Any calorie ranking must exclude herbs until this is fixed, and the caloric
ROI tool should be checked for the same bug.

**Missing fall staples.** The crop files have no turnip, rutabaga or daikon, which are the classic
high-calorie autumn roots. Worth adding before the fall garden content leans on the data.

## Reproducing this

Scripts are not committed (throwaway), but the shape is:

1. Bing: `GET https://ssl.bing.com/webmaster/api.svc/json/GetKeywordStats?q=&country=us&language=en-US&apikey=`
   returns a weekly series of `BroadImpressions`. `GetUserSites` confirms the key works.
2. Trends: `GET /trends/?geo=US` with `curl -c` to seed cookies, then
   `/trends/api/explore?hl=en-US&tz=0&req={comparisonItem:[...]}` for widget tokens, then
   `/trends/api/widgetdata/multiline` and `/relatedsearches` with each widget's `token` and
   `request`. Responses are prefixed with `)]}'` which must be stripped before parsing.
