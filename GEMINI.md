# Homesteader Labs - Project Context

## Project Overview
Homesteader Labs is a Next.js 14 application providing tools, hardware, and field documentation for homesteaders, survivalists, and self-reliant builders. The site features a "Brutalist" aesthetic with a focus on off-grid resilience, fabrication, and survival tech.

### Core Technologies
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with Brutalist UI components)
- **3D Rendering:** Three.js (via `STLViewer` for fabrication tools)
- **Content:** MDX (for blog and archive posts)
- **Icons:** Lucide React
- **Testing:** Vitest with JSDOM

### Key Features
- **Planting Calendar:** Data-driven tool for managing crop schedules.
- **Weather Tools:** Survival and planting-focused weather dashboards.
- **Fabrication:** 3D STL viewer for hardware designs and field tools.
- **Shop:** Catalog for off-grid hardware and survival gear.
- **Terminal:** Interactive overlay (`ALT+T`) for command-line style interactions.

---

## Building and Running

### Development
```bash
npm run dev
```
Starts the development server on `http://localhost:3000`.

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
- **Modular Components:** Feature-specific components are in `components/<feature>/`, while shared UI elements are in `components/ui/`.
- **Domain Logic:** All business logic, types, and utility functions are centralized in the `lib/` directory. Use the `@/lib` alias.
- **Content Management:** MDX files are stored in `content/` and parsed using `lib/posts.ts` and `lib/products.ts`.

### UI & Styling
- **Brutalist Aesthetic:** Use standard UI components (`BrutalistBlock`, `Typography`, `Button`, `Badge`) to maintain the project's visual identity.
- **Shadows & Borders:** Use the `shadow-brutalist` and `border-3` classes for consistency.
- **Color Palette:** Strictly follow the CSS variables defined in `app/globals.css` and mapped in `tailwind.config.ts`.
- **Dark Mode:** Supports `.dark` class toggling.

### Performance
- **Lazy Loading:** 3D components like `STLViewer` should be loaded dynamically using `next/dynamic` with `ssr: false` to keep the initial bundle size small.

### Testing
- **Unit Tests:** Place logic tests in `lib/` with a `.test.ts` extension (e.g., `lib/survivalIndex.test.ts`).
- **UI Tests:** Use `@testing-library/react` for component testing within Vitest.

---

## Key Directories
- `app/`: Next.js pages and API routes.
- `components/`: React components.
- `content/`: MDX content files.
- `docs/`: Project documentation (Audits, MVP specs, Strategies).
- `lib/`: Shared logic, types, and data fetching.
- `public/`: Static assets (fonts, images, textures).
