# Homesteader Labs

Free planning tools for homesteaders, gardeners, and anyone growing their own food. No account required. All data stored locally.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom brutalist design system
- **Email:** Resend (audience subscriptions via `/api/subscribe`)
- **3D Rendering:** Three.js via `STLViewer` (`next/dynamic`, SSR disabled)
- **Content:** MDX with gray-matter frontmatter
- **Database:** Dexie (IndexedDB) for caloric security / inventory
- **Weather:** Open-Meteo API (free, no auth)
- **Icons:** Lucide React
- **Testing:** Vitest + JSDOM

## Commands

```bash
npm run dev        # Dev server at localhost:3000
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (unit tests, no watch)
```

Run a single test file:
```bash
npx vitest run lib/plantingIndex.test.ts
```

## Tools

| Tool | Route | Description |
|------|-------|-------------|
| Weather Station | `/tools/weather/` | Real-time conditions, frost risk, soil workability, GDD, survival/planting dashboards |
| Planting Calendar | `/tools/planting-calendar/` | Zone-calibrated schedules, succession logic, lunar sync, caloric yield output. 54 crops |
| Resilience Dashboard | `/tools/caloric-security/` | Days of food/water/energy clocks, inventory tracking, caloric ROI, companion planting |
| Workshop | `/tools/fabrication/` | STL viewer, print time + cost estimation |

## Architecture

### Data Layer

| Source | Location | Purpose |
|--------|----------|---------|
| Crop database | `content/crops/*.json` | Varieties, timing, caloric data, companion planting |
| Product catalog | `lib/products.ts` | Hardcoded hardware list |
| Blog/archive posts | `content/archive/*.mdx`, `content/blog/*.mdx` | Field guides parsed by `lib/posts.ts` |
| Weather data | Open-Meteo API | Fetched in `lib/weatherApi.ts` |
| Inventory + config | IndexedDB (Dexie) | Caloric security data — `lib/caloric-security/db.ts` |
| Cart + locations | localStorage | Cart key: `homesteader_requisition_data`, locations: `homesteader-locations` |

### Calculation Modules

Pure functions with unit test coverage:

- `lib/plantingIndex.ts` — frost risk, soil workability, growing degree days
- `lib/survivalIndex.ts` — fire risk, water catchment, solar efficiency, livestock stress
- `lib/caloric-security/yieldCalculations.ts` — kcal math, unit normalization, macros
- `lib/caloric-security/waterAutonomy.ts` — days of water from storage + forecast inflow
- `lib/caloric-security/energyAutonomy.ts` — days of energy from battery + solar forecast
- `lib/tools/planting-calendar/` — crop scheduling, succession logic, date calculations

### Context Providers

Wrapped in `components/providers.tsx` at the root layout:

- `CartProvider` — shopping cart state, persists to localStorage
- `FieldStationProvider` — location management, frost date lookups, growing zone detection

### Key Component Patterns

- `BrutalistBlock` — primary container with offset shadow border
- `FieldStationLayout` — wrapper for all tool pages
- `ClockDisplay` — survival clock UI (food/water/energy)
- `STLViewer` — loaded via `next/dynamic` with `ssr: false`

## Design System

- Pure Tailwind CSS, no component library
- Permanently dark theme — `dark` class hardcoded on `<html>` in `app/layout.tsx`
- CSS custom properties in `app/globals.css` control the full theme
- **Palette:** burnt orange `#ff7300` (accent), dark brown `#7a3f1a` (borders), cream `#E8D3BE` (text), charcoal backgrounds
- **Typography:** Courier New / monospace body; Caveat (handwriting) for field-note accents
- **Brutalist rules:** 2–3px borders, 4–8px shadow offsets
- Tailwind custom shadows: `shadow-brutalist-sm`, `shadow-brutalist`, `shadow-brutalist-lg`

## Environment Variables

Required on Vercel (not committed):

```
RESEND_API_KEY=...
RESEND_AUDIENCE_ID=...   # Must be a UUID from the Resend Audiences dashboard
```

## Key Directories

```
app/             Next.js pages, API routes, hooks
components/      React components (layout/, home/, tools/, ui/)
content/         MDX posts and JSON crop data
lib/             Business logic, types, calculations
public/images/   Photos and logo assets
```
