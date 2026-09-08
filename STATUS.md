# STATUS

Running log of where homesteader-labs-next actually is. Newest entry at the top. Append, do not
rewrite.

Cross-repo facts (what this repo shares with forager-ml, forager-field-station and hestia) live
in the Forager wiki at `~/Documents/Forager/forager-wiki/`, not here. This file is for what is
true inside this repo.

---

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
