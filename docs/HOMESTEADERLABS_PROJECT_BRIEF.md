# HomesteaderLabs — Caloric Security Module
## Project Brief & Development Memory

---

## 1. Project Overview

**Site:** homesteaderlabs.com  
**Goal:** Add a "Caloric Security" module to an existing Next.js site that already has a live weather station and seed planting calendar. This new module closes the loop between production (what the homestead grows) and survival (what the household needs), surfacing three primary metrics: Days of Food, Days of Water, Days of Energy.  
**Audience:** Homesteaders and survivalists. Privacy-suspicious by nature. "No accounts, no cloud" is a feature, not a limitation.  
**Business model:** Lead magnet. Three survival clocks are free. Caloric ROI Report and Companion Advisor are gated. Canning Day trigger is the premium differentiator.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (React) |
| Styling | Tailwind CSS + custom `globals.css` |
| Font | `Courier New` monospace (`var(--font-mono)`) — site-wide |
| Persistence (current) | `localStorage` — stateless, migrating away |
| Persistence (target) | **Dexie.js + IndexedDB** — offline-first, device-local |
| Existing modules | Weather station, seed planting calendar |
| Existing logic | `lib/survivalIndex.ts` — fire risk, water catchment, spray conditions, solar efficiency, livestock stress |

---

## 3. Design System

**Aesthetic:** Brutalist field station / weathered field manual. Military telemetry meets analog homestead.

### CSS Variables (from `globals.css`)

```css
--bg-primary:    #2d3336        /* dark slate */
--bg-secondary:  #373e42        /* slightly lighter slate */
--text-primary:  #E8D3BE        /* warm cream */
--text-secondary: #b5a595       /* muted tan */
--border-primary: #d35400       /* burnt orange — primary accent border */
--accent:        #ff7300        /* vivid orange — highlights, selection, scrollbar */
--shadow-color:  rgba(0,0,0,0.6)
--font-mono:     'Courier New', Courier, monospace
--font-hand:     'Caveat', cursive   /* marginalia only */
```

### Key CSS Classes

- `.brutalist-block` — bordered block with hard box-shadow offset, hover lifts shadow
- `.dymo-label` — black label tape aesthetic, uppercase, tight letter-spacing
- `.field-station-box` — padded panel with `REF_07G` stamp pseudo-element
- `.marginalia` — handwritten annotations (Caveat font), rotated, hidden on mobile
- `.terminal-container` — condensation glitch animation + scan-flash line
- `FieldStationLayout` — wraps pages with grid overlay, corner brackets, LAT/LON header, footer pulse

### UI Rules for New Components
- Monospace font everywhere
- Hard box-shadow offsets (no soft drop shadows)
- Orange (`--accent` / `--border-primary`) for borders and active states
- Cream text on dark slate backgrounds
- Corner bracket decorations on major panels
- `brutalist-block` class for all new card-level containers
- Autonomy clocks should feel like **instrument panels**, not cards

---

## 4. Data Inventory

### Crop JSON Files

| File | Count | Notes |
|---|---|---|
| `vegetables.json` | 21 crops | All have calorie data |
| `herbs.json` | 25 crops | 7 medicinal herbs have NO calorie data (see below) |
| `fruits-annual.json` | 4 crops | All have calorie data |
| `fruits-perennial.json` | 4 crops | All have calorie data |
| **Total** | **54 crops** | |

### Per-Crop Data Shape (consistent across all files)
Every crop has: `id`, `name`, `category`, `icon`, `varieties`, planting dates, `daysToMaturity`, `sun`, `spacing`, `notes`, `lunarAffinity`, `growthHabit`, `yearsToFirstHarvest`, `waterNeedsPerWeek`, `yield`, `preservation`, `uses`, `companions` (array of IDs), `antagonists` (array of IDs).

**Yield object:**
```json
{
  "avgPerPlant": number,
  "unit": "lbs" | "oz" | "bunches" | "bulbs" | "ears",
  "caloriesPer100g": number,
  "proteinPer100g": number,
  "carbsPer100g": number,
  "fatPer100g": number,
  "storageLifeDays": number
}
```

**Preservation array:** Each entry has `method`, `shelfLifeMonths`, `notes`.

### Known Data Gaps — Must Fix Before Building

**1. Non-caloric herbs (7 crops)**
The following have no `caloriesPer100g` — they are medicinal/companion plants, not food crops. They must be flagged explicitly as `non-caloric: true` to prevent corrupting caloric math:

- `echinacea`, `calendula`, `valerian`, `comfrey`, `yarrow`, `st-johns-wort`, `stevia`

**2. Non-weight units requiring a normalization lookup table**
The `yieldCalculations.ts` engine must map these to grams using documented assumptions:

| Unit | Assumed gram weight | Crops affected |
|---|---|---|
| `bunches` | ~100g per bunch | cilantro, dill, chives, lavender |
| `bulbs` | ~40g per bulb | garlic |
| `ears` | ~90g edible yield per ear | corn |

These assumptions must be surfaced to the user in the UI.

**3. `companion-planting.json` is critically incomplete**
The file has only 7 entries. The `companions` and `antagonists` arrays on all 54 crop records are unused by the companion parser because the bidirectional relationship JSON is incomplete. All 54 crops need entries.

- **ID normalization required:** The existing companion JSON uses `"bush-bean"` but the crop JSONs use `"beans-bush"`. **Canonical IDs are the crop JSON IDs.** The companion JSON must be normalized to match.

---

## 5. `survivalIndex.ts` — What Already Exists

The file at `lib/survivalIndex.ts` already calculates:

- **Fire risk** — from temp, humidity, wind, precipitation forecast
- **Water catchment potential** — from 7-day precipitation forecast
- **Spray conditions** — temp/wind/humidity window check
- **Solar efficiency** — from cloud cover and day length
- **Livestock stress** — heat index (NOAA formula) and wind chill

**Output shape:** `SurvivalIndex` object with `fireRisk`, `waterCatchment`, `sprayConditions`, `solarEfficiency`, `livestockStress`, `overall`.

This module becomes the **weather modifier** for the Autonomy Dashboard — its scores apply penalties and bonuses to projected yields and resource estimates.

---

## 6. Architecture

```
Data Sources
  └─ Crop JSONs (54 crops)
  └─ companion-planting.json (needs expansion)
  └─ Weather API → survivalIndex.ts
  └─ HomesteadConfig (user inputs + manual actuals)
         ↓
Calculation Engine
  └─ yieldCalculations.ts     — units → grams → kcal
  └─ decayCalculations.ts     — spoilage curves
  └─ waterAutonomy.ts         — catchment + household usage
  └─ preservationCost.ts      — energy + water deduction on preservation
         ↓
State + Persistence (Dexie.js / IndexedDB)
  └─ FieldStationContext.tsx
       └─ HomesteadConfig interface
       └─ SurvivalManifest interface
  (offline-first · device-local · never leaves device)
         ↓
UI Modules
  └─ AutonomyDashboard       — 3 survival clocks
  └─ Caloric ROI Report      — [GATED] kcal per sq ft ranking
  └─ Companion Advisor       — [GATED] antagonist alerts
  └─ Canning Day Trigger     — [PREMIUM] solar surplus → preserve recommendation
         ↓
User Output
  └─ "Days of Food / Water / Energy"
  └─ Confidence indicators
  └─ Manual actuals override inputs
  └─ Frost + drought alerts
```

### Key Formulas

**Caloric Security:**
```
(Stored Calories × Decay Modifier) + (Projected Yield × Skill Level)
─────────────────────────────────────────────────────────────────────  = Days of Food
              Household Size × Dynamic Caloric Need
```
*Dynamic Caloric Need: 2000 kcal baseline, scales to 3500+ kcal during winter or heavy labor seasons.*

**Hydration Security:**
```
Current Stored + (Forecasted Rain × Roof Area × Collection Efficiency)
──────────────────────────────────────────────────────────────────────  = Days of Water
                    Household Size × Daily Need (1 gal/person/day)
```
*Note: Irrigation demand is separate from household water and must be tracked independently.*

**Energy Security:**
```
(Battery Capacity + Solar Forecast − Preservation Load)
───────────────────────────────────────────────────────  = Hours of Power
                  Baseload Watts
```

---

## 7. TypeScript Interfaces to Define

```typescript
interface HomesteadConfig {
  householdSize: number;
  skillLevel: number;           // 0.6 (Novice) → 1.0 (Expert)
  waterCatchment: {
    roofAreaSqFt: number;
    collectionEfficiency: number;   // 0.75–0.95
    firstFlushDivert: number;       // gallons per rain event
    totalStorageCapacity: number;   // gallons
  };
  energy: {
    batteryCapacityAh: number;
    solarArrayWatts: number;
    baseloadWatts: number;
  };
}

interface InventoryItem {
  id: string;
  type: 'crop' | 'water' | 'fuel' | 'seed';
  quantity: number;
  status: 'planned' | 'active' | 'stored';
  dateHarvested?: Date;
  preservationMethod?: 'fresh' | 'canned' | 'dehydrated' | 'frozen';
  lastUpdated: Date;
}
```

---

## 8. Decay Curve Model

Use a simple **two-phase linear model** to keep math honest and auditable:

- **Phase 1:** 100% caloric value from day 0 → 70% of shelf life elapsed
- **Phase 2:** Linear decay from 100% → 0% between 70% and 100% of shelf life

This must be documented in the UI so users understand the assumption.

---

## 9. Weather Modifier Rules

These integrate `survivalIndex.ts` output into the autonomy engine:

| Trigger | Condition | Effect |
|---|---|---|
| Drought Warning | `waterCatchment.score < 20` for 14 days | Flag "Crop Failure Risk" · reduce projected yields by 30% |
| Frost Alert | Freeze detected before `harvestDate` | Terminal alert: "Protect Inventory" |
| Solar Surplus | `solarEfficiency.percentage > 90%` | Suggest "Canning Day" |
| Canning Day | Triggered | Deduct preservation water + energy from hydration/energy autonomy scores |

---

## 10. Confidence System

Each autonomy score must carry a `confidence` field:

- **High** — manual actuals entered recently (within 48h)
- **Medium** — actuals entered > 48h ago, weather data fresh
- **Low** — projections only, no manual override

Display this as a visible indicator on each survival clock. The system should never appear falsely precise.

---

## 11. Build Sequence

| Phase | Task | Status |
|---|---|---|
| 0 | Expand `companion-planting.json` to all 54 crops, normalize IDs to crop JSON canonical IDs | ⬜ Not started |
| 1a | `yieldCalculations.ts` — unit normalization lookup + kcal engine | ⬜ Not started |
| 1b | Flag 7 non-caloric herbs as `non-caloric` in herbs.json | ⬜ Not started |
| 1c | `decayCalculations.ts` — two-phase spoilage model | ⬜ Not started |
| 1d | `waterAutonomy.ts` — catchment + household/irrigation split | ⬜ Not started |
| 1e | `preservationCost.ts` — energy + water cost map | ⬜ Not started |
| 2 | Add Dexie.js, define `HomesteadConfig` + `SurvivalManifest` interfaces | ⬜ Not started |
| 2b | First-run wizard UI (onboarding for `HomesteadConfig`) | ⬜ Not started |
| 3 | `AutonomyDashboard` component — 3 survival clocks, instrument panel aesthetic | ⬜ Not started |
| 3b | `ActualsInput` modal — manual override for tank level, battery, etc. | ⬜ Not started |
| 4 | Wire `survivalIndex.ts` as modifier into autonomy scores | ⬜ Not started |
| 4b | Frost Guard alert listener (7-day warning, Terminal notification) | ⬜ Not started |
| 5 | Caloric ROI Report — rank crops by kcal/sq ft [GATED] | ⬜ Not started |
| 5b | Companion Advisor UI — antagonist alerts + placement suggestions [GATED] | ⬜ Not started |
| 6 | Canning Day trigger — solar surplus → preserve → auto-deduct [PREMIUM] | ⬜ Not started |

---

## 12. Key Design Decisions (Resolved)

| Question | Decision | Rationale |
|---|---|---|
| Database? | Dexie.js + IndexedDB | localStorage 5MB cap will be hit; IndexedDB is still 100% offline and private |
| Privacy messaging | "Your data never leaves your device" | Stronger and more accurate than "we don't use a database" |
| Multi-user? | No — single device, single homestead | Simplifies architecture; no auth needed; matches audience |
| Yield accuracy | Use ideal yields × `skillLevel` coefficient | Honest projection without overcomplicating the model |
| Unit normalization | Lookup table with documented assumptions | Bunches/bulbs/ears exposed to user, not hidden |
| Decay model | Two-phase linear (70% shelf life = full value) | Simple, auditable, honest |
| Companion ID canonical | Crop JSON IDs (e.g. `beans-bush`, not `bush-bean`) | Parser queries crop JSONs; companion JSON must match |
| Non-caloric herbs | Flag as `non-caloric: true`, exclude from food math | Prevents medicinal plants from corrupting caloric ROI |
| Gating strategy | Clocks free · ROI + Companion gated · Canning Day premium | Clocks are the hook; intelligence is the product |

---

## 13. Future Expansion (Backlog)

- Macro-nutrient breakdown (carbs vs fats vs proteins across the whole garden)
- Trade/barter value — "Scarcity Values" for high-density crops (garlic, potatoes)
- Off-grid recipe integration — suggest meals based on what is currently at harvest status
- Seed security tracking — auto-deduct a percentage of yield for year-two seed saving
- `caloricDensityPerSqFt` pre-computed field on each crop record (spacing data already present)

---

*Last updated: Planning session — architecture locked, no code written yet.*
