# Codebase Audit & Architectural Roadmap

**Project:** Homesteader Labs (Next.js 14)  
**Date:** February 15, 2026  
**Auditor:** Gemini CLI

---

## 🏗️ Architectural Findings

### 1. Component Organization (Urgent)
- **Finding:** Redundant component directories (`/components` vs `/app/components`). This leads to import confusion and potential duplicate code.
- **Suggestion:** Standardize on a single root `/components` directory.
- **Action:** Move `/app/components/*` to `/components/*` and update imports. Use `@/components` path alias.

### 2. Domain Logic & Testing
- **Finding:** Critical algorithms (Survival Index, Frost Risk) are well-isolated in `/app/lib` but lack unit tests.
- **Suggestion:** These are the "intellectual property" of the site. They should be verified with a test suite.
- **Action:** Install `vitest` and add `survivalIndex.test.ts` to ensure edge cases (e.g., extreme heat + low humidity) are handled correctly.

### 3. Client vs Server Components
- **Finding:** Some components (like Navigation) were missing `"use client"` after refactoring, causing build failures. 
- **Suggestion:** Establish a clearer naming convention or boundary for client-side interactivity.
- **Action:** Use the `.client.tsx` suffix for components that explicitly require hooks, or keep them strictly in a `client/` subdirectory.

---

## 🎨 Styling & UI System

### 1. UI Kit Integrity
- **Finding:** The newly created UI kit in `app/components/ui` is robust but should be the *only* source of truth for brutalist elements.
- **Suggestion:** Audit remaining legacy classes like `field-station-box` in `globals.css` and migrate them to the UI kit.
- **Action:** Replace all manual `brutalist-block` CSS usage with the `<BrutalistBlock />` component.

### 2. Performance (Visual Effects)
- **Finding:** Global grit/noise overlays are now in `VisualEffects.tsx`.
- **Suggestion:** Add a "Low FX" mode in the User Settings (or Terminal) to disable these for older devices or users with light sensitivity.
- **Action:** Add a `useLocalStorage` state to toggle `VisualEffects` visibility.

---

## 📈 Strategic Recommendations

### 1. Programmatic SEO (Phase 1)
- **Finding:** The strategy is sound but requires a data pipeline.
- **Suggestion:** Instead of a giant JSON file, consider a lightweight SQLite or local Markdown-based database for the 500 cities to keep the repo manageable.
- **Action:** Setup `/content/cities/[state]/[city].md` for local context overrides.

### 2. Email Capture (Verification)
- **Finding:** Email capture is currently simulated.
- **Suggestion:** Implement a "serverless" function approach for the ConvertKit integration to keep API keys secure.
- **Action:** Create `/app/api/subscribe/route.ts` and use environment variables for keys.

### 3. Fabrication Workbench
- **Finding:** Three.js is a heavy dependency.
- **Suggestion:** Lazy-load the `STLViewer` component to prevent it from bloating the main bundle.
- **Action:** Use `const STLViewer = dynamic(() => import('../components/fabrication/STLViewer'), { ssr: false })`.

---

## 🛠️ Suggested Technical Debt Cleanup

| Task | Priority | Benefit |
| :--- | :--- | :--- |
| Consolidate `/components` | High | Eliminates import errors and redundancy |
| Add Unit Tests for Index Logic | Med | Ensures reliability of weather/planting data |
| Lazy-load STL Viewer | Med | Improves TTI (Time to Interactive) |
| Environment Variable Audit | High | Security & Portability |
| Low-FX Toggle | Low | Accessibility |

---

**Next Steps:**
1. Finalize component consolidation.
2. Implement first 10 city pages for SEO testing.
3. Setup `vitest` for core logic.
