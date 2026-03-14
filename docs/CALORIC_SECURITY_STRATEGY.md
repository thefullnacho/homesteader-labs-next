# STRATEGY: CALORIC SECURITY & SURVIVAL INVENTORY SYSTEM

## 1. Overview
This document outlines the strategic integration of the **Planting Calendar** with a **Survival Inventory System**. The goal is to move from simple date calculations to a comprehensive "Caloric Security" dashboard that helps homesteaders and survivalists quantify their self-reliance.

## 2. Core Concepts
The system will bridge the gap between **Production** (Growing/Catching) and **Consumption** (Survival Needs).

### A. The "Closed Loop" Architecture
- **Production (Inputs):** Seeded quantities, roof catchment area (sq ft), storage capacity (gallons), solar array capacity.
- **Environmental (Modifiers):** Real-time weather data (precipitation probability), evaporation rates, frost dates, lunar phases.
- **Analytics (Logic):** Yield-to-calorie conversion, runoff efficiency coefficients, battery discharge curves.
- **Security (Outputs):** "Days of Autonomy" (How many days can this homestead survive on current/projected resources?).

---

## 3. Technical Implementation Plan

### Phase 1: Data Augmentation (Static)
... (rest of Phase 1)

### Phase 2: User Configuration & Persistence
Update `FieldStationContext.tsx` to include a `HomesteadConfig` and `SurvivalManifest`.
- **Water Catchment Config:**
  ```typescript
  interface CatchmentConfig {
    roofAreaSqFt: number;      // Footprint of the collection surface
    collectionEfficiency: number; // Coefficient (0.75 - 0.95) based on material (metal vs shingle)
    firstFlushDivert: number;  // Gallons diverted per rain event for filtration
    totalStorageCapacity: number; // Size of cistern/tank array
  }
  ```
- **Storage:** Use `localStorage` to persist user data between sessions.
- **Data Structure:**
  ```typescript
  interface InventoryItem {
    id: string;
    type: 'crop' | 'water' | 'fuel';
    quantity: number;      // e.g., 24 plants, 500 gallons current
    status: 'planned' | 'active' | 'stored';
    lastUpdated: Date;
  }
  ```

### Phase 3: The "Autonomy Dashboard"
A new UI module within the `SurvivalDashboard` that translates raw inventory and catchment potential into survival metrics.
- **Hydration Security:** `(Current Stored + (Forecasted Rain * Area * Efficiency)) / (Household Size * 1 Gallon) = Days of Water`.
- **Caloric Security:** `(Total Plants * Yield * Calories) / (Household Size * 2000 kcal) = Days of Food`.
- **Energy Security:** `(Battery Capacity + Solar Forecast) / (Baseload Watts) = Hours of Power`.

---

## 4. Integration with Weather Telemetry
The existing `lib/survivalIndex.ts` will act as a real-time "Modifier" for the inventory:
- **Drought Warning:** If `waterCatchment` score is < 20 for 14 days, flag "Crop Failure Risk" and reduce projected yields by 30%.
- **Frost Alert:** If a freeze is detected before `harvestDate`, trigger a terminal alert to "Protect Inventory."
- **Solar Surplus:** If `solarEfficiency` is > 90%, suggest "Dehydration/Canning Day" to utilize excess power for food preservation.

---

## 5. Future Expansion (The "Prepper" Niche)
- **Macro-Nutrient Tracking:** Breakdown of Carbs vs. Fats vs. Proteins in the garden.
- **Trade/Barter Value:** Assigning "Scarcity Values" to specific high-density crops (e.g., Garlic, Potatoes).
- **Off-Grid Recipe Integration:** Suggesting meals based on what is currently hitting "Harvest" status in the calendar.

---

## 6. Discussion Points for Stakeholders
1. **Accuracy vs. Simplicity:** Should we use "Ideal Yields" or allow users to set a "Skill Level" modifier (Beginner/Expert)?
2. **Privacy:** Since this data is highly sensitive for survivalists, should we explicitly state that all data remains in `localStorage` and is never sent to a server?
3. **Hardware Integration:** Is there interest in manual "Tank Level" inputs for water, or should we strictly stick to "Projected" values from weather?

## TO DO
1. Logic & Data Layer (The "Engine")
   - [ ] Implement yieldCalculations.ts: Create a utility to normalize various units (lbs, oz,
     ears, bulbs) into grams and calculate total potential calories based on the avgPerPlant
     and caloriesPer100g fields.
   - [ ] Create waterAutonomy.ts: Develop logic to calculate "Days of Hydration" by comparing
     totalStorageCapacity and roofAreaSqFt (from Phase 2 config) against real-time
     precipitationProbability from the weather API.
   - [ ] Companion Relationship Parser: Add a utility to cropLoader.ts that cross-references
     companion-planting.json to flag "Antagonist Alerts" if a user selects incompatible crops
     in their calendar.


  2. Context & State (The "Homestead OS")
   - [ ] Update FieldStationContext.tsx:
       - [ ] Define and implement the HomesteadConfig interface (Roof area, solar capacity,
         household size).
       - [ ] Define and implement the SurvivalManifest (Current stored water, pantry
         inventory, active garden count).
       - [ ] Add localStorage persistence so user survival data survives page refreshes.
   - [ ] Survival Modifiers: Integrate lib/survivalIndex.ts output into the context so that a
     low "Water Score" automatically applies a "Stress Penalty" (e.g., -20%) to projected crop
     yields.


  3. UI & Dashboard (The "Interface")
   - [ ] AutonomyDashboard Component: Create a high-visibility module in the SurvivalDashboard
     (or a new route) that displays three primary "Survival Clocks":
       - Food: "X Days of Caloric Security" (Projected yield / Household needs).
       - Water: "Y Days of Hydration" (Stored + Projected rain / Consumption).
       - Energy: "Z Hours of Power" (Battery + Solar forecast / Baseload).
   - [ ] InventoryInput Modal: A brutalist-style UI for users to input their "Actuals" (e.g.,
     "I just planted 12 Tomato plants" or "My water tank is at 50%").
   - [ ] Companion Advisor UI: A "Garden Optimization" view that suggests where to place crops
     based on the mechanism field (e.g., "Plant Basil here to deter hornworms").


  4. Validation & Intelligence
   - [ ] Frost Guard Alerts: Create a listener that triggers a Terminal notification (ALT+T)
     if the firstFallFrost date in PlantingConfig is within 7 days and the user has "Active"
     crops in their manifest.
   - [ ] Caloric ROI Report: A summary tool that ranks the user's current garden by "Caloric
     Density" to identify gaps in their survival strategy (e.g., "Warning: High water use, low
     caloric return").

