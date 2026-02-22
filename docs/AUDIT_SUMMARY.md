# Codebase Audit & Optimization Report

**Project:** Homesteader Labs (Next.js 14)  
**Date:** February 15, 2026  
**Auditor:** Gemini CLI

## 🚀 Optimizations Implemented

### 1. Performance: Lazy-loading 3D Engine
- **Issue:** `STLViewer` (Three.js) was imported synchronously on the fabrication page, significantly increasing the initial bundle size.
- **Fix:** Implemented `next/dynamic` with `ssr: false` for the `STLViewer` component in `app/tools/fabrication/page.tsx`.
- **Benefit:** Improved initial page load speed and reduced JavaScript execution time on non-fabrication pages.

### 2. DX: Library Consolidation
- **Issue:** Redundant and confusing `app/lib` directory.
- **Fix:** Moved all domain logic and utility functions to the root `/lib` directory and updated all project imports to use the `@/lib` alias.
- **Benefit:** Cleaner project structure, consistent import patterns, and better separation of concerns.

### 3. UI System: Component Standardization
- **Issue:** Manual usage of `brutalist-block` CSS classes instead of the dedicated `<BrutalistBlock />` component.
- **Fix:** Refactored `NewsletterSignup` and `ToolsShowcase` to use standard UI kit components (`BrutalistBlock`, `Typography`, `Button`).
- **Benefit:** Improved design consistency and easier maintenance of global styles.

### 4. Terminal Feature: Low-FX Toggle
- **Issue:** No user-facing way to toggle the performance-heavy grit/noise visual effects.
- **Fix:** Added `fx` command to the terminal overlay that toggles "Low-FX" mode and persists the setting in `localStorage`.
- **Benefit:** Improved accessibility for users on older hardware or those with sensory sensitivities.

## 🛠️ Critical Fixes

### 1. Import Path Resolution
- Fixed broken imports after moving library files.
- Resolved type resolution issues in the planting calendar tool by standardizing type locations in `lib/tools/planting-calendar/types`.

## 📈 Suggested Next Steps

### 1. High Priority
- **Testing Coverage:** Extend Vitest suites to cover UI components using `@testing-library/react`.
- **API Security:** Ensure environment variables for weather APIs or future ConvertKit integrations are properly configured in Vercel.
- **Image Optimization:** Replace placeholder SVGs with optimized Next.js `Image` components and actual product assets.

### 2. Medium Priority
- **Accessibility Audit:** Run `axe-core` or similar tools to ensure the brutalist aesthetic doesn't compromise readability (especially contrast ratios in dark mode).
- **SEO Enhancements:** Implement the Programmatic SEO strategy for city-specific planting calendars.

### 3. Low Priority
- **Dymo Label Generator:** Create a utility to generate Dymo-style labels from text dynamically to replace static CSS implementation where appropriate.

---
**Status:** All critical performance and structural optimizations completed. Codebase is stable and ready for deployment.
