# STATUS

Running log of where homesteader-labs-next actually is. Newest entry at the top. Append, do not
rewrite.

Cross-repo facts (what this repo shares with forager-ml, forager-field-station and hestia) live
in the Forager wiki at `~/Documents/Forager/forager-wiki/`, not here. This file is for what is
true inside this repo.

---

## 2026-10-09 - Greenhouse door board weatherproofed and powered

Build loop test 1 moved off the breadboard. The reed switch leads are soldered to jumpers (so the
ESP32 stays swappable), heat-shrunk and run through cable glands; the probe connects by
heat-shrunk jumpers at both ends. A cold joint was caught in a photo and reflowed. Powered on
after the heatshrink: door and temperature both read in HA. Bench notes, the photo list and the
open gland question are in `docs/private/BUILD_LOOP.md`; photos and a 20 s prep timelapse are in
`~/Downloads/greenhouse-door-2026-10-09/`.

**Found:** the HA offline alert in hestia's README only triggers on `unavailable`. A probe that
drops off a running board shows `unknown`, so a failed probe jumper would go unnoticed. The reed
side fails safe: a broken lead reads as "open" and pages. A hestia session was offered to fix
the README (trigger on both states).

**Next concrete action:** mount the board. After that the work is hands and waiting: the first
cold night with the heater on runs the 10-minute door test, and the HA history has to be exported
within 10 days of it.

[non-production] 12:00 or 15:00, 2 min: in HA, change the "Greenhouse board offline" trigger to
`to: ["unavailable", "unknown"]`, then pull the probe's data jumper on the bench to watch it fire.

[non-production] Peak: mount the greenhouse door board. Before it goes up, tug each gland's wire
and check which end faces outside (the cap seals, the threaded end is open).

## 2026-10-08 (wrap) - Beds broken down, winterizing post drafted, session close

**Shipped this session, all on master and live:** the logbook homepage, the October rollover fix
for fall-sowing deadlines, and agent-readiness items 1 to 3 (is-agentic 62 to 73). Details are in
the entries below.

**In flight:**
- **Winterizing post draft** on `post/winterize-drip` (28c34c5, pushed, not merged). "What broke"
  holds both timer snags. Step 1 of the teardown is today's work: Alex broke down the beds,
  chopped and dropped the biomass into them, and did the last cull, about three hours shown in
  two timelapses (`~/Downloads/Bed-breakdown-timelapse1.MOV` 36 s and `timelapse2.MOV` 21 s,
  portrait HEVC, no GPS tags; re-encode to H.264 MP4 and strip metadata before publishing). The
  same footage serves the fall-practices post's chop-and-drop item. The 30-second cutoff
  paragraph now carries a VERIFY: hestia's own Bluetooth test saw the same stop, so it may be zone
  4, not WiFi.
- **The drip line itself is still in.** Today went to the beds.
- **Agent readiness left over:** the markdown-404 check (still flagged even though its own curl
  test passes), Organization schema contactPoint and address, /about and /contact, JSON 404s for
  unknown /api paths, an MCP server, and the published skill.
- **Parked:** the yard almanac build (bench overloaded); see docs/private/BUILD_LOOP.md.

**Wiki:** the B-hyve zone 4 caution was ingested by the ~/me session (hestia page). This session
added the agent-readiness second move to the site page (b4becc3).

**Found at wrap, fixed and live (7e1231d):** the zone pages rendered "than zone 5ahas left" and "with
14days added", because SWC drops the space after a JSX expression in some line-wrap shapes, the
same bug as the inline-tag one from the redesign. The first sentence only shows once a zone's
season has closed, so it went live with the October rebuild. Fixed with an explicit `{" "}` and
checked on production.

**Next concrete action:** the drip teardown on the next free morning: time it, photograph it, and
run the three-way timer test. Then fill the draft's placeholders.

[non-production] Peak, after the teardown: fill the bracketed placeholders in the winterizing
draft (cull contents, the close-call line, how the cutoff was found, whether the beds showed
August 18, the schedule-vs-by-hand timer line, next spring, date and category).

[non-production] 12:00 or 15:00: decide on a /contact page, and whether the Organization schema
gets a postal address (it would be the home address).

[non-production] 12:00 or 15:00, 1 min: name an email address for the /builds/ re-subscribe test
of Resend's duplicate handling.

[non-production] 12:00 or 15:00, 5 min: in the B-hyve app, list the dates of the August Zone 4
runs. That decides whether "an hour every morning" needs a correction.

[non-production] 12:00 or 15:00, 5 min: once the Bitwarden import is confirmed, delete
`~/Downloads/passwords.csv` and move the recovery codes and Proton recovery files offline.

---

## 2026-10-08 - Agent readiness shipped and verified on production

Alex said merge and check production (the Vercel preview sits behind Vercel Authentication, and
his Vercel login was mid-move to Bitwarden). PR #14 merged as c07dbe7 and deployed. A 38-check
script against homesteaderlabs.com passed: browser and agent requests alternated twice on five
URL types, through prerender and cache HIT, with no crossing. Also passing: `.md` URLs, markdown
404s at three depths, the browser 404 still in HTML, llms files, robots, the three redirects, and
the API staying JSON under a markdown Accept.

**Rescan: 73/100, up from 62.** It now reads the site as "Docs & content". The stored report
page still showed the old 62 snapshot afterwards (their save never finished), so the 73 is from
watching the live run. What it still lists:
- **Training crawlers blocked:** kept, by decision.
- **Agent-friendly 404s:** still flagged, although its own documented curl test passes against
  production. Likely cause: the scanner doesn't follow the trailing-slash 308 (text/plain), or it
  tests a path with a file extension, which the proxy matcher skips on purpose. Not chased yet.
- **Organization schema completeness:** wants a contactPoint and a PostalAddress. The address is
  Alex's decision, since it's a home.
- **Trust pages:** /about (Alex is writing it), /contact (doesn't exist), and /privacy, each
  with at least 500 characters.

**Decided the same day (relayed by the ~/me session):** the drip line comes out this week, not
late November, because recent lows were close calls. Alex photographs the teardown for the
winterizing post. This settles the Oct 31 vs late-November question from 2026-09-30. The Resend
duplicate re-subscribe test stays on hold until Alex names an address.

**Found in the B-hyve run log (relayed by ~/me): the drip post's "an hour every morning" is
probably wrong.** Alex ran Zone 4 for two hours (the August 9 entry is 120 min), and August 18
shows a ~900-minute anomaly he hasn't explained yet. The claim, and the "six times the inch-a-week
rule" figure computed from one-hour runs, appear in four places: the drip post body, its HowTo
step (structured data), the homepage "Last measured" 6× cell, and the /builds/ outcome line
(`lib/hubs.ts`). The corrected wording is Alex's call. Fix all four in one change with an
`updated` date. Zone 4 minutes stay unpublished until August 18 is settled. Details are in
docs/private/BUILD_LOOP.md.

**Superseded the same day: the claim most likely holds, and nothing published changes.** Alex
paged through the log: mostly 60-minute runs, a few at 120. That matches the post's "an hour
every morning, and a second hour on the hottest days". July, the month the post describes, isn't
logged. August 18 (about 900 min in one session, roughly 15 one-hour runs) may be the app lumping
runs together while the hub was offline. The test is a gap of about 14 days before it, and Alex is
checking. Cite the August log only as "mostly 60-minute runs, a few 120". Emitter flow is still
unsettled: Alex says about 0.65 gph, while the post and its supply list say 0.6.

**Later still:** the purchase order confirms 0.6 GPH, so the post's flow maths stands. The gap
test failed, so August 18 is either a real 15-hour run (about 13.5 inches on the beds, which
would show as flooding or on the water bill) or a glitch. Outside the spike, August has only about
11 drip-zone entries. That doesn't support "every morning" for August, so the claim rests on July
alone until Alex sends the entry dates. Everything stays held; nothing published has changed.
August 18 is probably a timer setting error: past 59 minutes, the B-hyve scroll wheel sometimes
flips minutes to hours. If a drip-zone number is ever cited, use about 874 minutes with August 18
excluded and said so. Never publish 1,774. On the teardown row: set Zone 4 to 10 minutes, stop it at
2, and see whether the log records 2 or 10.
A second B-hyve bug: a manual Zone 4 start over WiFi cuts the flow after about 30 seconds, while
Bluetooth runs the cycle fully. Treat every logged minute as an upper bound on real water until
the teardown-row test is done (10 minutes, started three ways: wheel, Bluetooth, WiFi). Alex
agreed both bugs go in the winterizing post as "what broke". Flagged to ~/me for hestia: soil
readings are meant to drive Zone 4 eventually, and Home Assistant starts zones over WiFi.
**Winterizing post drafted** on branch `post/winterize-drip` (154a29f, pushed, not merged), as
Alex asked: "What broke" carries both timer snags in full. Everything else is a bold-bracket
placeholder: teardown steps and photos, the three-way log test, the held water number, next
spring, the publish date and the category. Committed before Alex edits so he can diff his pass.
Open question for him: the published drip post says "I run a schedule based timer", but this
week's account is that he starts every run by hand.

**Next concrete action:** build /about from Alex's text, then decide on /contact and the schema
address.

---

## 2026-10-07 (night) - Agent readiness: markdown pages, a generated llms.txt, guessed paths

Alex found good-css.com, a CSS opinion site packaged as an installable agent skill and scored
100/100 by is-agentic.com, Vercel's agent-readiness scanner. Our scan (2026-10-08 02:45 UTC):
**62/100**. The one critical blocker is Cloudflare returning 403 to the AI training crawlers
(GPTBot, ClaudeBot, CCBot, Bytespider, Amazonbot). The agents that fetch pages for a person all
get 200: OAI-SearchBot, ChatGPT-User, Claude-User, Claude-SearchBot, PerplexityBot,
Perplexity-User. **Alex decided to keep the training block**, so the scanner will keep marking it
down. On packaging the site as a skill: "That feels inevitable." Direction agreed, not
scheduled.

**Branch `agent-markdown` (9b33c9f), pushed.** Items 1 to 3 from the scan:
- **Markdown for every page.** A request that prefers `text/markdown` gets markdown at the page's
  own URL: `proxy.ts` rewrites it to `app/md`, and its matcher only admits requests whose Accept
  mentions markdown, so browser traffic never runs it. `/page.md` works too. The renderers in
  `lib/markdown` work from the same data the pages use. They cover the posts, the hubs, the
  homepage, the KB, the zone and state pages, and short summaries for the interactive tools.
  Unknown paths get a markdown 404. 405 pages prerender and revalidate daily.
- **Link headers** on those pages point to the markdown copy and to llms.txt.
- **llms.txt** keeps its hand-written prose (`content/llms/llms-template.md`) and generates the
  guide list from the posts, so the berry guide and the Assistant post are finally listed.
  `llms-full.txt` holds every guide in one file.
- **Redirects:** /field-notes, /workshop and /hardware go to the archive, the parts bin and the
  shop. These are temporary (307) so real pages can take those paths later.

Haiku subagents drafted the zone and state renderers and the KB and stub renderers, and I
reviewed them. Fixes on review: thin KB entries render (their pages exist, they're just
noindex); the full description replaces the 300-character meta one; and two claims that tools
call our endpoints were cut, because I couldn't confirm them. 1,682 tests pass, lint is at the
19-warning baseline, and the build is clean. I checked all eleven request types against a local
production server.

**Not done (scanner items 4 and 5, and the skill):** JSON errors for unknown /api paths, an MCP
server over the three endpoints, and the published Homesteader Labs skill.

**Next concrete action:** verify the Vercel preview, then merge `agent-markdown` on Alex's go.
After the deploy, rescan with is-agentic.

[non-production] Write the /about page text (morning, peak). Passed to ~/me.

---

## 2026-10-07 (later) - Homepage shipped, and the October rollover fixed

Alex approved the preview. `build-loop` and `homepage-logbook` merged to master (908b62a,
c291818) and deployed; the logbook homepage is live. The rollover bug was then fixed on
`fix/october-rollover` (353c595), merged as 4abd9fa.

**The bug, as it reached production.** From October, frost lookups and zone normals roll to
next year's dates so the spring schedule points ahead. Fall deadlines were counted back from
that frost too. Zone pages are built per deploy, and the last one before today was Sep 29, so
they were stale but in the right year. The homepage deploy rebuilt them in October, and zone 5a
went live with "18 crops left", the first being "Sow by Jun 3: Parsnip": next year's date, no
year shown. Same flaw in three more places: state pages and the zone planner (through
`fallSowing`), the calendar's LAST CALL verdict (`canStillPlant`), and the resilience checklist's
first-frost alert, which was silent in exactly the weeks it exists for.

**Fix.** Fall deadlines and last calls count from the first frost of the current year; the spring
schedule still rolls forward. Zone and state pages now revalidate daily, since "what you can
still sow" is counted from the render date and went stale between deploys. Two regression tests
pin the clock to Oct 7 2026, and a Jan 1 test date now parses as local time (UTC midnight is
Dec 31 in US time zones). 1,176 tests pass, lint at the 19-warning baseline, and the build is
clean. On the fixed build, 5a reads "Nothing... closed", 7a lists radishes by Oct 12, 9b lists 10
crops from Oct 10, and North Carolina's bands agree.

**Still open from build-loop:** re-subscribe an address already on the list through `/builds/`
on production, to see whether Resend errors on duplicates. It needs a real address, so it needs
Alex's OK on which one.

**Next concrete action:** read Search Console on the homepage and zone pages 28 days after
deploy (Nov 4).

---

## 2026-10-07 - The logbook homepage

Alex couldn't land on a homepage, so the problem got named before any layout work. The page
carried eight different taglines and still described the July tools-first site, not the Sept 30
build loop. Its H1 was a keyword phrase for a page with about one search impression a month,
and the hero image was AI-generated (`seedlings_sprouting.png` carries the IPTC
trainedAlgorithmicMedia tag), the only non-firsthand photo on the site. Three mocks, each
starting from a different sentence, are in a private artifact
(https://claude.ai/artifact/8yinzWYbZqa8iEwg1xKXP9). Alex picked **A, The Logbook**. He kept C's
almanac as a one-line subheading and B's "What can you still plant this week?" as the tool
section.

**Branch `homepage-logbook` (2113e7b), pushed, not merged. Stacked on `build-loop`** (it uses that
branch's NewsletterSignup copy props), so build-loop merges first or with it. Hero "One half acre.
Every build measured." over the compost photo from the mole note. A ledger of measured numbers
comes from a new `figures` field on BUILD_OUTCOMES, and an "On the bench" list from
`ON_THE_BENCH` in lib/hubs.ts (hand-kept: delete an entry the day its log ships). The ink planting
banner's ZIP box anchors the frost dates the calendar reads and opens it already set. The month
line comes from lib/almanac.ts: October and November filled, other months show nothing, and the
line corrects itself on hydration if the month turns between deploys. The masthead tag and footer
now say "the logbook of a half acre", and Builds is in the nav. The `<title>` keeps its search
wording. This reverses the Sept 29 keyword H1 on purpose.

Verified: 22 hub and almanac tests, tsc, lint at the 19-warning baseline, production build, and a
Playwright drive at 1366px and 390px. Neither width scrolls sideways, no glued inline tags, and
the ZIP flow lands on the calendar anchored to 97202. A bad ZIP shows the error.

**Found, not fixed here:** 4 planting tests fail on master code since Oct 1 (zonePages fall
sowing x2, statePages purity, zonePlanner closed season). `targetYear()` in lib/frostNormals.ts
rolls zone frost dates to next year from October, and the tests pass fixed 2026 dates. Zone and
state pages may be showing October visitors next year's fall deadlines. Spun off as its own task.
This is also why the homepage banner describes the four verdicts instead of computing one.

**Idea:** Alex wants the almanac as a physical, hands-free thing in the yard, not a web page. A
build-loop candidate, not started.

**Next concrete action:** Alex reviews the Vercel preview of `homepage-logbook`, then merge
`build-loop` and `homepage-logbook` on his go.

[non-production] Review the homepage preview on phone and desktop (and a second look from your
wife), then say go on merging `build-loop` and `homepage-logbook`.

---

## 2026-09-30 - The build loop: makers as the audience, a builds signup, and a silent signup bug

Started as a read of a stranger's repo (Streaming-Rpi, a Pi helmet-cam dashboard) and ended as
the direction for the cold season. Homesteader Labs is the record of building and maintaining the
half acre: **makers are the audience, the garden is the subject.** Every build ships a measured
number, a clip and a printable part. The loop, the log template, the demand evidence and the
idea-finding method are in `docs/private/BUILD_LOOP.md` (gitignored).

**Branch `build-loop` (6b3f8d1), pushed, not merged.** `/builds/` and every build-log post now end
in the newsletter signup with builder copy, and those signups carry the Resend contact property
`source = builds`, so the maker side of the list can be counted on its own. `/api/subscribe` had
the silent-failure bug from the zone planner work: a try/catch around a call that resolves
`{ data, error }`, so every form except the zone planner told people "you're on the list" when
Resend had rejected them. It now reads `.error` (502), retries untagged if the tagged create
fails, and the form says "couldn't add you just now" instead of blaming the email. Verified with 4
new route tests (1,168 pass), the production build, and 12 Playwright checks with the subscribe
call intercepted so no test contact reached Resend. **Not verified:** whether Resend errors on an
address already on the list; if it does, those people now see the retry message.

**Demand research.** Four YouTube scans (passes 3 to 5, plus Alex's pass 2) and a free
autocomplete grid, `~/Downloads/build_demand_grid.py`. Rainwater is the biggest lane, container
watering is big and open, greenhouse electronics is a small pond, and bird-feeder cams are crowded
(31 of 37 top results uploaded this year, median 206 views). The rain barrel became a three-leg
myth-test arc: what it catches, gravity drip to the containers, then the pump as the fix.

**Cross-repo.** Test 1 of the loop is a greenhouse door board in hestia (branch
`greenhouse-door`). Wiki updated.

**Also.** Five security issues in Streaming-Rpi reported privately to its author by email; their
GitHub private reporting is switched off.

**Later the same evening.** A companion-pet idea (NFC care tokens feeding a cute character on the
Hestia board, Gardagotchi first) got its own scan, pass 6: desk pet robots and virtual pet DIY are
hot, plain ESP32 tamagotchis are filling up, and real needs plus printed tokens is the open gap.
Hit and miss thresholds for the first clip, and what to set up before it ships, are in
`docs/private/BUILD_LOOP.md`.

**Next concrete action:** merge `build-loop` once Alex says go, then re-subscribe an address that
is already on the list through `/builds/` on production to settle the Resend duplicate question
(agent work, after the merge).

[non-production] Say go on merging `build-loop` to master (and `greenhouse-door` in hestia).

[non-production] Morning: build and mount the greenhouse door board. First cold night with the
heater on: the 10-minute door test, then tell Claude within 10 days.

[non-production] Morning: rain barrel measurements (roof footprint, barrel size, bucket
calibration, inlet screen), before the hard freeze.

[non-production] Paste the NUMBER lines from `docs/private/BUILD_LOOP.md` into the build log.

[non-production] Before filming the Gardagotchi reaction shot, ask her parents about her face in
a public clip.

[non-production] Pick the drip teardown date: the build log says Oct 31, the queue row says late
November.

[non-production] From 2026-10-02: check email for the Streaming-Rpi author's reply.

---

## 2026-09-29 - SEO batch 2: foraging and builds hubs, series nav, page-2 push

Built on batch 1 (www redirect, berry CTR rescue, KB dedup, og:image), which merged earlier the
same day. Branch `seo-batch-2`, one commit per item, merged to master.

**Item 6, hubs.** `/foraging/` reads in start-here order: wild berry guide, then the monthly
series oldest first, then mushroom safety and the sugar maple ID guide. `/builds/` lists all six
build logs oldest first with a status stamp and a one-line outcome. Membership is a rule in
`lib/hubs.ts`, so October joins the hub and the series chain the day `october-foraging` merges,
with no code change. The outcome lines are hand-written and a test fails if a new build log lacks
one. Every hub post now has its hub as the breadcrumb parent (visible and in BreadcrumbList
JSON-LD) plus an in-body link; the hubs are also in the footer, on `/archive/`, and in the
sitemap. Planting, pest and de-cloudify posts have no hub and still point at `/archive/`.

**Item 7, series nav.** August and September end with previous/next, the full run with the
current issue marked, and a link to `/foraging/`. September links back to August, verified in the
built HTML and in a render test that covers every future issue. The October draft was not touched.

**Item 8, page-2 push.** Sugar maple retitled "How to Identify a Sugar Maple, and Tell It From a
Norway Maple" (sugar maple identification 590/mo, vs Norway maple 720/mo) with a 151-char meta;
the hub is its first inbound internal link from anywhere. `/tools/caloric-security/` linked
in-body from What to Plant in August, Fall Garden Planning and the Survival Index build log.
Zone 10b's snippet read "last spring frost January 1 and first fall frost December 31", which
looks broken; zones with a 355+ day season (10a, 10b) now get a heat-not-frost title and meta, the
other twelve are byte-identical. Zone 4b gets links from the New York and Michigan rows of the
state index, Kentucky from the state index prose and a new by-state line on the zone index.

**Found, not fixed:** React hydration error #418 on `/archive/wild-berry-guide/` and
`/archive/what-to-forage-september/`, present on production before this batch. Not in scope; the
two pages that matter most for foraging traffic carry it.

**Next concrete action:** chase the #418 on the berry guide and September (agent work). Then the
measurement below.

[non-production] Read the `/foraging/` and `/builds/` copy, including the six build outcome lines,
which Claude wrote in the site voice.

[non-production] On or after 2026-10-27, sync CrawlSEO GSC (browser login) and have Claude read
the batch-2 URLs: sugar maple, zone 10b, zone 4b, Kentucky, caloric security.

---

## 2026-09-20 - The reference tables became endpoints, and the license split that took

**Live on master:** `/api/frost/{zone}/`, `/api/pests/`, `/api/pests/{cropId}/` join the existing
`/api/zone/{zip}/`, documented at `/data/`, summarised at `/llms.txt`, specified at
`/openapi.json`. All `force-static` with `Access-Control-Allow-Origin: *`, so they serve from the
CDN and cost nothing to poll. `robots.ts` now opens exactly those three reference paths and keeps
checkout, webhooks and the mailing list closed.

**Why now:** Alex's standing hypothesis that tools become endpoints for agents, and muse.ai opening
connectors to developers as the confirmation. The positioning bet is to be early and be the
AI-friendly gardening resource, with pest alerts as the wedge because they are natural for someone
already outdoors. Connector submitted to Muse the same day, pointing at `/data/`; status check
queued for 2026-10-04.

**The license split is the decision worth remembering.** Pests and companions go out CC BY 4.0,
attribution required, because which pests are worth predicting and how good the evidence is for a
companion is our compilation. Zones and frost say "public domain source, aggregation ours,
attribution requested" because PRISM and NOAA facts are not ours to license, and claiming otherwise
on a site whose argument is that it does not invent numbers would be the same move as the
competitor fabricating zone 11a frost dates. `license`, `licenseUrl`, `attribution` and
`attributionRequired` ride in every response rather than sitting on a page no machine fetches
(`lib/dataLicense.ts`). KB stays CC0 as received from OpenFarm.

**Deliberately not built: metering.** The sellable-looking parts are public-domain derived and
rebuildable by anyone, so a paid API of them is thin. The defensible part is the curation, and the
strongest asset, observed days-to-maturity, does not exist yet. Stripe is already wired here for
when it is justified. Request counting is Vercel's server-side logs, chosen over making the routes
dynamic, which would have cost the free CDN serving for numbers we can read from the platform.

**`alertable` is the differentiator, now machine-readable.** `alertable: false` plus
`notAlertableReason` travel in the response and are called out in the spec, so anything building
notifications skips the pests with no predictable emergence instead of firing from spring onward.
That flag is the thing no competing dataset publishes.

**Two near-misses, both caught by tests or checks rather than review:** the OpenAPI drift test was
first written into `public/`, which Next serves verbatim, so it would have been downloadable at
`/openapi.test.ts` (now `lib/openapi.test.ts`, and the URL 404s); and the pest route folder was
`[crop]` while the spec said `{cropId}`, now aligned with the response field, URLs unchanged.

**Next concrete action:** [non-production] check the Muse submission on or after 2026-10-04, and at
the 2026-10-01 GSC read compare the drip post's position curve against the sugar maple one. The
drip post was submitted for priority indexing 2026-09-20.

---

## 2026-09-17 - Drip irrigation post shipped, with the first self-hosted video

**Published:** `/archive/diy-drip-irrigation-raised-beds/`, live on master (`da5eef3`, ff-merged
from `content/drip-irrigation-raised-beds`), deploy verified: page 200, video serving, sponsored
rel present, in the sitemap. Keyword targets from a same-day CrawlSEO pull: "drip irrigation
raised beds" 3,600/mo KD 0, "diy drip irrigation system" 3,600/mo KD 3, "raised bed irrigation
system" 2,400/mo KD 0, with section-level pressure regulator 4,400, timer 1,300, filter 720,
manifold 590. "automate your garden" has no measurable volume, so the post is titled around drip
irrigation and the automation language stays in the body.

**DripWorks affiliate is live.** `ref=homesteaderlabs` added to `AFFILIATE_MARKERS` in
`mdx-components.tsx`, so any DripWorks link gets `rel="sponsored nofollow noopener noreferrer"`
automatically; CLAUDE.md's live-programme list updated. Disclosure sits next to the link in the
post, per the affiliate policy.

**New primitive: `<FieldVideo>` in `mdx-components.tsx`.** Plain `<video>`, `preload="none"`,
poster image, caption in mono, vertical clips capped at a narrow column. Self-hosted on purpose:
a YouTube embed sets cookies on load, which `/privacy` rules out in writing. Alex's 79s install
clip was HDR (bt2020 / arib-std-b67) and needed tonemapping to bt709 before encode, otherwise it
renders washed out; 112MB MOV to 12MB 720p, metadata stripped. Reusable for future posts.

**The moisture chart was killed, not shipped, and that is the most useful finding.** Home
Assistant holds hourly soil-moisture statistics per bed back to 2025-12, but the Jun 27 to Jul 3
window (hottest dry week after the 2026-06-13 install) is flat in every bed: only one clean
watering signal all week (Jul 1 05:00-06:00, +3 to +6 across three beds). No pre-drip baseline
exists either, the WH51 gateway was frozen or zero 2026-06-02 to 06-07 and live data starts
06-08 11:00, four days before install. So the post states the watering finding as observation
(an hour every morning, twice on the hottest days, ~84 GPH over ~140ft of line, ~0.9in/hr) and
has a section on what the sensors cannot tell you, instead of a chart implying measurement.

**In flight:** the ranking-settle read on this post and on `/archive/identify-sugar-maple/`
around 2026-10-01. Sugar maple already showed the pattern Alex named: positions 1 to 4 on
"how to identify sugar maple" for two days from Sep 8, then ~43 and spread across looser
queries. Not a problem, and worth confirming as a repeatable shape rather than n=1.

**Next concrete action:** [non-production] request indexing for the new URL, then at the
2026-10-01 checkpoint compare its position curve against the sugar maple one.

**[non-production] jobs from this session, all in `~/me/queue.md`:** request indexing for the new
URL; add the post + DripWorks links and tick "includes paid promotion" on the YouTube Short once
the channel is verified (outbound links are restricted until then, Short is at
youtube.com/shorts/JfGLlMqM2AQ); swap the Hot Peppers WH51 battery and carry a spare for Tomatoes;
optionally pull zone 4 run logs from the Orbit app; photograph the winterizing clean out in late
November for the follow-up post; decide hestia's Home Assistant recorder-retention change. Bed
measuring is done (~140ft of emitter line, 32.5ft per rectangular bed, just under 5ft per round).

Also today, outside this repo: CrawlSEO's GSC sync was dead (its `npm run dev` binds 3000 while
`NEXTAUTH_URL` and the Google redirect URI say 3001, so the OAuth callback landed nowhere, and
the re-auth then dropped `webmasters.readonly`), and hestia shipped a soil stale-sensor alert
prompted by the frozen-data finding here. Both recorded in the wiki, not here.

---

## 2026-09-08 - Homepage refresh approved and merged

Alex approved the preview and explicitly requested merge and push. PR #12 merged
to master as `11b015b`; the original checkout is updated. The PR's lint, test,
build, and Vercel preview checks all passed before merging. Production deployment
verification follows this log push. The homepage review is complete in the
personal queue; no further design approval is pending.

Next content step: [non-production] look for the mole-trail photograph at 15:00,
already recorded in ~/me/queue.md. Lead photography for future posts is the
preferred direction; a dedicated cover-image field is an idea, not implemented.
No wiki change: this work stays within this repository.

## 2026-09-08 - Homepage refresh ready for preview review

Built the approved homepage direction on `codex/homepage-refresh` in an isolated
worktree. Compact split hero puts planting first; three direct tool links replace
the decorated cards. The latest field note uses its own article photograph and
links to two more notes. Workshop, hardware, and newsletter remain accessible.
Existing images are reused; no new photography is required for this preview.
Homepage CSS is scoped; shared navigation, article layouts, and tool logic are
unchanged. Newsletter styling is simplified with a visible, accessible Join action
and a mobile input that can shrink without overflowing.

Validation: lint passed (0 errors, 19 existing warnings); all 1,111 tests passed;
production build and TypeScript passed. Browser checks covered desktop, 1024px
tablet, 390px mobile, loaded images, page overflow, keyboard focus, mobile menu,
planting entry navigation, and the featured article in the production build.
No live newsletter subscription was submitted.

Next step is review, then publishing: [non-production] Alex reviews the branch
preview at 15:00 before a merge to master. Keep production unchanged until review.
This item is recorded in ~/me/queue.md. No wiki change: this is single-repo work.


## 2026-09-08 - Frontend design review

Reviewed the live desktop homepage, planting-calendar entry screen, and September
foraging article against the current source. No application changes made. The field
notebook identity and article layout are strong. Recommended next design work:
bring the homepage's purpose and primary action into the first viewport, reduce
repeated decorative treatments, improve small label legibility, and make tool
entry controls more prominent. These are design judgments, not measured conversion
findings. Mobile and populated tool states were not tested in this review.

Next concrete action if design work proceeds: refine the homepage hero while
preserving the existing identity. No user-only jobs or cross-repo wiki changes.


## 2026-08-21 — September forage post shipped, GSC sync fixed, forager BOM pivot researched

**`what-to-forage-september` published end to end.** Third post in the monthly foraging cadence
([[monthly-foraging-series]] in memory), following the August post's real signal (only page
besides the wild berry guide getting actual clicks in GSC). Drafted, then first-party photographed
same day: wild grape ripening cluster and a cut-open berry showing the pear-shaped seed (the
mixup section's actual safety claim, not just described), plus a rose hip shot captioned honestly
as still-green/unripe. Committed, pushed, deployed, verified live at
`/archive/what-to-forage-september/`, picked up automatically by `app/sitemap.ts`. Hickory husk
(not yet split into its diagnostic four sections) and the rose hip reddening are open follow-up
shots, not blockers.

**CrawlSEO GSC sync was 3 weeks stale; fixed and re-read.** The local CrawlSEO instance's crawl
had refreshed (400/400 pages) but the GSC search-analytics sync hadn't run since 2026-07-31,
a separate auth-gated route needing Alex's browser session, not something an agent can trigger.
Fixed same day. Fresh data: wild berry guide now at position 7.6 with 1,537 impressions but still
0.0% CTR at position 4.1 for its top keyword, CrawlSEO's own opportunity detector now flags this
high-severity. Reinforces the deferred-to-Aug-28 retitle read rather than changing it. State pages
(shipped 2026-08-03) show first indexation signal: 4 of 10 pilot states have impressions (NC, OH,
GA, KY), zero yet from the high-volume "wide" tier (TX, CA, NY, PA, FL, MI). Kentucky, the
pilot's risk case, is outperforming the other three on position. Re-read at the Aug 24 checkpoint.

**Forager handheld BOM pressure researched; two-SKU direction proposed, nothing built.**
[non-production] Rising Pi 5 prices pushed the BOM to ~$450, pushing retail toward ~$700. Explored
a Core ML iPhone app as a free/cheap acquisition tier alongside the Pi 5 handheld repositioned as
the premium "sovereign" SKU. Did same-day research on Apple's actual App Store guidelines
(1.4.1 doesn't ban plant/fungi ID apps, three comparable apps already ship) and surfaced a real,
documented industry accuracy scandal (best competing app 49% accurate per a Public Citizen
report) that reads as validation of the refuse-by-default wedge rather than a reason to avoid the
category. Full writeup in the Forager wiki (`entities/edge-hardware.md`) since this crosses into
forager-ml and forager-field-station. Next concrete step, not started: a minimal TestFlight
submission with real safety copy, cheaper than reasoning further from guideline text alone.

**Next concrete action:** re-pull GSC data at the Aug 24 state-page checkpoint and Aug 28
berry-guide checkpoint; decide on the berry guide retitle once that data lands.
