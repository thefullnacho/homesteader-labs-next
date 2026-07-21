# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Part of the Forager constellation

This repo is one of four projects in the Forager / Homesteader Labs constellation (with
`forager_ml`, `forager-field-station`, and `hestia`). It owns the brand, voice, product catalog,
and content. Cross-project knowledge — how the repos relate, the shared model registry, the
hardware it sells, brand/voice, and known cross-repo divergences — lives in the **Forager wiki**
at `~/Documents/Forager/forager-wiki/` (start at `index.md`; its `CLAUDE.md` is the maintenance
schema). Update the wiki when a change crosses repos.

## Commands

```bash
npm run dev        # Dev server at https://localhost:3000 (--webpack, experimental self-signed HTTPS via mkcert)
npm run build      # Build production bundle (--webpack; the flag is required, do not remove)
npm run lint       # Run ESLint
npm run test       # Run Vitest test suite (unit tests only, no watch)
```

To run a single test file:
```bash
npx vitest run lib/plantingIndex.test.ts
```

## Architecture Overview

**Homesteader Labs** is a Next.js 16 app (App Router) for off-grid homesteaders. It provides interactive survival/planting tools, a product catalog, and field-documentation content. There is no backend database — all data is static JSON, MDX files, or client-side localStorage.

### Data Layer

| Source | Location | Purpose |
|--------|----------|---------|
| Crop database | `content/crops/*.json` | Vegetables, herbs, fruits with varieties, timing, caloric data, companion planting |
| Knowledge base | `content/kb/crops.json` | 340 public-domain crop entries (OpenFarm.cc, CC0, via Internet Archive), loaded by `lib/kb.ts` |
| Product catalog | `lib/products.ts` | Hardcoded hardware product list (WALKING MAN PRO, HELTEC V3) |
| Archive posts | `content/archive/*.mdx` | Field guides and articles parsed by `lib/posts.ts` via gray-matter |
| Weather data | Open-Meteo API (free, no auth) | Fetched in `lib/weatherApi.ts` |
| Cart & preferences | localStorage | Cart key: `homesteader_requisition_data`, locations key: `homesteader-locations` |

### Calculation Modules

- `lib/plantingIndex.ts` — frost risk, soil workability, growing degree days
- `lib/survivalIndex.ts` — fire risk, water catchment, solar efficiency, livestock stress
- `lib/tools/planting-calendar/` — crop scheduling logic, date calculations

These are pure functions with unit test coverage — test them independently of the UI.

### Context Providers

Both providers are wrapped in `components/providers.tsx` at the root layout:
- `CartProvider` — shopping cart state, persists to localStorage
- `FieldStationProvider` — user location management, frost date lookups, growing zone detection from ZIP codes (used directly by tools, e.g. the SGP wizard)

## Design System: Paper Field-Notebook

As of branch `redesign/paper-field-notebook` (2026-07), the whole site uses the "paper field-notebook" system. **Do not introduce new uses of the legacy brutalist components/tokens.**

### Fonts (loaded in `app/layout.tsx`)

- `font-display` — Archivo Black → headlines, big numbers
- `font-serif` — Newsreader → body voice (default)
- `font-mono` — IBM Plex Mono → data, labels, metadata
- `font-hand` — Caveat → the *one* handwritten note per view

### Palette (CSS vars in `app/globals.css`, hex literals in `tailwind.config.ts`)

Use the hex token names (not `var()`) so opacity modifiers work: `paper` `#f5f0e2`, `kraft` `#e9ddc1`, `manila` `#efe5cc`, `ink` `#26221a`, `soil` `#5a4630`, `marker` `#e4571f` (accent), `moss` `#5c6b3c` (positive), `rust` `#a8442a` (warning), `slateblue` `#3f5d6b` (info).

### Primitives

- CSS in `app/globals.css` `@layer components`: `.grain` (content inside needs `relative z-[2]`), `.ruled`, `.stamp`, `.card-paper`, `.hl`, `.torn-top`, `.divider-ink`, `.field-checkbox`, `.rotate-slight` / `.rotate-slight-r`
- `components/field/kit.tsx`: `Stamp`, `Tape`, `SpecBox`, `MarginNote`, `CoffeeRing`, `PaperClip`, `SectionHead`
- Usage law (from kit.tsx header): one handwritten note per view; at most one tilted non-data aside on working pages; Tape/CoffeeRing/PaperClip only on browsing surfaces; tools/tables/forms sit at zero degrees.

### Page shell (all redesigned pages follow this)

Kraft header band (`bg-kraft grain border-b-2 border-ink`, `torn-top` on article pages) with mono breadcrumb + live fact on the right, stamp row, `font-display` h1, italic serif deck. Sections introduced by `<SectionHead no="§1" …>`. Pages close with a mono "station footer" line. Layout chrome (kraft masthead, ink colophon footer, print rules) is global.

### Legacy (do not extend)

The old brutalist component wrappers (`FieldStationLayout`, `BrutalistBlock`, `Typography`, `Badge`, `Button`) have been deleted — nothing imports them. What remains of the old system is the **token bridge**: legacy tokens `text-accent` / `border-border-primary` / `shadow-brutalist*` are still remapped onto the paper palette in globals.css so any lingering class references keep rendering. Removing that remap (and the last `text-accent`/`shadow-brutalist*` class usages) is the final teardown pass; do not add new uses of these tokens.

## Content Conventions

### Archive posts (field notes)

MDX with gray-matter frontmatter. Required: `title`, `description`, `date`, `author`. Optional: `tags`, `category`, `excerpt`, plus at-a-glance fields `season`, `skill`, `region`, `gear`, `pairsWith`, `stamp` (drive the sticky SpecBox on the article page and the specs line on index cards — see `lib/posts.ts`: `getReadMinutes`, `getPostNo`, `getSpecsLine`).

### Adding Crops

Add entries to the relevant JSON in `content/crops/` following the existing schema (varieties, frost dates, days-to-maturity, lunar affinity, companion plants, caloric content, preservation methods). The loader at `lib/tools/planting-calendar/cropLoader.ts` reads these files automatically.

### next.config.mjs Notes

- MDX enabled via `@next/mdx` with `remark-gfm`
- `trailingSlash: true` enforced
- Security headers set (X-Frame-Options: DENY, HSTS)
- Custom page extensions include `.mdx`

## Current Status (2026-07-18)

- Branch `redesign/paper-field-notebook`: **redesign complete for all routes**. Latest commits: KB as the crop files (`13af908`), field notes drawer pulls + at-a-glance cards (`b814b7c`), forager game as the field quiz (`59cae0d`), survival garden plan as the intake worksheet (`ba9344c`).
- Legacy component teardown done: 5 dead weather/caloric dashboards + `FieldStationLayout` deleted, and the 4 live consumers (`TerminalOverlay`, `ContextualRequisition`, `RadarView`, `DashboardErrorBoundary`) ported off the old wrappers. Remaining: remove the globals.css token remap and the last `text-accent`/`shadow-brutalist*` class usages; per-page copy + em-dash sweep.

### Parked idea: open research + agent reporting layer

Discussed 2026-07-18, not started. Direction: the site as an open research project where users contribute field observations (starting candidates: planting-calendar germination actuals; forager-game "stump the AI" photo submissions — user uploads a photo the model gets wrong, yielding hard-negative training samples). An agent layer handles normalization, attribution, and compiled reports ("Field Reports" drawer). Agreed principles so far: contribution is always a deliberate act (never background sync — the site's brand is no data collection; frame as data *donation*, "data seed bank"); zone-level geography only; one-time-token simple endpoint, machine-first (published JSON schema, idempotent submissions via client UUIDs); inbound contributor license grant is required from day one even though outbound licensing (CC0 vs CC-BY) is undecided; expect data-poisoning pressure once the dataset has value (rate limits, quarantine, cross-validation).
