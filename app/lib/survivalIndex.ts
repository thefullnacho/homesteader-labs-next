import type { WeatherData, SurvivalIndex, PlantingIndex, ForecastDay } from "./weatherTypes";

export function calculateSurvivalIndex(data: WeatherData): SurvivalIndex {
  const current = data.current;
  const forecast = data.forecast;

  // Fire Risk Calculation
  // Based on: temp, humidity, wind, recent precipitation
  const fireRiskScore = calculateFireRisk(current, forecast);

  // Water Catchment Potential
  const waterCatchment = calculateWaterCatchment(forecast);

  // Spray Conditions
  const sprayConditions = calculateSprayConditions(current);

  // Solar Efficiency
  const solarEfficiency = calculateSolarEfficiency(forecast);

  // Livestock Stress (Heat Index or Wind Chill)
  const livestockStress = calculateLivestockStress(current);

  // Overall score (average of normalized scores)
  const overall = Math.round(
    (normalizeFireRisk(fireRiskScore.score) +
      normalizeWaterCatchment(waterCatchment.score) +
      (sprayConditions.suitable ? 100 : 0) +
      solarEfficiency.score +
      normalizeLivestockStress(livestockStress.score)) / 5
  );

  return {
    fireRisk: fireRiskScore,
    waterCatchment,
    sprayConditions,
    solarEfficiency,
    livestockStress,
    overall,
  };
}

function calculateFireRisk(
  current: WeatherData["current"],
  forecast: ForecastDay[]
): SurvivalIndex["fireRisk"] {
  // Fire risk factors: high temp, low humidity, high wind, no recent rain
  let score = 0;

  // Temperature factor (above 75°F increases risk)
  if (current.temperature > 90) score += 40;
  else if (current.temperature > 80) score += 25;
  else if (current.temperature > 75) score += 15;

  // Humidity factor (below 30% increases risk)
  if (current.humidity < 20) score += 30;
  else if (current.humidity < 30) score += 20;
  else if (current.humidity < 40) score += 10;

  // Wind factor (above 15mph increases risk)
  if (current.windSpeed > 25) score += 20;
  else if (current.windSpeed > 15) score += 10;

  // Recent precipitation factor (no rain in 3+ days increases risk)
  const recentRain = forecast.slice(0, 3).reduce((sum, day) => sum + day.precipitation, 0);
  if (recentRain === 0) score += 10;
  else if (recentRain < 0.1) score += 5;

  // Cap at 100
  score = Math.min(score, 100);

  let level: "low" | "moderate" | "high" | "extreme";
  let description: string;

  if (score < 25) {
    level = "low";
    description = "Safe for open burning with precautions";
  } else if (score < 50) {
    level = "moderate";
    description = "Use caution with open flames";
  } else if (score < 75) {
    level = "high";
    description = "Avoid open burning. Sparks may spread";
  } else {
    level = "extreme";
    description = "NO BURNING. Extreme fire danger";
  }

  return { level, score, description };
}

function calculateWaterCatchment(forecast: ForecastDay[]): SurvivalIndex["waterCatchment"] {
  // Look for rain in the next 7 days
  const nextRain = forecast.find((day) => day.precipitation > 0.1);

  if (!nextRain) {
    return {
      potential: "poor",
      score: 0,
      nextRain: null,
    };
  }

  const rainAmount = nextRain.precipitation;
  const rainProbability = nextRain.precipitationProbability;

  let potential: "poor" | "fair" | "good" | "excellent";
  let score: number;

  if (rainAmount > 1 && rainProbability > 70) {
    potential = "excellent";
    score = 100;
  } else if (rainAmount > 0.5 && rainProbability > 50) {
    potential = "good";
    score = 75;
  } else if (rainAmount > 0.1 && rainProbability > 30) {
    potential = "fair";
    score = 50;
  } else {
    potential = "poor";
    score = 25;
  }

  return {
    potential,
    score,
    nextRain: nextRain.date,
  };
}

function calculateSprayConditions(current: WeatherData["current"]): SurvivalIndex["sprayConditions"] {
  // Ideal spray conditions: temp 50-85°F, wind 3-10mph, humidity 50-90%, no rain imminent
  const tempOk = current.temperature >= 50 && current.temperature <= 85;
  const windOk = current.windSpeed >= 3 && current.windSpeed <= 10;
  const humidityOk = current.humidity >= 40 && current.humidity <= 90;

  let reasons: string[] = [];
  if (!tempOk) reasons.push(current.temperature < 50 ? "Too cold" : "Too hot");
  if (!windOk) reasons.push(current.windSpeed < 3 ? "Too calm" : "Too windy");
  if (!humidityOk) reasons.push(current.humidity < 40 ? "Too dry" : "Too humid");

  const score = tempOk && windOk && humidityOk ? 100 : 0;

  return {
    suitable: tempOk && windOk && humidityOk,
    score,
    reason: reasons.length > 0 ? reasons.join(", ") : "Conditions optimal",
  };
}

function calculateSolarEfficiency(forecast: ForecastDay[]): SurvivalIndex["solarEfficiency"] {
  // Calculate based on cloud cover and day length
  const today = forecast[0];
  if (!today) {
    return { percentage: 0, hours: 0, score: 0 };
  }

  const cloudFactor = 1 - today.cloudCover / 100;
  const sunrise = new Date(today.sunrise);
  const sunset = new Date(today.sunset);
  const dayLengthHours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);

  // Peak sun hours estimation (simplified)
  const peakHours = dayLengthHours * cloudFactor * 0.5; // 50% efficiency factor
  const efficiency = Math.round(cloudFactor * 100);

  return {
    percentage: efficiency,
    hours: Math.round(peakHours * 10) / 10,
    score: efficiency,
  };
}

function calculateLivestockStress(current: WeatherData["current"]): SurvivalIndex["livestockStress"] {
  // Calculate heat index or wind chill
  const temp = current.temperature;
  const humidity = current.humidity;
  const windSpeed = current.windSpeed;

  // Heat Index (simplified)
  const heatIndex = temp + 0.5555 * (6.11 * Math.exp(5417.7530 * (1/273.16 - 1/(273.16 + (temp - 32) * 5/9))) - 10);
  
  // Wind Chill (simplified)
  const windChill = 35.74 + 0.6215 * temp - 35.75 * Math.pow(windSpeed, 0.16) + 0.4275 * temp * Math.pow(windSpeed, 0.16);

  let level: "none" | "low" | "moderate" | "high" | "extreme";
  let description: string;
  let score: number;

  if (temp > 90 || heatIndex > 100) {
    level = "extreme";
    description = "Dangerous heat. Provide shade & water";
    score = 0;
  } else if (temp > 85 || heatIndex > 95) {
    level = "high";
    description = "Heat stress likely. Monitor closely";
    score = 25;
  } else if (temp < 20 || windChill < 10) {
    level = "high";
    description = "Cold stress risk. Provide shelter";
    score = 25;
  } else if (temp > 80 || temp < 32) {
    level = "moderate";
    description = "Mild stress possible";
    score = 50;
  } else if (temp < 40) {
    level = "low";
    description = "Cool conditions, monitor young stock";
    score = 75;
  } else {
    level = "none";
    description = "Comfortable range for most livestock";
    score = 100;
  }

  return { level, score, description };
}

// Helper functions to normalize scores to 0-100 scale
function normalizeFireRisk(score: number): number {
  // Invert because high fire risk is bad
  return 100 - score;
}

function normalizeWaterCatchment(score: number): number {
  return score;
}

function normalizeLivestockStress(score: number): number {
  return score;
}
