# Weather Station Code Audit

**Project:** Homesteader Labs — Weather Station  
**Date:** March 16, 2026  
**Files Reviewed:** 14 files (7 components, 4 lib modules, 3 utility files)  
**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Open-Meteo API

---

## Architecture Overview

The weather station is a multi-dashboard homesteading tool built around Open-Meteo's free API tier. It features a telemetry header, 7-day + hourly forecasting, radar view, moon phase tracking, a growing season GDD tracker, a survival index (fire, water, solar, spray, livestock), and a planting index (frost risk, soil, planting windows). Locations are managed via city/zip/coordinate input. The brutalist/military-HUD aesthetic is consistent and distinctive.

---

## Todo List — Prioritized Findings

### CRITICAL

**1. GDD accumulation compounds infinitely on every render**  
`GrowingSeasonTracker.tsx` — The second `useEffect` adds the *forecast-derived* GDD to `totalGDD` on every render cycle triggered by `forecast` or `locationName` changes. Since `totalGDD` is set inside the same effect that depends on values it mutates, this creates a feedback loop. Each re-render inflates the number further, and the inflated value is persisted to `localStorage`, meaning the corruption survives page refreshes.

```
// Current: totalGDD grows unboundedly
const newTotal = totalGDD + gdd;   // <-- adds forecast GDD to already-accumulated total
setTotalGDD(newTotal);
localStorage.setItem(..., { gdd: newTotal, ... });
```

**Fix:** Separate historical GDD (loaded from storage) from forecast GDD (calculated fresh). Never sum them in a re-running effect. Use a ref or a single initialization pass for the stored value.

---

**2. Spray conditions score is binary (0 or 100) — no gradient**  
`survivalIndex.ts` — `calculateSprayConditions` returns either `score: 100` or `score: 0`. This feeds directly into the `overall` survival index as a full 20% weight. One degree outside the temp band swings the overall score by 20 points, which is misleading for end users making operational decisions.

**Fix:** Use a graduated scoring system (e.g., linear interpolation within acceptable ranges, partial credit for near-miss conditions).

---

**3. No error boundaries or loading states on dashboards**  
`SurvivalDashboard.tsx`, `PlantingDashboard.tsx`, `GrowingSeasonTracker.tsx` — None of these components handle the case where `index` or `forecast` data is malformed, partially loaded, or undefined. A single missing field (e.g., `index.fireRisk` is `undefined`) will crash the entire dashboard with an unhandled TypeError.

**Fix:** Add null/undefined guards, or wrap each dashboard in a React Error Boundary. Consider skeleton loading states.

---

### HIGH

**4. Weather alerts array is always empty**  
`weatherApi.ts` — `transformWeatherData` hardcodes `alerts: []` with a comment noting Open-Meteo doesn't provide alerts. The `fetchWeatherAlerts` function exists but is never called from `fetchWeatherData`. The `WeatherAlert` type and the alert severity system exist in `weatherTypes.ts` but are effectively dead code from the user's perspective.

**Fix:** Call `fetchWeatherAlerts` alongside `fetchWeatherData` and merge results. This is especially important for a homesteading tool where severe weather alerts are safety-critical.

---

**5. `fetchHistoricalFrostData` is a stub that always returns null**  
`weatherApi.ts` — This function is declared but returns `null` unconditionally. If any consumer relies on it for frost date estimation, they silently get nothing. The planting index falls back to forecast-only frost calculations, which are limited to 14 days.

**Fix:** Either implement it (NOAA's API is free) or remove the dead function and document the limitation.

---

**6. Historical comparison fetches full-year data for a single day**  
`weatherApi.ts` — `fetchHistoricalComparison` requests Jan 1 through Dec 31 of the current year from the archive API just to look up one day's data. This is a wasteful request that returns far more data than needed and will be slow on mobile connections.

**Fix:** Narrow the date range to a ±15 day window around the target date, or fetch monthly summaries.

---

**7. In-memory cache has no size limit**  
`weatherApi.ts` — `weatherCache` is a `Map` that grows indefinitely as users switch between locations. While the TTL prevents stale reads, entries are never evicted. In a long-running session with many location switches, this leaks memory.

**Fix:** Add a max-size eviction policy (LRU) or clear expired entries periodically.

---

### MEDIUM

**8. `daysUntilFull` logic is incorrect for waning phases**  
`weatherApi.ts` — When the moon is past full (`lunarAge > synodicMonthDays / 2`), `daysUntilFull` calculates `synodicMonthDays - lunarAge`, which gives days until the *next new moon*, not the next full moon. The next full moon would be approximately `(synodicMonthDays * 1.5) - lunarAge`.

**Fix:** For waning phases, add a full synodic half-cycle to get the correct distance to the next full moon.

---

**9. Planting index slices `forecast[0:30]` but API only returns 14 days**  
`plantingIndex.ts` — `calculateFrostRisk` takes `forecast.slice(0, 30)` for the 30-day risk window, but `fetchWeatherData` only requests `forecast_days: "14"`. The 30-day frost risk is actually just the 14-day frost risk, which is silently misleading to the user.

**Fix:** Either increase the forecast window (Open-Meteo supports 16 days max on free tier) and label it accurately, or clearly label the 30-day estimate as extrapolated/limited.

---

**10. Soil workability uses air temp minus 5° as soil temp estimate**  
`plantingIndex.ts` — When `soilTemperature` is unavailable, the fallback is `current.temperature - 5`. Soil temperature can deviate from air temperature by 15-20°F depending on season, depth, moisture, and sun exposure. This rough estimate can trigger incorrect "frozen" or "workable" status.

**Fix:** Open-Meteo does provide `soil_temperature_0cm` — it's already in the API params for daily but missing from the `current` request. Add `soil_temperature_0cm` to the current weather params.

---

**11. `WeatherProvider` interface is defined but never used**  
`weatherTypes.ts` — The `WeatherProvider` interface suggests a provider-abstraction pattern, but the codebase is tightly coupled to Open-Meteo. This is dead code that may confuse future contributors.

**Fix:** Either implement the abstraction (useful if you want NWS/WeatherAPI.com fallback) or remove the interface.

---

**12. Radar iframe has no loading state or error handling**  
`RadarView.tsx` — The RainViewer iframe loads silently. If the service is down or the user is offline, they see a blank area with no feedback. The "LIVE" pulse indicator suggests active data even when the iframe hasn't loaded.

**Fix:** Add an `onLoad`/`onError` handler to the iframe. Show a loading skeleton and degrade gracefully if RainViewer is unreachable.

---

### LOW

**13. `eslint-disable` comment suppressing exhaustive-deps**  
`GrowingSeasonTracker.tsx` — The `eslint-disable-next-line react-hooks/exhaustive-deps` comment hides a real dependency issue (the effect references `totalGDD` and `seasonStart` without listing them). This is symptomatic of the GDD accumulation bug in item #1.

**Fix:** Resolving item #1 should also eliminate the need for the eslint suppression.

---

**14. SVG charts don't handle zero-length or single-point data**  
`WeatherChart.tsx`, `HourlyChart.tsx` — If `days.length === 1`, the path generation divides by `(days.length - 1)` which is zero, producing `NaN` coordinates. The `length === 0` guard exists, but single-point data will render a broken SVG.

**Fix:** Add a `length < 2` guard, or render a single data point as a dot instead of a line.

---

**15. Forecast date labels may show wrong day for timezone edge cases**  
`ForecastGrid.tsx` — `new Date(day.date)` where `day.date` is a string like `"2026-03-16"` will be parsed as UTC midnight. In western US timezones, this renders as the previous day. The first entry is hardcoded as "ENTRY TODAY" which masks this, but days 2-7 could be off by one.

**Fix:** Parse dates with explicit timezone handling, or append `T12:00:00` to avoid the UTC-midnight rollback issue.

---

**16. `NWSAlertFeature` interface is locally defined instead of shared**  
`weatherApi.ts` — The NWS alert feature interface is defined inline in weatherApi.ts rather than in `weatherTypes.ts` with the rest of the types.

**Fix:** Move to `weatherTypes.ts` for consistency.

---

**17. Hardcoded growing season start (March 20)**  
`GrowingSeasonTracker.tsx` — Spring equinox is used as a universal season start, but actual growing seasons vary dramatically by zone (Zone 3 might not start until May; Zone 9 could start in February).

**Fix:** Derive season start from the user's growing zone or latitude, or let users configure it.

---

---

## Insights

**Strong foundations, homestead-specific value is real.** The survival index, planting index, and GDD tracker are genuinely useful features that go well beyond a typical weather app. The combination of fire risk, spray conditions, and livestock stress into a single operational readiness score is clever and practical for the target audience.

**The brutalist HUD aesthetic is cohesive and well-executed.** The monospace typography, military-style labels (refTags, "EXEC_INIT", "COMM_LINK_FAILURE"), and minimal color palette create a distinctive identity. The consistent use of `BrutalistBlock` as a container primitive keeps the visual language tight.

**The API layer is well-structured for a free-tier setup.** Using Open-Meteo avoids API key complexity, and the caching strategy is sound in principle. The geocoding fallback chain (Zippopotam → Open-Meteo) for zip codes is a nice touch.

**The biggest systemic risk is the GDD bug (#1).** Because it persists corrupted data to localStorage, users who've been running the app for a while may have wildly inflated GDD values with no way to self-correct. This should be the first fix.

---

## Suggested Improvement: Frost Alert Notification Banner

**What:** A persistent, dismissable banner at the top of the weather station that activates when the 7-day frost probability exceeds 60% and the user has a planting window currently open. The banner would say something like: *"Frost risk detected in the next 7 days — your planting window may close. Consider covering tender transplants."*

**Why this matters for homesteaders:** The planting dashboard and survival dashboard are currently separate views. A user checking the radar or hourly chart might miss that frost risk has spiked. Homesteaders can lose an entire season's transplants to a single unexpected frost. A cross-cutting banner bridges the gap between "data display" and "actionable warning" — which is the core promise of a homesteading weather tool.

**Implementation:** This is lightweight — read the already-calculated `plantingIndex.frostRisk.next7Days` and `plantingIndex.plantingWindow.opens`, and conditionally render a `BrutalistBlock` with `border-red-500/40` styling at the top of the main layout. Add a dismiss button that stores the dismissal in sessionStorage (so it returns on next visit if conditions persist).
