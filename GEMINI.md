# Homesteader Labs - Project Context

## Project Overview
Homesteader Labs is a Next.js 16 application providing tools, hardware, and field documentation for homesteaders, survivalists, and self-reliant builders. As of branch `redesign/paper-field-notebook` (2026-07), the site uses a "paper field-notebook" aesthetic — kraft paper, ink, rubber stamps, ledger rules — replacing the old brutalist/terminal system.

### Core Technologies
- **Framework:** Next.js 16 (App Router, webpack build flag required)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with the paper design system (`components/field/kit.tsx` + `app/globals.css`)
- **3D Rendering:** Three.js (via `STLViewer` for fabrication tools)
- **Content:** MDX (field notes/archive), static JSON (crops, KB, products)
- **Icons:** Lucide React
- **Testing:** Vitest with JSDOM

### Key Features
- **Planting Calendar:** Data-driven tool for managing crop schedules (the "season ledger").
- **Weather Tools:** Survival and planting-focused weather dashboards (the "wall chart").
- **Resilience Dashboard:** Caloric-security "three clocks" at `tools/caloric-security/`.
- **Crop Knowledge Base:** 340 public-domain crop entries at `/kb/` (OpenFarm CC0 rescue).
- **Fabrication:** 3D STL viewer for hardware designs and field tools (the "workshop").
- **Shop:** Catalog + mail-order requisition flow for off-grid hardware.
- **Forager Game:** Plant-ID game vs the WALKING MAN PRO vision model.
- **Terminal:** Interactive overlay (`ALT+T`) for command-line style interactions.

---

## Building and Running

### Development
```bash
npm run dev
```
Starts the dev server at `https://localhost:3000` (webpack, experimental self-signed HTTPS via mkcert).

### Production
```bash
npm run build
npm run start
```
Builds the application for production and starts the server.

### Testing
```bash
npm run test
```
Runs the Vitest test suite.

### Linting
```bash
npm run lint
```
Runs ESLint to check for code quality and style issues.

---

## Development Conventions

### Architecture
- **App Router:** All routing and layouts are under the `app/` directory.
- **Modular Components:** Feature-specific components are in `components/<feature>/`, shared paper primitives in `components/field/kit.tsx`.
- **Domain Logic:** All business logic, types, and utility functions are centralized in the `lib/` directory. Use the `@/lib` alias.
- **Content Management:** MDX files in `content/archive/` parsed by `lib/posts.ts`; KB JSON in `content/kb/` loaded by `lib/kb.ts`; products in `lib/products.ts`.

### UI & Styling (paper field-notebook)
- **Palette tokens** (hex in `tailwind.config.ts`, use names so opacity modifiers work): `paper`, `kraft`, `manila`, `ink`, `soil`, `marker` (accent), `moss` (positive), `rust` (warning), `slateblue` (info).
- **Fonts:** `font-display` (Archivo Black), `font-serif` (Newsreader, body), `font-mono` (IBM Plex Mono), `font-hand` (Caveat — one handwritten note per view max).
- **Primitives:** `.card-paper`, `.grain` (children need `relative z-[2]`), `.stamp`, `.hl`, `.torn-top`, `.divider-ink`, `.ruled`, `.rotate-slight(-r)`; kit components `Stamp`, `Tape`, `SpecBox`, `MarginNote`, `PaperClip`, `SectionHead`.
- **Page shell:** kraft header band + breadcrumb + stamps + display h1 + italic deck; `§`-numbered sections; mono station footer.
- **Usage law:** working surfaces (tools, forms, tables) at zero degrees, no props; tilts/Tape/PaperClip only on browsing surfaces.
- **Legacy:** `BrutalistBlock`, `FieldStationLayout`, `Typography`, `Badge`, `Button` and `text-accent`/`shadow-brutalist*` tokens are deprecated — do not extend; they remain only inside a few tool components pending future passes.

### Performance
- **Lazy Loading:** 3D components like `STLViewer` should be loaded dynamically using `next/dynamic` with `ssr: false` to keep the initial bundle size small.

### Testing
- **Unit Tests:** Place logic tests in `lib/` with a `.test.ts` extension (e.g., `lib/survivalIndex.test.ts`).
- **UI Tests:** Use `@testing-library/react` for component testing within Vitest.

### Content
- Archive frontmatter: required `title`, `description`, `date`, `author`; optional `tags`, `category`, `excerpt`, and at-a-glance fields `season`, `skill`, `region`, `gear`, `pairsWith`, `stamp`.

---

## Current Status (2026-07-18)
- `redesign/paper-field-notebook`: all routes migrated to the paper system. Cleanup candidates: legacy wrappers in `components/tools/weather/*`, `ClockDisplay`, `ContextualRequisition`, terminal overlay.
- Parked idea (discussed, not started): open research + agent reporting layer — opt-in field-observation submissions (planting actuals, forager "stump the AI" photos), agent-compiled attributed reports, one-time-token machine-first endpoint, zone-level geography only, inbound contributor license from day one. See CLAUDE.md for the full note.

## Key Directories
- `app/`: Next.js pages and API routes.
- `components/`: React components (`components/field/` = paper kit).
- `content/`: MDX + JSON content (archive, kb, crops, products).
- `docs/`: Project documentation (Audits, MVP specs, Strategies).
- `lib/`: Shared logic, types, and data fetching.
- `public/`: Static assets (fonts, images, textures).
