import type { WeatherData, PlantingIndex, ForecastDay } from "./weatherTypes";

export function calculatePlantingIndex(data: WeatherData): PlantingIndex {
  const forecast = data.forecast;
  const current = data.current;

  // Calculate frost risk
  const frostRisk = calculateFrostRisk(forecast);

  // Calculate soil workability
  const soilWorkability = calculateSoilWorkability(current, forecast);

  // Calculate planting window
  const plantingWindow = calculatePlantingWindow(forecast, frostRisk);

  // Calculate growing degree days (simplified - base 50°F)
  const growingDegreeDays = calculateGDD(forecast);

  // Generate recommendations
  const recommendations = generateRecommendations(frostRisk, soilWorkability, growingDegreeDays);

  return {
    frostRisk,
    soilWorkability,
    plantingWindow,
    growingDegreeDays,
    recommendations,
  };
}

function calculateFrostRisk(forecast: ForecastDay[]): PlantingIndex["frostRisk"] {
  // Look at min temps for next 7, 14, and 30 days
  const next7Days = forecast.slice(0, 7);
  const next14Days = forecast.slice(0, 14);
  const next30Days = forecast.slice(0, 30);

  const minTemp7 = Math.min(...next7Days.map((d) => d.minTemp));
  const minTemp14 = Math.min(...next14Days.map((d) => d.minTemp));
  const minTemp30 = next30Days.length > 0 ? Math.min(...next30Days.map((d) => d.minTemp)) : minTemp14;

  // Frost threshold: 32°F (consider 28°F for hard freeze)
  const risk7 = calculatePeriodRisk(minTemp7);
  const risk14 = calculatePeriodRisk(minTemp14);
  const risk30 = calculatePeriodRisk(minTemp30);

  // Calculate variance for confidence
  const tempVariance = calculateVariance(next7Days.map((d) => d.minTemp));
  let confidence: "high" | "medium" | "low";
  if (tempVariance < 5) confidence = "high";
  else if (tempVariance < 10) confidence = "medium";
  else confidence = "low";

  return {
    next7Days: risk7,
    next14Days: risk14,
    next30Days: risk30,
    confidence,
    variance: Math.round(tempVariance * 10) / 10,
  };
}

function calculatePeriodRisk(minTemp: number): number {
  if (minTemp <= 28) return 100; // Hard freeze
  if (minTemp <= 32) return 80; // Light frost
  if (minTemp <= 35) return 60; // Near frost
  if (minTemp <= 40) return 40; // Chilly
  if (minTemp <= 45) return 20; // Cool
  return 0; // Safe
}

function calculateSoilWorkability(
  current: WeatherData["current"],
  forecast: ForecastDay[]
): PlantingIndex["soilWorkability"] {
  // Check recent precipitation and soil temp
  const recentRain = forecast.slice(0, 3).reduce((sum, day) => sum + day.precipitation, 0);
  const soilTemp = current.soilTemperature || current.temperature - 5; // Estimate if not available

  let status: "frozen" | "too-wet" | "too-dry" | "workable";
  let score: number;
  let description: string;

  if (soilTemp <= 32) {
    status = "frozen";
    score = 0;
    description = "Soil frozen. Wait for thaw.";
  } else if (recentRain > 2) {
    status = "too-wet";
    score = 20;
    description = `Too wet (${recentRain.toFixed(1)}" rain in 3 days). Wait 2-3 days.`;
  } else if (recentRain < 0.1 && soilTemp > 70) {
    status = "too-dry";
    score = 40;
    description = "Very dry. Consider irrigation before planting.";
  } else if (soilTemp < 45) {
    status = "workable";
    score = 60;
    description = "Soil workable but cool. OK for cold-hardy crops.";
  } else {
    status = "workable";
    score = 100;
    description = "Ideal conditions for most planting.";
  }

  return { status, score, description };
}

function calculatePlantingWindow(
  forecast: ForecastDay[],
  frostRisk: PlantingIndex["frostRisk"]
): PlantingIndex["plantingWindow"] {
  // Find first day with low frost risk and workable soil
  const safeDays = forecast.filter((day) => day.minTemp > 35 && day.precipitation < 1);

  if (safeDays.length === 0) {
    return {
      opens: null,
      confidence: 0,
      days: 0,
    };
  }

  const firstSafeDay = safeDays[0];
  const consecutiveSafeDays = countConsecutiveSafeDays(forecast, 35);

  let confidence: number;
  if (consecutiveSafeDays >= 7) confidence = 90;
  else if (consecutiveSafeDays >= 5) confidence = 75;
  else if (consecutiveSafeDays >= 3) confidence = 50;
  else confidence = 25;

  return {
    opens: firstSafeDay.date,
    confidence,
    days: consecutiveSafeDays,
  };
}

function calculateGDD(forecast: ForecastDay[]): PlantingIndex["growingDegreeDays"] {
  // Growing Degree Days: (Max Temp + Min Temp) / 2 - Base Temp (50°F)
  // Simplified calculation for the forecast period
  const baseTemp = 50;

  let totalGDD = 0;
  forecast.slice(0, 14).forEach((day) => {
    const avgTemp = (day.maxTemp + day.minTemp) / 2;
    if (avgTemp > baseTemp) {
      totalGDD += avgTemp - baseTemp;
    }
  });

  // Typical target for early planting: ~200 GDD
  const target = 200;
  const percentage = Math.min(Math.round((totalGDD / target) * 100), 100);

  return {
    current: Math.round(totalGDD),
    target,
    percentage,
  };
}

function generateRecommendations(
  frostRisk: PlantingIndex["frostRisk"],
  soilWorkability: PlantingIndex["soilWorkability"],
  gdd: PlantingIndex["growingDegreeDays"]
): string[] {
  const recommendations: string[] = [];

  // Frost recommendations
  if (frostRisk.next7Days > 50) {
    recommendations.push(`⚠️ Frost risk: ${frostRisk.next7Days}% in next 7 days. Hold off on tender plants.`);
  } else if (frostRisk.next14Days > 50) {
    recommendations.push(`⚠️ Watch for late frost. Keep row covers handy.`);
  }

  // Soil recommendations
  if (soilWorkability.status === "frozen") {
    recommendations.push("❄️ Soil still frozen. Wait for consistent 40°F+ temps.");
  } else if (soilWorkability.status === "too-wet") {
    recommendations.push("💧 Soil too wet for tilling. Wait 2-3 days after rain stops.");
  } else if (soilWorkability.status === "too-dry") {
    recommendations.push("☀️ Very dry conditions. Water before planting or wait for rain.");
  }

  // GDD recommendations
  if (gdd.percentage < 25) {
    recommendations.push("🌱 Season just starting. Good time for peas, spinach, kale.");
  } else if (gdd.percentage < 50) {
    recommendations.push("🌿 Good progress. Safe for beets, carrots, lettuce.");
  } else if (gdd.percentage < 75) {
    recommendations.push("🌽 Warming up. Tomatoes & peppers OK if no frost risk.");
  }

  // If everything looks good
  if (recommendations.length === 0) {
    recommendations.push("✅ Conditions look good for planting! Watch local forecasts.");
  }

  return recommendations;
}

// Helper functions
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

function countConsecutiveSafeDays(forecast: ForecastDay[], minTemp: number): number {
  let count = 0;
  for (const day of forecast) {
    if (day.minTemp > minTemp) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// Format frost risk for display
export function formatFrostRisk(risk: number): { label: string; color: string } {
  if (risk >= 80) return { label: "HIGH", color: "#ef4444" };
  if (risk >= 60) return { label: "MODERATE", color: "#f97316" };
  if (risk >= 40) return { label: "ELEVATED", color: "#eab308" };
  if (risk >= 20) return { label: "LOW", color: "#22c55e" };
  return { label: "MINIMAL", color: "#10b981" };
}

// Format confidence level
export function formatConfidence(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high":
      return "HIGH AGREEMENT";
    case "medium":
      return "MODERATE AGREEMENT";
    case "low":
      return "MIXED SIGNALS";
  }
}
