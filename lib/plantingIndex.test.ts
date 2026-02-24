import { describe, it, expect } from 'vitest';
import { calculatePlantingIndex } from './plantingIndex';
import { WeatherData, ForecastDay } from './weatherTypes';

const mockForecastDay: ForecastDay = {
  date: '2026-02-15',
  maxTemp: 60,
  minTemp: 45,
  avgHumidity: 50,
  precipitation: 0,
  snowfall: 0,
  precipitationProbability: 0,
  windSpeed: 5,
  uvIndex: 5,
  cloudCover: 10,
  sunrise: '2026-02-15T06:00:00Z',
  sunset: '2026-02-15T18:00:00Z',
  hourly: [],
};

const mockWeatherData: WeatherData = {
  current: {
    temperature: 55,
    feelsLike: 55,
    humidity: 50,
    dewPoint: 40,
    pressure: 1013,
    windSpeed: 5,
    windDirection: 180,
    uvIndex: 5,
    visibility: 10000,
    cloudCover: 10,
    precipitation: 0,
  },
  forecast: Array(14).fill(mockForecastDay),
  alerts: [],
  location: {
    name: 'Test Location',
    lat: 45,
    lon: -122,
  },
  lastUpdated: '2026-02-15T12:00:00Z',
};

describe('calculatePlantingIndex', () => {
  it('should detect high frost risk when temperatures drop below freezing', () => {
    const frozenData: WeatherData = {
      ...mockWeatherData,
      forecast: [
        { ...mockForecastDay, minTemp: 25 },
        ...Array(13).fill(mockForecastDay),
      ],
    };
    const result = calculatePlantingIndex(frozenData);
    expect(result.frostRisk.next7Days).toBe(100);
    expect(result.recommendations.some(r => r.includes('Frost risk'))).toBe(true);
  });

  it('should mark soil as too wet after heavy rain', () => {
    const wetData: WeatherData = {
      ...mockWeatherData,
      forecast: [
        { ...mockForecastDay, precipitation: 2.5 },
        ...Array(13).fill(mockForecastDay),
      ],
    };
    const result = calculatePlantingIndex(wetData);
    expect(result.soilWorkability.status).toBe('too-wet');
    expect(result.recommendations.some(r => r.includes('Soil too wet'))).toBe(true);
  });

  it('should calculate GDD percentage correctly', () => {
    // With max 60 and min 45, avg is 52.5. Base is 50. GDD = 2.5 per day.
    // 14 days * 2.5 = 35 GDD. Target is 200. (35/200) = 17.5%
    const result = calculatePlantingIndex(mockWeatherData);
    expect(result.growingDegreeDays.current).toBe(35);
    expect(result.growingDegreeDays.percentage).toBe(18); // Rounded
  });

  it('should identify a planting window in safe conditions', () => {
    const result = calculatePlantingIndex(mockWeatherData);
    expect(result.plantingWindow.opens).not.toBeNull();
    expect(result.plantingWindow.days).toBeGreaterThanOrEqual(14);
  });

  it('should suggest cold-hardy crops early in the season', () => {
    const earlySeasonData: WeatherData = {
      ...mockWeatherData,
      forecast: Array(14).fill({ ...mockForecastDay, maxTemp: 55, minTemp: 40 }),
    };
    const result = calculatePlantingIndex(earlySeasonData);
    expect(result.recommendations.some(r => r.includes('peas, spinach, kale'))).toBe(true);
  });
});
