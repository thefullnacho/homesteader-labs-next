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
