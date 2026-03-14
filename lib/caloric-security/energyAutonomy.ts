import type { ForecastDay } from '@/lib/weatherTypes';
import type {
  ForecastSolarDay,
  EnergyAutonomyInput,
  EnergyAutonomyResult,
} from './types';

// ============================================================
// Constants
// ============================================================

// Default system voltage: most small homestead battery banks are 12V.
// Users with 24V or 48V systems should multiply their Ah by 2 or 4
// before entering it, or we surface this assumption in the UI.
export const DEFAULT_SYSTEM_VOLTAGE_V = 12;

// Conservative DoD for lead-acid. Lithium users can override to 0.8.
// Lower is safer — exceeding DoD damages lead-acid cells.
export const DEFAULT_DEPTH_OF_DISCHARGE = 0.5;

// Combined inverter + wiring + MPPT derating factor.
// Industry standard for small off-grid systems: 0.80–0.90.
export const DEFAULT_SYSTEM_EFFICIENCY = 0.85;

// The peak sun hour model uses daylight hours × cloud factor × this
// conversion constant. The 0.5 accounts for the fact that the sun
// is not at peak angle for the full daylight period (AM/PM ramp-up).
// This matches the approach used in survivalIndex.ts.
export const PEAK_SUN_HOUR_CONVERSION = 0.5;

// ============================================================
// Solar day estimator
//
// Derives peak sun hours for a single forecast day using:
//   - Daylight duration (sunrise → sunset)
//   - Cloud cover (0–100%)
//
// Returns effective peak sun hours — the number of hours at
// standard test conditions (1000 W/m²) equivalent to the
// total irradiance received on that day.
// ============================================================

export function estimatePeakSunHours(day: ForecastDay): number {
  const cloudFactor  = 1 - day.cloudCover / 100;
  const sunrise      = new Date(day.sunrise);
  const sunset       = new Date(day.sunset);
  const dayLengthHrs = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);

  // Guard: invalid or missing sunrise/sunset data
  if (!isFinite(dayLengthHrs) || dayLengthHrs <= 0) return 0;

  return dayLengthHrs * cloudFactor * PEAK_SUN_HOUR_CONVERSION;
}

// ============================================================
// Weather adapter
//
// Converts ForecastDay[] from weatherApi into the lightweight
// ForecastSolarDay[] that energyAutonomy needs.
// ============================================================

export function forecastToSolarDays(forecast: ForecastDay[]): ForecastSolarDay[] {
  return forecast.map(day => {
    const peakSunHours = estimatePeakSunHours(day);
    return {
      date:           day.date,
      peakSunHours,
      estimatedGenWh: 0,  // filled in by calculateEnergyAutonomy with actual array watts
    };
  });
}

// ============================================================
// Main energy autonomy calculation
//
// Matches the mental model of the water clock:
//   stored usable energy + projected solar inflow
//   ─────────────────────────────────────────────  =  daysOfEnergy
//              daily baseload draw
//
// Solar inflow is capped at the remaining battery headroom so
// the clock never over-projects based on an already-full bank.
//
// Confidence:
//   high   — solar array configured + forecast available
//   medium — solar array configured, no forecast
//   low    — no solar array (battery-only reading)
// ============================================================

export function calculateEnergyAutonomy(input: EnergyAutonomyInput): EnergyAutonomyResult {
  const {
    batteryCapacityAh,
    solarArrayWatts,
    baseloadWatts,
    forecastSolarDays = [],
    currentBatteryPct  = 100,
    systemVoltageV     = DEFAULT_SYSTEM_VOLTAGE_V,
    depthOfDischarge   = DEFAULT_DEPTH_OF_DISCHARGE,
    systemEfficiency   = DEFAULT_SYSTEM_EFFICIENCY,
  } = input;

  const batteryCapWh   = batteryCapacityAh * systemVoltageV;
  const usableCapWh    = batteryCapWh * depthOfDischarge;
  const storedUsableWh = usableCapWh * Math.min(1, Math.max(0, currentBatteryPct / 100));
  const dailyDrawWh    = baseloadWatts * 24;

  // Battery-only days (no solar)
  const currentSupplyDays = dailyDrawWh > 0 ? storedUsableWh / dailyDrawWh : 0;

  // Annotate each solar day with actual generation at this array size
  const annotatedDays: ForecastSolarDay[] = forecastSolarDays.map(day => ({
    ...day,
    estimatedGenWh: solarArrayWatts * day.peakSunHours * systemEfficiency,
  }));

  // projectedSolarWh: total forecast generation (informational — shown in UI)
  const projectedSolarWh = annotatedDays.reduce((sum, d) => sum + d.estimatedGenWh, 0);

  const averageDailySolarWh = annotatedDays.length > 0
    ? projectedSolarWh / annotatedDays.length
    : 0;

  const solarCoversBaseload = averageDailySolarWh >= dailyDrawWh;

  // ── Day-by-day simulation ─────────────────────────────────
  //
  // Unlike the water clock (a static tank), energy cycles daily:
  // solar charges the battery by day, baseload drains it all day.
  // A full battery still benefits from solar — it extends the clock
  // by offsetting the daily draw, cycling charge each day.
  //
  // Algorithm:
  //   1. Simulate each forecast day: battery += (solar - draw); clamp [0, usableCapWh]
  //   2. If battery hits 0 mid-day, compute the fractional day and stop.
  //   3. After the forecast window, extrapolate with the average solar vs draw:
  //      - If solar ≥ draw: system is self-sustaining; report a high finite number.
  //      - If solar < draw: drain rate is known; compute remaining days.
  // ─────────────────────────────────────────────────────────

  let daysOfEnergy: number;

  if (dailyDrawWh === 0) {
    daysOfEnergy = 0;
  } else if (annotatedDays.length === 0) {
    daysOfEnergy = currentSupplyDays;
  } else {
    let battery      = storedUsableWh;
    let simDays      = 0;
    let ranOut       = false;

    for (const day of annotatedDays) {
      const batteryBefore = battery;
      battery = Math.min(battery + day.estimatedGenWh - dailyDrawWh, usableCapWh);

      if (battery <= 0) {
        // Ran out during this day — fractional portion survived
        const deficitRate = dailyDrawWh - day.estimatedGenWh;
        simDays += deficitRate > 0 ? batteryBefore / deficitRate : 1;
        battery  = 0;
        ranOut   = true;
        break;
      }
      simDays++;
    }

    if (!ranOut) {
      // Survived the forecast window — extrapolate post-forecast
      const netDaily = averageDailySolarWh - dailyDrawWh;
      if (netDaily >= 0) {
        // Solar covers load: self-sustaining. Show remaining battery runway + large buffer.
        daysOfEnergy = simDays + battery / dailyDrawWh + 365;
        daysOfEnergy = Math.min(999, daysOfEnergy);
      } else {
        // Battery drains at |netDaily| Wh/day post-forecast
        daysOfEnergy = simDays + battery / (-netDaily);
      }
    } else {
      daysOfEnergy = simDays;
    }
  }

  let confidence: EnergyAutonomyResult['confidence'];
  if (solarArrayWatts > 0 && forecastSolarDays.length > 0) {
    confidence = 'high';
  } else if (solarArrayWatts > 0) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    daysOfEnergy,
    storedUsableWh,
    batteryCapWh,
    dailyDrawWh,
    projectedSolarWh,
    currentSupplyDays,
    averageDailySolarWh,
    solarCoversBaseload,
    confidence,
    forecastSolarDays: annotatedDays,
  };
}
