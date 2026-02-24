import { describe, it, expect } from 'vitest';
import { calculateSurvivalIndex } from './survivalIndex';
import { WeatherData, ForecastDay } from './weatherTypes';

const mockForecastDay: ForecastDay = {
  date: '2026-02-15',
  maxTemp: 70,
  minTemp: 50,
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
    temperature: 70,
    feelsLike: 70,
    humidity: 50,
    dewPoint: 50,
    pressure: 1013,
    windSpeed: 5,
    windDirection: 180,
    uvIndex: 5,
    visibility: 10000,
    cloudCover: 10,
    precipitation: 0,
  },
  forecast: [mockForecastDay],
  alerts: [],
  location: {
    name: 'Test Location',
    lat: 45,
    lon: -122,
  },
  lastUpdated: '2026-02-15T12:00:00Z',
};

describe('calculateSurvivalIndex', () => {
  it('should calculate "low" fire risk in mild conditions', () => {
    const result = calculateSurvivalIndex(mockWeatherData);
    expect(result.fireRisk.level).toBe('low');
  });

  it('should calculate "extreme" fire risk in dangerous conditions', () => {
    const dangerousData: WeatherData = {
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        temperature: 95,
        humidity: 15,
        windSpeed: 30,
      },
      forecast: [
        { ...mockForecastDay, precipitation: 0 },
        { ...mockForecastDay, precipitation: 0 },
        { ...mockForecastDay, precipitation: 0 },
      ],
    };
    const result = calculateSurvivalIndex(dangerousData);
    expect(result.fireRisk.level).toBe('extreme');
  });

  it('should detect excellent water catchment potential when rain is forecast', () => {
    const rainyData: WeatherData = {
      ...mockWeatherData,
      forecast: [
        {
          ...mockForecastDay,
          precipitation: 1.5,
          precipitationProbability: 85,
        },
      ],
    };
    const result = calculateSurvivalIndex(rainyData);
    expect(result.waterCatchment.potential).toBe('excellent');
    expect(result.waterCatchment.nextRain).toBe('2026-02-15');
  });

  it('should mark spray conditions as unsuitable when too hot and windy', () => {
    const hostileData: WeatherData = {
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        temperature: 90,
        windSpeed: 15,
      },
    };
    const result = calculateSurvivalIndex(hostileData);
    expect(result.sprayConditions.suitable).toBe(false);
    expect(result.sprayConditions.reason).toContain('Too hot');
    expect(result.sprayConditions.reason).toContain('Too windy');
  });

  it('should detect extreme livestock stress in heatwaves', () => {
    const heatwaveData: WeatherData = {
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        temperature: 105,
        humidity: 60,
      },
    };
    const result = calculateSurvivalIndex(heatwaveData);
    expect(result.livestockStress.level).toBe('extreme');
  });

  it('should calculate a reasonable overall readiness score', () => {
    const result = calculateSurvivalIndex(mockWeatherData);
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });
});
