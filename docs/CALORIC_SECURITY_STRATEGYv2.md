# STRATEGY: CALORIC SECURITY & SURVIVAL INVENTORY SYSTEM

## 1. Overview
This document outlines the strategic integration of the **Planting Calendar** with a **Survival Inventory System**. The goal is to move from simple date calculations to a comprehensive "Caloric Security" dashboard that helps homesteaders and survivalists quantify their self-reliance.

## 2. Core Concepts
The system will bridge the gap between **Production** (Growing/Catching) and **Consumption** (Survival Needs), while accounting for the inherent losses in the system.

### A. The "Closed Loop" Architecture
- **Production (Inputs):** Seeded quantities, roof catchment area (sq ft), storage capacity (gallons), solar array capacity.
- **Environmental (Modifiers):** Real-time weather data (precipitation probability), evaporation rates, frost dates, lunar phases.
- **System Losses (Decay):** Spoilage curves, water/energy costs of food preservation, seed saving deductions.
- **Analytics (Logic):** Yield-to-calorie conversion, runoff efficiency coefficients, battery discharge curves, dynamic caloric consumption.
- **Security (Outputs):** "Days of Autonomy" (How many days can this homestead survive on current/projected resources?).

---

## 3. Technical Implementation Plan

### Phase 1: Data Augmentation (Static)
- Map all crops to standard caloric values per 100g.
- Standardize discrete yield units (ears, heads, bunches) to base gram weights.
- Map preservation methods to shelf-life limits (spoils in 5 days vs. 12 months).
- Map companion planting antagonist/companion matrices.

### Phase 2: User Configuration & Persistence
Update `FieldStationContext.tsx` to include a `HomesteadConfig` and `SurvivalManifest`.
- **Storage Architecture:** Migrate from `localStorage` to `IndexedDB` (via Dexie.js or localForage) to support larger datasets, complex objects, and asynchronous queries while remaining 100% local, offline, and private.
- **Homestead Config:**
  ```typescript
  interface HomesteadConfig {
    householdSize: number;
    skillLevel: number; // Coefficient (0.6 for Novice, 1.0 for Expert) to scale ideal yields
    waterCatchment: {
      roofAreaSqFt: number;         // Footprint of the collection surface
      collectionEfficiency: number; // Coefficient (0.75 - 0.95) based on material
      firstFlushDivert: number;     // Gallons diverted per rain event for filtration
      totalStorageCapacity: number; // Size of cistern/tank array
    };
    energy: {
      batteryCapacityAh: number;
      solarArrayWatts: number;
      baseloadWatts: number;
    };
  }



## Data Structure:
```typescript
interface InventoryItem {
  id: string;
  type: 'crop' | 'water' | 'fuel' | 'seed';
  quantity: number;      // e.g., 24 plants, 500 gallons current
  status: 'planned' | 'active' | 'stored';
  dateHarvested?: Date;  // Used to calculate spoilage decay
  preservationMethod?: 'fresh' | 'canned' | 'dehydrated' | 'frozen';
  lastUpdated: Date;
}

```



### Phase 3: The "Autonomy Dashboard"

A new UI module within the `SurvivalDashboard` that translates raw inventory and catchment potential into survival metrics.

* **Hydration Security:** `(Current Stored + (Forecasted Rain * Area * Efficiency)) / (Household Size * Daily Needs) = Days of Water`.
* **Caloric Security:** `(Current Stored Calories * Decay Modifier) + (Projected Yield * Skill Level) / (Household Size * Dynamic Caloric Need) = Days of Food`.
* *Note: Dynamic Caloric Need scales from 2000 kcal baseline up to 3500+ kcal during winter or heavy labor (planting/harvesting) seasons.*


* **Energy Security:** `(Battery Capacity + Solar Forecast - Preservation Load) / (Baseload Watts) = Hours of Power`.

---

## 4. Integration with Weather Telemetry

The existing `lib/survivalIndex.ts` will act as a real-time "Modifier" for the inventory:

* **Drought Warning:** If `waterCatchment` score is < 20 for 14 days, flag "Crop Failure Risk" and reduce projected yields by 30%.
* **Frost Alert:** If a freeze is detected before `harvestDate`, trigger a terminal alert to "Protect Inventory."
* **Solar Surplus:** If `solarEfficiency` is > 90%, suggest "Dehydration/Canning Day" to utilize excess power for food preservation.
* **Preservation Cost Penalty:** If "Canning Day" is triggered, automatically deduct the requisite water and energy from the projected Hydration/Energy security modules.

---

## 5. Future Expansion (The "Prepper" Niche)

* **Macro-Nutrient Tracking:** Breakdown of Carbs vs. Fats vs. Proteins in the garden.
* **Trade/Barter Value:** Assigning "Scarcity Values" to specific high-density crops (e.g., Garlic, Potatoes).
* **Off-Grid Recipe Integration:** Suggesting meals based on what is currently hitting "Harvest" status in the calendar to prevent fresh spoilage.
* **Seed Security Tracking:** Deducting a percentage of total yield automatically to account for year-two seed saving requirements.

---

## 6. Discussion Points & Resolutions

1. **Accuracy vs. Simplicity:** We will use "Ideal Yields" from the dataset but apply a global "Skill Level" modifier in the `HomesteadConfig` to scale projections realistically.
2. **Privacy & Data Storage:** Due to the highly sensitive nature of survival manifests, we will strictly enforce an offline-first architecture using `IndexedDB`. The UI will explicitly state that all data never leaves the device.
3. **Hardware Integration & Telemetry:** We will provide "Projected" values based on weather telemetry, but we MUST include manual override inputs (e.g., "Tank Level Actuals") because environmental projections cannot account for leaks, mechanical failures, or unlogged usage.

---

## TO DO

### 1. Logic & Data Layer (The "Engine")

* [ ] Implement `yieldCalculations.ts`: Create a utility to normalize various units (lbs, oz, ears, bulbs) into base grams using a lookup table, then calculate total potential calories.
* [ ] Implement `decayCalculations.ts`: Create a utility that reads an item's `dateHarvested` and `preservationMethod`, cross-references the crop's `shelfLifeMonths`, and applies a caloric deduction curve for spoilage.
* [ ] Create `waterAutonomy.ts`: Develop logic to calculate "Days of Hydration" by comparing `totalStorageCapacity` and `roofAreaSqFt` against real-time `precipitationProbability`.
* [ ] Create `preservationCost.ts`: Map out the water and energy costs for canning vs. dehydrating vs. freezing, and deduct these from the global autonomy scores when crops are moved to `stored` status.
* [ ] Companion Relationship Parser: Add a utility to `cropLoader.ts` that cross-references `companion-planting.json` to flag "Antagonist Alerts" if a user selects incompatible crops.

### 2. Context & State (The "Homestead OS")

* [ ] Update `FieldStationContext.tsx`:
* [ ] Define and implement the `HomesteadConfig` interface.
* [ ] Define and implement the `SurvivalManifest`.
* [ ] Replace `localStorage` hooks with `IndexedDB` (e.g., Dexie.js) for robust local persistence.


* [ ] Survival Modifiers: Integrate `lib/survivalIndex.ts` output into the context so that a low "Water Score" automatically applies a "Stress Penalty" (e.g., -20%) to projected yields.

### 3. UI & Dashboard (The "Interface")

* [ ] `AutonomyDashboard` Component: Create a high-visibility, brutalist-style module that displays three primary "Survival Clocks" (Food, Water, Energy).
* [ ] `ActualsInput` Modal: A critical UI component for users to manually override projected telemetry (e.g., "Set Water Tank to 45%").
* [ ] Companion Advisor UI: A "Garden Optimization" view that suggests where to place crops based on the `mechanism` field.

### 4. Validation & Intelligence

* [ ] Frost Guard Alerts: Create a listener that triggers a Terminal notification (ALT+T) if the `firstFallFrost` date is within 7 days and the user has "Active" crops.
* [ ] Caloric ROI Report: A summary tool that ranks the user's current garden by "Caloric Density" to identify gaps in their strategy
