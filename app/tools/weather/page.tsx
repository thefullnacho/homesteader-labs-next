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
import FieldStationBridge from "@/components/ui/FieldStationBridge";
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
import DashboardErrorBoundary from "@/components/ui/DashboardErrorBoundary";
import WeatherAlertsBanner from "@/components/tools/weather/WeatherAlertsBanner";

type DashboardMode = "SURVIVAL" | "PLANTING";

// SEO FAQ — serialized as FAQPage JSON-LD for rich results
const FAQS: { q: string; a: string }[] = [
  {
    q: "What are growing degree days and why do I need them?",
    a: "Growing degree days (GDD) are accumulated heat above a base temperature (50°F is standard for most crops). Plants and insects develop on heat, not calendar days, so GDD predicts crop maturation and pest emergence more accurately than dates. A spring with 200 GDD by April 1 is roughly two weeks ahead of one with 100 GDD on the same date.",
  },
  {
    q: "How is a rainwater catchment calculator useful for a small homestead?",
    a: "It tells you how many gallons you can store from each storm given your roof area, gutter efficiency, and storage capacity. That number plus a 14-day forecast tells you whether to start rationing now or expand your tanks. The Survival Index uses both to compute a 'days of water' projection.",
  },
  {
    q: "What soil temperature should I plant tomatoes at?",
    a: "60°F at four inches deep is the conservative threshold for tomatoes; 65°F is ideal. The dashboard reads soil temperature directly from Open-Meteo soil sensor data — meaning instead of a static chart you get your soil right now. Cool-season crops (peas, lettuce, root crops) can germinate at 35–40°F; warm-season crops (tomatoes, peppers, melons) need 60°F+.",
  },
  {
    q: "What's the difference between fire weather and fire danger?",
    a: "Fire weather is conditions (humidity, wind, dryness). Fire danger is the risk score from combining those conditions with fuel moisture and recent precipitation. The Survival Index uses both to surface a single danger level — useful for deciding whether to do that brush burn this week.",
  },
  {
    q: "Does this work offline?",
    a: "Once weather data has loaded, the dashboard renders fully from cached data. New forecasts require connectivity, but the latest fetched data and your saved locations persist in your browser.",
  },
];

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
    showCapture, captureType, isSubmitting, isSuccess, isError,
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
      setError("Connection error");
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
    ? new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' // Live'
    : loading ? 'Loading...' : 'No data';

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
              Loading {activeLocation?.id || ""}...
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
            <Typography variant="h1" className="mb-1 uppercase tracking-tight font-mono text-2xl md:text-4xl">Weather Station</Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              Multi-source forecast // Open-Meteo
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
              Add a location to get started
            </Typography>
          </BrutalistBlock>
        )}

        {weather && (
          <div className="animate-in fade-in duration-500 space-y-8">

            {/* ── ALERTS ─────────────────────────────────────── */}
            {weather.alerts.length > 0 && (
              <WeatherAlertsBanner alerts={weather.alerts} />
            )}

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
                <DymoLabel className="text-xs shrink-0">Field Analysis</DymoLabel>
                <div className="flex border-2 border-border-primary bg-black/20 shrink-0">
                  <button
                    onClick={() => setMode("SURVIVAL")}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold font-mono uppercase transition-all ${
                      mode === "SURVIVAL" ? "bg-accent text-white" : "opacity-40 hover:opacity-100"
                    }`}
                  >
                    <ShieldAlert size={12} /> Survival
                  </button>
                  <button
                    onClick={() => setMode("PLANTING")}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold font-mono uppercase transition-all ${
                      mode === "PLANTING" ? "bg-accent text-white" : "opacity-40 hover:opacity-100"
                    }`}
                  >
                    <Sprout size={12} /> Planting
                  </button>
                </div>
                <div className="h-[2px] flex-grow bg-border-primary/20" />
              </div>

              {mode === "SURVIVAL" && survivalIndex && (
                <DashboardErrorBoundary label="SURVIVAL_OPS">
                  <SurvivalDashboard index={survivalIndex} />
                </DashboardErrorBoundary>
              )}

              {mode === "PLANTING" && plantingIndex && (
                <DashboardErrorBoundary label="PLANTING_LOG">
                  <PlantingDashboard index={plantingIndex} />
                </DashboardErrorBoundary>
              )}

              {mode === "PLANTING" && (
                <div className="mt-8">
                  <DashboardErrorBoundary label="GDD_TRACKER">
                    <GrowingSeasonTracker
                      forecast={weather.forecast}
                      locationName={activeLocation?.name || 'default'}
                    />
                  </DashboardErrorBoundary>
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
                  Radar — Live View
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
              Reconnecting...
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
            <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Weather data via Open-Meteo</span>
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
          isError={isError}
        />

        {/* SEO anchor block — targets GDD calculator + rainwater catchment + soil temp cluster */}
        <section className="mt-16 pt-6 border-t border-border-primary/30 max-w-3xl">
          <Typography variant="h2" className="mb-4 text-xl md:text-2xl normal-case font-mono">
            Off-grid weather station — survival index, GDD, and rainwater catchment
          </Typography>
          <div className="space-y-4 text-sm md:text-base font-mono opacity-80 leading-relaxed">
            <p>
              Most weather apps tell you what the weather will be. They don&apos;t tell
              you what to do about it. This dashboard cross-references real-time weather
              data from Open-Meteo against the questions a homesteader actually has:
              <em> Is it dry enough to burn? Will the soil work tomorrow? How much water
              can I catch from this storm? When will pest pressure peak?</em>
            </p>
            <p>
              The output is a set of indices computed for your exact location:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Survival index</strong> — fire danger, water catchment potential, solar generation efficiency, livestock metabolic stress</li>
              <li><strong>Planting index</strong> — soil workability, frost risk, growing degree days, planting suitability per crop family</li>
              <li><strong>Growing degree days (GDD)</strong> — accumulated heat units in real time so you can predict crop maturation and pest emergence</li>
            </ul>
            <p>
              No login, no subscription, no ads. Set your ZIP, get every index live.
            </p>
          </div>

          <Typography variant="h3" className="mt-10 mb-4 text-base md:text-lg normal-case font-mono">
            Frequently asked questions
          </Typography>
          <dl className="space-y-6 font-mono text-sm md:text-base">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="font-bold mb-1 opacity-90">{faq.q}</dt>
                <dd className="opacity-70 leading-relaxed">{faq.a}</dd>
              </div>
            ))}
          </dl>

          {/* FAQPage JSON-LD — eligible for Google rich results */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQS.map(({ q, a }) => ({
                  "@type": "Question",
                  name: q,
                  acceptedAnswer: { "@type": "Answer", text: a },
                })),
              }),
            }}
          />
        </section>

        <FieldStationBridge currentOps="WEATHER" />

      </div>
    </FieldStationLayout>
  );
}
