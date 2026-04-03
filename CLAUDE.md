# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Build production bundle
npm run lint       # Run ESLint
npm run test       # Run Vitest test suite (unit tests only, no watch)
```

To run a single test file:
```bash
npx vitest run lib/plantingIndex.test.ts
```

## Architecture Overview

**Homesteader Labs** is a Next.js 14 app (App Router) for off-grid homesteaders. It provides interactive survival/planting tools, a product catalog, and field-documentation content. There is no backend database — all data is static JSON, MDX files, or client-side localStorage.

### Data Layer

| Source | Location | Purpose |
|--------|----------|---------|
| Crop database | `content/crops/*.json` | Vegetables, herbs, fruits with varieties, timing, caloric data, companion planting |
| Product catalog | `lib/products.ts` | Hardcoded hardware product list (WALKING MAN PRO, HELTEC V3) |
| Blog/archive posts | `content/blog/*.mdx`, `content/archive/*.mdx` | Field guides and articles parsed by `lib/posts.ts` via gray-matter |
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
- `FieldStationProvider` — user location management, frost date lookups, growing zone detection from ZIP codes

### Key Component Patterns

- **BrutalistBlock** (`components/ui/BrutalistBlock.tsx`) — primary container with the signature offset shadow border
- **FieldStationLayout** (`components/ui/FieldStationLayout.tsx`) — wrapper used for all tool pages
- **STLViewer** (`components/fabrication/`) — loaded via `next/dynamic` with `ssr: false` due to Three.js
- **Terminal overlay** — ALT+T keyboard shortcut, rendered by `TerminalOverlay`

### Styling Conventions

- Pure Tailwind CSS — no component library
- CSS custom properties in `app/globals.css` control the entire theme (dark/light)
- Dark mode via `.dark` class on `<html>`
- **Color palette:** burnt orange `#ff7300`, cream `#E8D3BE`, charcoal grays
- **Typography:** Courier New / monospace for body; Caveat (handwriting) for field-note accents
- **Brutalist rules:** 2–3px borders, 4px/8px shadow offsets, no 1px borders
- Tailwind custom shadows: `shadow-brutalist-sm`, `shadow-brutalist`, `shadow-brutalist-lg`

### Adding Crops

Add entries to the relevant JSON in `content/crops/` following the existing schema (varieties, frost dates, days-to-maturity, lunar affinity, companion plants, caloric content, preservation methods). The loader at `lib/tools/planting-calendar/cropLoader.ts` reads these files automatically.

### MDX Content

Archive and blog posts use MDX with gray-matter frontmatter. Required fields: `title`, `description`, `date`, `author`. Optional: `tags`, `category`, `excerpt`. Pages are file-based routed under `content/archive/` and `content/blog/`.

### next.config.mjs Notes

- MDX enabled via `@next/mdx` with `remark-gfm`
- `trailingSlash: true` enforced
- Security headers set (X-Frame-Options: DENY, HSTS)
- Custom page extensions include `.mdx`
