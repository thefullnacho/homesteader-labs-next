import type { WeatherData, ForecastDay, HourlyForecast, WeatherAlert } from "./weatherTypes";

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
  uv_index?: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
  hourly: OpenMeteoHourly;
}

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const weatherCache = new Map<string, CacheEntry<WeatherData>>();
const WEATHER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function getCachedWeather(lat: number, lon: number): WeatherData | null {
  const key = getCacheKey(lat, lon);
  const entry = weatherCache.get(key);
  
  if (entry && Date.now() - entry.timestamp < entry.ttl) {
    return entry.data;
  }
  
  return null;
}

function setCachedWeather(lat: number, lon: number, data: WeatherData): void {
  const key = getCacheKey(lat, lon);
  weatherCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: WEATHER_CACHE_TTL,
  });
}

export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  // Check cache first
  const cached = getCachedWeather(lat, lon);
  if (cached) {
    return cached;
  }

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

  const weatherData = transformWeatherData(data);
  
  // Cache the result
  setCachedWeather(lat, lon, weatherData);
  
  return weatherData;
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
  const forecast: ForecastDay[] = daily.time.map((date, index) => {
    const dayHourlyData = hourlyByDay[date] || [];
    const avgHumidity = dayHourlyData.length > 0
      ? Math.round(dayHourlyData.reduce((sum, h) => sum + h.humidity, 0) / dayHourlyData.length)
      : 0;
    
    return {
      date,
      maxTemp: daily.temperature_2m_max[index],
      minTemp: daily.temperature_2m_min[index],
      avgHumidity,
      precipitation: daily.precipitation_sum[index],
      precipitationProbability: daily.precipitation_probability_max[index],
      windSpeed: daily.wind_speed_10m_max[index],
      uvIndex: daily.uv_index_max[index],
      cloudCover: daily.cloud_cover_mean[index],
      soilTemperature: daily.soil_temperature_0cm_mean?.[index],
      sunrise: daily.sunrise[index],
      sunset: daily.sunset[index],
      hourly: dayHourlyData,
    };
  });

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
      uvIndex: daily.uv_index_max[0] || 0,
      visibility: null, // Open-Meteo free tier doesn't provide visibility
      cloudCover: current.cloud_cover,
      precipitation: hourly.precipitation[0] || 0,
      soilTemperature: daily.soil_temperature_0cm_mean?.[0],
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
export async function fetchHistoricalFrostData(): Promise<{ lastSpringFrost: string; firstFallFrost: string; avgGrowingDays: number } | null> {
  // This would typically fetch from a climate API
  // For now, return null - in production, you'd use NOAA/NWS or similar
  return null;
}

// Fetch weather alerts from NWS API
export async function fetchWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  try {
    // First, get the forecast zone endpoint from coordinates
    const pointsResponse = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`,
      {
        headers: {
          'User-Agent': 'HomesteaderLabs/1.0 (contact@homesteaderlabs.com)',
          'Accept': 'application/geo+json'
        }
      }
    );
    
    if (!pointsResponse.ok) {
      console.warn('NWS points API error:', pointsResponse.status);
      return [];
    }
    
    const pointsData = await pointsResponse.json();
    const alertsUrl = pointsData.properties?.forecastZone?.replace('/zones/', '/alerts/zones/');
    
    if (!alertsUrl) {
      return [];
    }
    
    // Fetch active alerts for the zone
    const alertsResponse = await fetch(
      `https://api.weather.gov/alerts/active?zone=${alertsUrl.split('/').pop()}`,
      {
        headers: {
          'User-Agent': 'HomesteaderLabs/1.0 (contact@homesteaderlabs.com)',
          'Accept': 'application/geo+json'
        }
      }
    );
    
    if (!alertsResponse.ok) {
      console.warn('NWS alerts API error:', alertsResponse.status);
      return [];
    }
    
    const alertsData = await alertsResponse.json();
    
    if (!alertsData.features || alertsData.features.length === 0) {
      return [];
    }
    
    return alertsData.features.map((alert: NWSAlertFeature) => ({
      id: alert.properties.id,
      severity: mapNWSSeverity(alert.properties.severity),
      type: alert.properties.event,
      title: alert.properties.headline || alert.properties.event,
      description: alert.properties.description || '',
      start: alert.properties.onset,
      end: alert.properties.expires,
      action: alert.properties.instruction,
    }));
  } catch (error) {
    console.warn('Failed to fetch weather alerts:', error);
    return [];
  }
}

interface NWSAlertFeature {
  properties: {
    id: string;
    event: string;
    severity: string;
    headline?: string;
    description?: string;
    onset: string;
    expires: string;
    instruction?: string;
  };
}

function mapNWSSeverity(severity: string): WeatherAlert['severity'] {
  switch (severity.toLowerCase()) {
    case 'extreme':
    case 'severe':
      return 'critical';
    case 'moderate':
      return 'high';
    case 'minor':
      return 'medium';
    default:
      return 'low';
  }
}

// Fetch air quality data from Open-Meteo Air Quality API
export async function fetchAirQuality(lat: number, lon: number): Promise<{
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  co: number;
  no2: number;
} | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: [
        'us_aqi',
        'pm2_5',
        'pm10',
        'ozone',
        'carbon_monoxide',
        'nitrogen_dioxide',
      ].join(','),
    });

    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    
    if (!response.ok) {
      console.warn('Air quality API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    return {
      aqi: data.current?.us_aqi ?? 0,
      pm25: data.current?.pm2_5 ?? 0,
      pm10: data.current?.pm10 ?? 0,
      ozone: data.current?.ozone ?? 0,
      co: data.current?.carbon_monoxide ?? 0,
      no2: data.current?.nitrogen_dioxide ?? 0,
    };
  } catch (error) {
    console.warn('Failed to fetch air quality:', error);
    return null;
  }
}

// Get AQI category for display
export function getAQICategory(aqi: number): { label: string; color: string; description: string } {
  if (aqi <= 50) {
    return { label: 'GOOD', color: '#22c55e', description: 'Air quality is satisfactory' };
  } else if (aqi <= 100) {
    return { label: 'MODERATE', color: '#eab308', description: 'Acceptable air quality' };
  } else if (aqi <= 150) {
    return { label: 'UNHEALTHY_SENSITIVE', color: '#f97316', description: 'Sensitive groups may experience effects' };
  } else if (aqi <= 200) {
    return { label: 'UNHEALTHY', color: '#ef4444', description: 'Everyone may begin to experience effects' };
  } else if (aqi <= 300) {
    return { label: 'VERY_UNHEALTHY', color: '#a855f7', description: 'Health alert: serious effects' };
  } else {
    return { label: 'HAZARDOUS', color: '#7f1d1d', description: 'Emergency conditions' };
  }
}

// Fetch historical weather comparison data
export async function fetchHistoricalComparison(lat: number, lon: number): Promise<{
  avgHigh: number;
  avgLow: number;
  recordHigh: number;
  recordLow: number;
  precipChance: number;
} | null> {
  try {
    const today = new Date();
    
    // Get historical data for this day of year using Open-Meteo's archive API
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      start_date: `${today.getFullYear()}-01-01`,
      end_date: `${today.getFullYear()}-12-31`,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
      ].join(','),
      timezone: 'auto',
    });

    const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.daily) {
      return null;
    }
    
    // Find today's data or closest available
    const todayStr = today.toISOString().split('T')[0];
    const todayIndex = data.daily.time.findIndex((t: string) => t === todayStr);
    
    if (todayIndex === -1) {
      // Use 30-day average if exact date not available
      const recentTemps = data.daily.temperature_2m_max.slice(-30);
      const avgHigh = recentTemps.reduce((a: number, b: number) => a + b, 0) / recentTemps.length;
      
      return {
        avgHigh: Math.round(avgHigh),
        avgLow: Math.round(avgHigh - 15), // Estimate
        recordHigh: Math.round(Math.max(...data.daily.temperature_2m_max)),
        recordLow: Math.round(Math.min(...data.daily.temperature_2m_min)),
        precipChance: 30, // Estimate
      };
    }
    
    const avgHigh = data.daily.temperature_2m_max[todayIndex];
    const avgLow = data.daily.temperature_2m_min[todayIndex];
    
    return {
      avgHigh: Math.round(avgHigh),
      avgLow: Math.round(avgLow),
      recordHigh: Math.round(Math.max(...data.daily.temperature_2m_max)),
      recordLow: Math.round(Math.min(...data.daily.temperature_2m_min)),
      precipChance: Math.round((data.daily.precipitation_sum[todayIndex] || 0) * 10),
    };
  } catch (error) {
    console.warn('Failed to fetch historical comparison:', error);
    return null;
  }
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

// Moon phase calculation using known new moon reference date
export interface MoonPhase {
  phase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  illumination: number;
  daysUntilFull: number;
  daysUntilNew: number;
  emoji: string;
  label: string;
}

const MOON_PHASES: MoonPhase['phase'][] = [
  'new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
  'full', 'waning_gibbous', 'last_quarter', 'waning_crescent'
];

const MOON_EMOJIS: Record<MoonPhase['phase'], string> = {
  new: '🌑',
  waxing_crescent: '🌒',
  first_quarter: '🌓',
  waxing_gibbous: '🌔',
  full: '🌕',
  waning_gibbous: '🌖',
  last_quarter: '🌗',
  waning_crescent: '🌘'
};

export function getMoonPhase(date: Date = new Date()): MoonPhase {
  // Reference new moon: January 6, 2000 at 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  
  // Synodic month (lunar cycle) in milliseconds
  const synodicMonth = 29.530588853 * 24 * 60 * 60 * 1000;
  
  const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / (24 * 60 * 60 * 1000);
  const lunarAge = daysSinceNewMoon % synodicMonth;
  const normalizedAge = (lunarAge / synodicMonth) * 8;
  
  const phaseIndex = Math.floor(normalizedAge) % 8;
  const phase = MOON_PHASES[phaseIndex];
  
  // Calculate illumination (0-100%)
  const illumination = Math.round((1 - Math.cos((lunarAge / synodicMonth) * 2 * Math.PI)) * 50);
  
  // Days until full moon
  const daysUntilFull = lunarAge < synodicMonth / 2 
    ? Math.round((synodicMonth / 2) - lunarAge) / (24 * 60 * 60 * 1000)
    : Math.round(synodicMonth - lunarAge) / (24 * 60 * 60 * 1000);
  
  // Days until new moon
  const daysUntilNew = Math.round((synodicMonth - lunarAge) / (24 * 60 * 60 * 1000));
  
  const labels: Record<MoonPhase['phase'], string> = {
    new: 'New Moon',
    waxing_crescent: 'Waxing Crescent',
    first_quarter: 'First Quarter',
    waxing_gibbous: 'Waxing Gibbous',
    full: 'Full Moon',
    waning_gibbous: 'Waning Gibbous',
    last_quarter: 'Last Quarter',
    waning_crescent: 'Waning Crescent'
  };
  
  return {
    phase,
    illumination,
    daysUntilFull: Math.round(daysUntilFull),
    daysUntilNew,
    emoji: MOON_EMOJIS[phase],
    label: labels[phase]
  };
}

export function getMoonPhaseForForecast(forecast: ForecastDay[]): MoonPhase[] {
  return forecast.slice(0, 14).map(day => getMoonPhase(new Date(day.date)));
}
