# STATUS

Running log of where homesteader-labs-next actually is. Newest entry at the top. Append, do not
rewrite.

Cross-repo facts (what this repo shares with forager-ml, forager-field-station and hestia) live
in the Forager wiki at `~/Documents/Forager/forager-wiki/`, not here. This file is for what is
true inside this repo.

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
