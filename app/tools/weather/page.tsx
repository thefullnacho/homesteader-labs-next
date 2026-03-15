"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, Terminal, Activity, ShieldAlert, Sprout, Download, ChevronDown, Layers } from "lucide-react";
import { useWeatherLocations } from "../../hooks/useWeatherLocations";
import { useWeatherEmailCapture } from "../../hooks/useWeatherEmailCapture";
import { useFieldStation } from "@/app/context/FieldStationContext";
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
    const headers = ['Date', 'High°F', 'Low°F', 'Precip(in)', 'Precip%', 'Wind(mph)', 'UV', 'Cloud%'];
    const rows = weather.forecast.map(day => [
      day.date, day.maxTemp, day.minTemp, day.precipitation,
      day.precipitationProbability, day.windSpeed, day.uvIndex, day.cloudCover,
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
  const { frostDates } = useFieldStation();
  const [weather, setWeather]     = useState<WeatherData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [mode, setMode]           = useState<DashboardMode>("SURVIVAL");
  const [radarOpen, setRadarOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const {
    showCapture, captureType, isSubmitting, isSuccess,
    submitEmail, dismiss, showWeeklyCapture,
  } = useWeatherEmailCapture(locations.length);

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
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => { setRetryCount(prev => prev + 1); loadWeather(); }, delay);
    }
  }, [retryCount, loadWeather]);

  useEffect(() => {
    if (!isLoaded || !activeLocation) return;
    loadWeather();
  }, [activeLocation, isLoaded, loadWeather, retryCount]);

  // Badge label: timestamp once data is loaded
  const badgeLabel = weather
    ? new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' // STABLE'
    : loading ? 'ACQUIRING...' : 'NO_SIGNAL';

  if (!isLoaded || (loading && activeLocation)) {
    return (
      <FieldStationLayout stationId="HL_WEATHER_STATION">
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-4">
            <div className="font-mono text-sm tracking-[0.3em] opacity-40">
              {(['[', '=', '=', '=', '=', '-', '-', '-', '-', ']'] as string[]).map((c, i) => (
                <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>{c}</span>
              ))}
            </div>
            <Typography variant="small" className="font-mono uppercase tracking-widest opacity-30">
              Initializing Stream: {activeLocation?.id || "NULL"}
            </Typography>
          </div>
        </div>
      </FieldStationLayout>
    );
  }

  return (
    <FieldStationLayout stationId="HL_WEATHER_STATION">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-2 border-border-primary pb-6">
          <div>
            <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono">Weather Station</Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              Multi-Source Ensemble Telemetry // OPEN_METEO_V4
            </Typography>
          </div>
          <Badge variant="status" pulse>{badgeLabel}</Badge>
        </div>

        {/* ── LOCATION BAR ───────────────────────────────────── */}
        <LocationManager
          locations={locations}
          activeLocation={activeLocation}
          growingZone={frostDates?.growingZone}
          onSwitch={switchLocation}
          onAdd={(loc) => {
            const prev = locations.length;
            addLocation(loc);
            if (prev === 1) setTimeout(() => showWeeklyCapture(), 500);
          }}
          onRemove={removeLocation}
        />

        {!activeLocation && (
          <BrutalistBlock className="p-12 text-center border-dashed border-border-primary/40 mb-8">
            <Typography variant="body" className="opacity-40 font-mono uppercase text-sm">
              Waiting for coordinate input to initialize node...
            </Typography>
          </BrutalistBlock>
        )}

        {weather && (
          <div className="animate-in fade-in duration-500 space-y-8">

            {/* ── CURRENT CONDITIONS ─────────────────────────── */}
            <TelemetryHeader weather={weather} />

            {/* ── TWO-COLUMN: 24h chart | 7-day + moon ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Left — 24h micro-trend */}
              <div className="lg:col-span-3 p-5 bg-black/20 border-2 border-border-primary">
                <HourlyChart hourly={weather.forecast[0]?.hourly || []} />
              </div>

              {/* Right — 7-day outlook + lunar phase */}
              <div className="lg:col-span-2 space-y-4 flex flex-col">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Typography variant="small" className="font-mono font-bold uppercase text-xs mb-0 opacity-40">
                      Ensemble 7D Outlook
                    </Typography>
                    <div className="h-[1px] flex-grow bg-border-primary/10" />
                  </div>
                  <ForecastGrid forecast={weather.forecast} />
                </div>
                <MoonPhaseDisplay />
              </div>
            </div>

            {/* ── FIELD ANALYSIS DASHBOARD ───────────────────── */}
            <div>
              {/* Inline mode toggle + section divider */}
              <div className="flex items-center gap-4 mb-6">
                <DymoLabel className="text-xs shrink-0">FIELD_ANALYSIS V.2</DymoLabel>
                <div className="flex border-2 border-border-primary bg-black/20 shrink-0">
                  <button
                    onClick={() => setMode("SURVIVAL")}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold font-mono uppercase transition-all ${
                      mode === "SURVIVAL" ? "bg-accent text-white" : "opacity-40 hover:opacity-100"
                    }`}
                  >
                    <ShieldAlert size={12} /> Survival Ops
                  </button>
                  <button
                    onClick={() => setMode("PLANTING")}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold font-mono uppercase transition-all ${
                      mode === "PLANTING" ? "bg-accent text-white" : "opacity-40 hover:opacity-100"
                    }`}
                  >
                    <Sprout size={12} /> Planting Log
                  </button>
                </div>
                <div className="h-[2px] flex-grow bg-border-primary/20" />
              </div>

              {mode === "SURVIVAL" && survivalIndex && (
                <SurvivalDashboard index={survivalIndex} />
              )}

              {mode === "PLANTING" && plantingIndex && (
                <PlantingDashboard index={plantingIndex} />
              )}

              {mode === "PLANTING" && (
                <div className="mt-8">
                  <GrowingSeasonTracker
                    forecast={weather.forecast}
                    locationName={activeLocation?.name || 'default'}
                  />
                </div>
              )}
            </div>

            {/* ── RADAR — collapsible ─────────────────────────── */}
            <div>
              <button
                onClick={() => setRadarOpen(o => !o)}
                className="flex items-center gap-3 w-full text-left px-4 py-3 border-2 border-border-primary/30 hover:border-border-primary bg-black/20 transition-colors group"
              >
                <Layers size={12} className="text-accent opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-mono uppercase font-bold opacity-60 group-hover:opacity-100 tracking-widest transition-opacity flex-1">
                  Radar_View — Live Atmospheric Telemetry
                </span>
                <ChevronDown
                  size={12}
                  className={`opacity-40 transition-transform duration-200 ${radarOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {radarOpen && activeLocation && (
                <div className="mt-0 border-t-0">
                  <RadarView lat={activeLocation.lat} lon={activeLocation.lon} />
                </div>
              )}
            </div>

            {/* ── 7-DAY TEMPERATURE TREND ─────────────────────── */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Typography variant="small" className="font-mono font-bold uppercase text-xs mb-0 opacity-40">
                  7D Temperature Trend
                </Typography>
                <div className="h-[1px] flex-grow bg-border-primary/10" />
              </div>
              <div className="p-6 bg-black/20 border-2 border-border-primary">
                <WeatherChart forecast={weather.forecast} />
              </div>
            </div>

          </div>
        )}

        {error && (
          <BrutalistBlock className="p-12 text-center border-red-500 bg-red-500/5">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4 opacity-40" />
            <Typography variant="h3" className="text-red-500 uppercase font-mono">{error}</Typography>
            <Typography variant="body" className="opacity-60 text-xs mt-2 uppercase font-mono">
              Attempting to re-establish uplink...
            </Typography>
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

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <div className="pt-8 pb-4 flex flex-col items-center gap-4 border-t border-border-primary/10">
          <div className="flex items-center gap-6 opacity-30">
            <Terminal size={14} />
            <Activity size={14} />
            <div className="w-px h-4 bg-foreground-primary" />
            <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Non Custodial Data Stream</span>
          </div>
          {weather && (
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-mono opacity-30 uppercase tracking-widest">Export:</span>
              <button
                onClick={() => exportWeatherData(weather, 'json')}
                className="flex items-center gap-1.5 px-3 py-1 border border-border-primary/30 text-[8px] font-mono uppercase hover:bg-accent hover:text-white hover:border-accent transition-colors opacity-40 hover:opacity-100"
              >
                <Download size={10} /> JSON
              </button>
              <button
                onClick={() => exportWeatherData(weather, 'csv')}
                className="flex items-center gap-1.5 px-3 py-1 border border-border-primary/30 text-[8px] font-mono uppercase hover:bg-accent hover:text-white hover:border-accent transition-colors opacity-40 hover:opacity-100"
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
          onSubmit={(email) => submitEmail(email)}
          onDismiss={dismiss}
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
        />

      </div>
    </FieldStationLayout>
  );
}
