# CSS & UI Styling Roadmap

Goal: Formalize the "Brutalist / Field Manual" aesthetic into a maintainable, high-performance UI kit.

## Phase 1: Infrastructure & Configuration (COMPLETED)
- [x] Refactor `tailwind.config.ts` to fully map CSS variables.
- [x] Clean up `app/globals.css` to use Tailwind-compatible variable names.
- [x] Implement a standardized color palette (Primary, Secondary, Accent, Border).

## Phase 2: Core UI Components (IN PROGRESS)
- [x] **Button**: Unified component for `Link` and `button` with brutalist hover effects.
- [x] **BrutalistBlock (Card)**: Container with customizable borders, shadows, and reference tags.
- [x] **Badge**: Status indicators (e.g., SYSTEM_ONLINE) and labels.
- [x] **DymoLabel**: Tactile physical label effect for headers and tags.
- [x] **Marginalia**: Reusable component for "handwritten" notes.
- [x] **Typography**: Standardized `Heading`, `Text`, and `Code` components.

## Phase 3: Layout & Advanced Effects (COMPLETED)
- [x] **FieldStationLayout**: Grid systems mimicking technical diagrams.
- [x] **TerminalOverlay**: Refactor for better responsiveness and accessibility.
- [x] **Grit/Noise Optimization**: Move overlays to a more performant implementation.
- [x] **Marginalia**: Reusable component for "handwritten" notes. (Previously in Phase 2)

## Phase 4: Polish & Performance (COMPLETED)
- [x] Responsive design audit across all "Brutalist" elements.
- [x] Dark/Light mode refinement for better legibility.
- [x] Reduced motion support for animations.

## Summary of Accomplishments
- **Foundational UI Kit**: Established a robust, themed component library in `app/components/ui`.
- **Performance Optimization**: Optimized global visual effects (grit, noise, scanlines) for better frame rates.
- **Visual Consistency**: Migrated all core pages (Home, Shop, Archive, Blog, Planting Calendar, Weather Station, Fabrication Workbench) to the new design system.
- **Enhanced UX**: Improved mobile navigation, terminal responsiveness, and technical metadata display.
