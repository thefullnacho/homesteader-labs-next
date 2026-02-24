"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, Terminal, Activity, ShieldAlert, Sprout, Download } from "lucide-react";
import { useWeatherLocations } from "../../hooks/useWeatherLocations";
import { useWeatherEmailCapture } from "../../hooks/useWeatherEmailCapture";
import { fetchWeatherData } from "@/lib/weatherApi";
import { calculateSurvivalIndex } from "@/lib/survivalIndex";
import { calculatePlantingIndex } from "@/lib/plantingIndex";
import type { WeatherData } from "@/lib/weatherTypes";

import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import DymoLabel from "@/components/ui/DymoLabel";
import EmailCapture from "@/components/weather/EmailCapture";

// Modular Components
import TelemetryHeader from "@/components/tools/weather/TelemetryHeader";
import RadarView from "@/components/tools/weather/RadarView";
import LocationManager from "@/components/tools/weather/LocationManager";
import SurvivalDashboard from "@/components/tools/weather/SurvivalDashboard";
import PlantingDashboard from "@/components/tools/weather/PlantingDashboard";
import ForecastGrid from "@/components/tools/weather/ForecastGrid";
import WeatherChart from "@/components/tools/weather/WeatherChart";
import HourlyChart from "@/components/tools/weather/HourlyChart";
import MoonPhaseDisplay from "@/components/tools/weather/MoonPhaseDisplay";
import GrowingSeasonTracker from "@/components/tools/weather/GrowingSeasonTracker";

type DashboardMode = "SURVIVAL" | "PLANTING";

function exportWeatherData(weather: WeatherData, format: 'json' | 'csv') {
  const locationName = weather.location.name.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(weather, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_${locationName}_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // CSV format
    const headers = ['Date', 'High°F', 'Low°F', 'Precip(in)', 'Precip%', 'Wind(mph)', 'UV', 'Cloud%'];
    const rows = weather.forecast.map(day => [
      day.date,
      day.maxTemp,
      day.minTemp,
      day.precipitation,
      day.precipitationProbability,
      day.windSpeed,
      day.uvIndex,
      day.cloudCover
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_${locationName}_${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export default function WeatherPage() {
  const { locations, activeLocation, switchLocation, addLocation, removeLocation, isLoaded } = useWeatherLocations();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DashboardMode>("SURVIVAL");
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const {
    showCapture,
    captureType,
    isSubmitting,
    isSuccess,
    submitEmail,
    dismiss,
    showWeeklyCapture
  } = useWeatherEmailCapture(locations.length);

  // Memoized Indices
  const survivalIndex = useMemo(() => weather ? calculateSurvivalIndex(weather) : null, [weather]);
  const plantingIndex = useMemo(() => weather ? calculatePlantingIndex(weather) : null, [weather]);

  const loadWeather = useCallback(async () => {
    if (!activeLocation) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherData(activeLocation.lat, activeLocation.lon);
      setWeather(data);
      setRetryCount(0);
    } catch {
      setError("TELEMETRY_LINK_SEVERED");
    } finally {
      setLoading(false);
    }
  }, [activeLocation]);

  const handleRetry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadWeather();
      }, delay);
    }
  }, [retryCount, loadWeather]);

  useEffect(() => {
    if (!isLoaded || !activeLocation) return;
    loadWeather();
  }, [activeLocation, isLoaded, loadWeather, retryCount]);

  if (!isLoaded || (loading && activeLocation)) {
    return (
      <FieldStationLayout stationId="HL_WEATHER_STATION">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <Typography variant="small" className="font-mono uppercase tracking-widest opacity-40">
              Initializing Stream ID: {activeLocation?.id || "NULL"}...
            </Typography>
          </div>
        </div>
      </FieldStationLayout>
    );
  }

  return (
    <FieldStationLayout stationId="HL_WEATHER_STATION">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOP_NAV & NODE_MGMT */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b-2 border-border-primary pb-6">
          <div>
            <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono">Weather Station</Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[9px] uppercase tracking-widest">
              Multi-Source Ensemble Telemetry // Active Link: OPEN_METEO_V4
            </Typography>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex border-2 border-border-primary p-1 bg-black/20">
              <button 
                onClick={() => setMode("SURVIVAL")}
                className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold font-mono uppercase transition-all ${
                  mode === "SURVIVAL" ? "bg-accent text-white" : "opacity-40 hover:opacity-100"
                }`}
              >
                <ShieldAlert size={12} /> Survival Ops
              </button>
              <button 
                onClick={() => setMode("PLANTING")}
                className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold font-mono uppercase transition-all ${
                  mode === "PLANTING" ? "bg-accent text-white" : "opacity-40 hover:opacity-100"
                }`}
              >
                <Sprout size={12} /> Planting Log
              </button>
            </div>
            <Badge variant="status" pulse>Link Stable</Badge>
          </div>
        </div>

        <LocationManager 
          locations={locations}
          activeLocation={activeLocation}
          onSwitch={switchLocation}
          onAdd={(loc) => {
            const previousCount = locations.length;
            addLocation(loc);
            if (previousCount === 1) setTimeout(() => showWeeklyCapture(), 500);
          }}
          onRemove={removeLocation}
        />

        {!activeLocation && (
          <BrutalistBlock className="p-12 text-center border-dashed border-border-primary/40 mb-8">
            <Typography variant="body" className="opacity-40 font-mono uppercase text-sm">Waiting for coordinate input to initialize node...</Typography>
          </BrutalistBlock>
        )}

        {weather && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <TelemetryHeader weather={weather} />
            
            {activeLocation && (
              <RadarView 
                lat={activeLocation.lat} 
                lon={activeLocation.lon} 
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <MoonPhaseDisplay />
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <DymoLabel className="text-[10px]">{mode} DASHBOARD V.2</DymoLabel>
                <div className="h-[2px] flex-grow bg-border-primary/20" />
              </div>

              {mode === "SURVIVAL" && survivalIndex && (
                <SurvivalDashboard index={survivalIndex} />
              )}

              {mode === "PLANTING" && plantingIndex && (
                <PlantingDashboard index={plantingIndex} />
              )}

              {mode === "PLANTING" && weather && (
                <div className="mt-8">
                  <GrowingSeasonTracker 
                    forecast={weather.forecast} 
                    locationName={activeLocation?.name || 'default'} 
                  />
                </div>
              )}
            </div>

            <div className="mb-8 p-6 bg-black/20 border-2 border-border-primary overflow-hidden">
              <HourlyChart hourly={weather.forecast[0]?.hourly || []} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Typography variant="small" className="font-mono font-bold uppercase text-[10px] mb-0 opacity-40">Ensemble 7D Outlook</Typography>
                <div className="h-[1px] flex-grow bg-border-primary/10" />
              </div>
              <ForecastGrid forecast={weather.forecast} />
            </div>

            <div className="mt-8 p-6 bg-black/20 border-2 border-border-primary">
              <WeatherChart forecast={weather.forecast} />
            </div>
          </div>
        )}


        {error && (
          <BrutalistBlock className="p-12 text-center border-red-500 bg-red-500/5">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4 opacity-40" />
            <Typography variant="h3" className="text-red-500 uppercase font-mono">{error}</Typography>
            <Typography variant="body" className="opacity-60 text-xs mt-2 uppercase font-mono">Attempting to re-establish uplink...</Typography>
            {retryCount < MAX_RETRIES && (
              <button 
                onClick={handleRetry}
                className="mt-4 px-6 py-2 bg-red-500/20 border border-red-500 text-red-400 font-mono text-xs uppercase hover:bg-red-500/30 transition-colors"
              >
                Retry Connection ({MAX_RETRIES - retryCount} attempts remaining)
              </button>
            )}
            {retryCount >= MAX_RETRIES && (
              <Typography variant="body" className="opacity-60 text-xs mt-4 uppercase font-mono text-red-400">
                Maximum retries exceeded. Please check your connection and refresh.
              </Typography>
            )}
          </BrutalistBlock>
        )}

        {/* Technical Footer */}
        <div className="pt-12 pb-8 flex flex-col items-center gap-4 border-t border-border-primary/10">
          <div className="flex items-center gap-6 opacity-40">
            <Terminal size={16} />
            <Activity size={16} />
            <div className="w-px h-4 bg-foreground-primary" />
            <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Non Custodial Data Stream</span>
          </div>
          <Typography variant="small" className="opacity-40 font-mono text-[8px] uppercase tracking-widest text-center">
            Transmission Cycle: {weather ? new Date(weather.lastUpdated).toLocaleTimeString() : "PENDING"} {"// Buffer 0x442"}
          </Typography>
          
          {/* Data Export */}
          {weather && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest">Export:</span>
              <button
                onClick={() => exportWeatherData(weather, 'json')}
                className="flex items-center gap-1.5 px-3 py-1 border border-border-primary text-[8px] font-mono uppercase hover:bg-accent hover:text-white transition-colors"
              >
                <Download size={10} /> JSON
              </button>
              <button
                onClick={() => exportWeatherData(weather, 'csv')}
                className="flex items-center gap-1.5 px-3 py-1 border border-border-primary text-[8px] font-mono uppercase hover:bg-accent hover:text-white transition-colors"
              >
                <Download size={10} /> CSV
              </button>
            </div>
          )}
        </div>

        <EmailCapture
          isOpen={showCapture}
          type={captureType}
          locationName={activeLocation?.name}
          emergencyCondition={survivalIndex?.fireRisk.level === "extreme" ? "EXTREME FIRE RISK" : undefined}
          onSubmit={(email) => submitEmail(email, activeLocation?.name)}
          onDismiss={dismiss}
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
        />
      </div>
    </FieldStationLayout>
  );
}
