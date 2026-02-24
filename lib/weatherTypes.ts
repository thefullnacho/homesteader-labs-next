export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    dewPoint: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    uvIndex: number;
    visibility: number | null;
    cloudCover: number;
    precipitation: number;
    soilTemperature?: number;
  };
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
  location: {
    name: string;
    lat: number;
    lon: number;
    elevation?: number;
  };
  lastUpdated: string;
}

export interface WeatherProvider {
  name: string;
  getCurrentWeather(lat: number, lon: number): Promise<WeatherData>;
  getForecast(lat: number, lon: number): Promise<ForecastDay[]>;
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  avgHumidity: number;
  precipitation: number;
  snowfall: number;
  precipitationProbability: number;
  windSpeed: number;
  uvIndex: number;
  cloudCover: number;
  soilTemperature?: number;
  sunrise: string;
  sunset: string;
  hourly: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  snowfall: number;
  snowDepth: number;
  precipitationProbability: number;
  windSpeed: number;
  cloudCover: number;
  uvIndex?: number;
}

export interface WeatherAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  title: string;
  description: string;
  start: string;
  end: string;
  action?: string;
}

export interface SurvivalIndex {
  fireRisk: {
    level: "low" | "moderate" | "high" | "extreme";
    score: number;
    description: string;
  };
  waterCatchment: {
    potential: "poor" | "fair" | "good" | "excellent";
    score: number;
    nextRain: string | null;
  };
  sprayConditions: {
    suitable: boolean;
    score: number;
    reason: string;
  };
  solarEfficiency: {
    percentage: number;
    hours: number;
    score: number;
  };
  livestockStress: {
    level: "none" | "low" | "moderate" | "high" | "extreme";
    score: number;
    description: string;
  };
  overall: number;
}

export interface PlantingIndex {
  frostRisk: {
    next7Days: number;
    next14Days: number;
    next30Days: number;
    confidence: "high" | "medium" | "low";
    variance: number;
  };
  soilWorkability: {
    status: "frozen" | "too-wet" | "too-dry" | "workable";
    score: number;
    description: string;
  };
  plantingWindow: {
    opens: string | null;
    confidence: number;
    days: number;
  };
  growingDegreeDays: {
    current: number;
    target: number;
    percentage: number;
  };
  recommendations: string[];
}

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation?: number;
  notes?: string;
  isDefault?: boolean;
  zipCode?: string;
}
