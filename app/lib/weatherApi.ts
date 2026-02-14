import type { WeatherData, ForecastDay, HourlyForecast } from "./weatherTypes";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  cloud_cover: number;
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
  cloud_cover_mean: number[];
  sunrise: string[];
  sunset: string[];
  soil_temperature_0cm_mean?: number[];
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
  cloud_cover: number[];
  uv_index: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
  hourly: OpenMeteoHourly;
}

export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "cloud_cover",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "precipitation_probability",
      "wind_speed_10m",
      "cloud_cover",
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "uv_index_max",
      "cloud_cover_mean",
      "sunrise",
      "sunset",
    ].join(","),
    timezone: "auto",
    forecast_days: "14",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
  });

  const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();

  return transformWeatherData(data);
}

function transformWeatherData(data: OpenMeteoResponse): WeatherData {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  // Group hourly data by day
  const hourlyByDay: { [key: string]: HourlyForecast[] } = {};
  
  hourly.time.forEach((time, index) => {
    const date = time.split("T")[0];
    if (!hourlyByDay[date]) {
      hourlyByDay[date] = [];
    }
    
    hourlyByDay[date].push({
      time: time,
      temperature: hourly.temperature_2m[index],
      feelsLike: hourly.apparent_temperature[index],
      humidity: hourly.relative_humidity_2m[index],
      precipitation: hourly.precipitation[index],
      precipitationProbability: hourly.precipitation_probability[index],
      windSpeed: hourly.wind_speed_10m[index],
      cloudCover: hourly.cloud_cover[index],
      uvIndex: hourly.uv_index?.[index],
    });
  });

  // Transform daily forecast
  const forecast: ForecastDay[] = daily.time.map((date, index) => ({
    date,
    maxTemp: daily.temperature_2m_max[index],
    minTemp: daily.temperature_2m_min[index],
    avgHumidity: 0, // Calculate from hourly
    precipitation: daily.precipitation_sum[index],
    precipitationProbability: daily.precipitation_probability_max[index],
    windSpeed: daily.wind_speed_10m_max[index],
    uvIndex: daily.uv_index_max[index],
    cloudCover: daily.cloud_cover_mean[index],
    soilTemperature: daily.soil_temperature_0cm_mean?.[index],
    sunrise: daily.sunrise[index],
    sunset: daily.sunset[index],
    hourly: hourlyByDay[date] || [],
  }));

  // Calculate dew point from temp and humidity (simplified)
  const dewPoint = calculateDewPoint(current.temperature_2m, current.relative_humidity_2m);
  
  return {
    current: {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      dewPoint: dewPoint,
      pressure: current.pressure_msl,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      uvIndex: 0, // Will be taken from daily data
      visibility: 10, // Default 10km
      cloudCover: current.cloud_cover,
      precipitation: 0, // Will be calculated from hourly
      soilTemperature: undefined,
    },
    forecast,
    alerts: [], // Open-Meteo doesn't provide alerts, would need separate API
    location: {
      name: `${data.latitude.toFixed(2)}, ${data.longitude.toFixed(2)}`,
      lat: data.latitude,
      lon: data.longitude,
      elevation: data.elevation,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;

    const result = data.results[0];
    const region = result.admin1 ? `, ${result.admin1}` : "";
    return {
      lat: result.latitude,
      lon: result.longitude,
      name: `${result.name}${region}, ${result.country}`,
    };
  } catch {
    return null;
  }
}

export async function geocodeZipCode(zip: string): Promise<{ lat: number; lon: number; name: string } | null> {
  // Clean the zip code - extract just numbers for US zips
  const cleanZip = zip.trim().replace(/\s/g, '');
  
  // Try Zippopotam API for US zip codes (free, no API key)
  if (/^\d{5}(-\d{4})?$/.test(cleanZip)) {
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
      if (response.ok) {
        const data = await response.json();
        return {
          lat: parseFloat(data.places[0].latitude),
          lon: parseFloat(data.places[0].longitude),
          name: `${data.places[0]["place name"]}, ${data.places[0]["state abbreviation"]} ${cleanZip}`,
        };
      }
    } catch {
      // Fall through to Open-Meteo
    }
  }

  // Fallback: Try Open-Meteo geocoding (works for some postal codes)
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zip)}&count=5&language=en&format=json`
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;

    // For zip codes, look for a close match
    const result = data.results[0];
    const region = result.admin1 ? `, ${result.admin1}` : "";
    return {
      lat: result.latitude,
      lon: result.longitude,
      name: `${result.name}${region}, ${result.country}`,
    };
  } catch {
    return null;
  }
}

export function parseCoordinates(latStr: string, lonStr: string): { lat: number; lon: number; name: string } | null {
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return {
    lat,
    lon,
    name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
  };
}

// Fetch historical frost data to calculate typical frost dates
export async function fetchHistoricalFrostData(
  lat: number,
  lon: number
): Promise<{ lastSpringFrost: string; firstFallFrost: string; avgGrowingDays: number } | null> {
  // This would typically fetch from a climate API
  // For now, return null - in production, you'd use NOAA/NWS or similar
  return null;
}

// Calculate dew point from temperature and relative humidity (input in Fahrenheit)
function calculateDewPoint(tempF: number, humidity: number): number {
  // Convert to Celsius for Magnus formula
  const tempC = (tempF - 32) * 5 / 9;
  
  // Magnus formula for dew point
  const a = 17.271;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100.0);
  const dewPointC = (b * alpha) / (a - alpha);
  
  // Convert back to Fahrenheit
  return Math.round((dewPointC * 9 / 5) + 32);
}
