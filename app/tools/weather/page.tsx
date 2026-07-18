"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, Download, Layers } from "lucide-react";
import { useWeatherLocations } from "../../hooks/useWeatherLocations";
import { useWeatherEmailCapture } from "../../hooks/useWeatherEmailCapture";
import { useFieldStation } from "@/app/context/FieldStationContext";
import { fetchWeatherData } from "@/lib/weatherApi";
import { calculateSurvivalIndex } from "@/lib/survivalIndex";
import { calculatePlantingIndex } from "@/lib/plantingIndex";
import type { WeatherData, ForecastDay, SurvivalIndex, PlantingIndex } from "@/lib/weatherTypes";

import { SectionHead, MarginNote, Stamp } from "@/components/field/kit";
import LocationManager from "@/components/tools/weather/LocationManager";
import RadarView from "@/components/tools/weather/RadarView";
import WeatherChart from "@/components/tools/weather/WeatherChart";
import HourlyChart from "@/components/tools/weather/HourlyChart";
import MoonPhaseDisplay from "@/components/tools/weather/MoonPhaseDisplay";
import GrowingSeasonTracker from "@/components/tools/weather/GrowingSeasonTracker";
import DashboardErrorBoundary from "@/components/ui/DashboardErrorBoundary";
import WeatherAlertsBanner from "@/components/tools/weather/WeatherAlertsBanner";
import EmailCapture from "@/components/weather/EmailCapture";
import FaqAccordion from "@/components/ui/FaqAccordion";

// SEO FAQ, serialized as FAQPage JSON-LD for rich results
const FAQS: { q: string; a: string }[] = [
  {
    q: "What are growing degree days and why do I need them?",
    a: "Growing degree days (GDD) are accumulated heat above a base temperature (50°F is standard for most crops). Plants and insects develop on heat, not calendar days, so GDD predicts crop maturation and pest emergence more accurately than dates. A spring with 200 GDD by April 1 is roughly two weeks ahead of one with 100 GDD on the same date.",
  },
  {
    q: "How is a rainwater catchment calculator useful for a small homestead?",
    a: "It tells you how many gallons you can store from each storm given your roof area, gutter efficiency, and storage capacity. That number plus a 14-day forecast tells you whether to start rationing now or expand your tanks.",
  },
  {
    q: "What soil temperature should I plant tomatoes at?",
    a: "60°F at four inches deep is the conservative threshold for tomatoes; 65°F is ideal. The chart reads soil temperature directly from Open-Meteo, so instead of a static reference table you get your soil right now. Cool-season crops (peas, lettuce, root crops) can germinate at 35 to 40°F; warm-season crops (tomatoes, peppers, melons) need 60°F and up.",
  },
  {
    q: "What's the difference between fire weather and fire danger?",
    a: "Fire weather is conditions: humidity, wind, dryness. Fire danger is the risk score from combining those conditions with fuel moisture and recent precipitation. The burn verdict on this chart folds both into one call, useful for deciding whether to do that brush burn this week.",
  },
  {
    q: "Does this work offline?",
    a: "Once weather data has loaded, the chart renders fully from cached data. New forecasts require connectivity, but the latest fetched data and your saved locations persist in your browser.",
  },
];

/* ── display helpers ─────────────────────────────────────────── */

type Tone = "text-moss" | "text-marker" | "text-rust" | "text-slateblue";

interface Verdict {
  q: string;
  v: string;
  tone: Tone;
  why: string;
}

function parseDay(dateStr: string) {
  return new Date(dateStr + "T12:00:00");
}

function dayShort(dateStr: string) {
  return parseDay(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

function dayLong(dateStr: string) {
  return parseDay(dateStr).toLocaleDateString("en-US", { weekday: "long" });
}

function ledgerDate(dateStr: string) {
  const d = parseDay(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dayShort(dateStr)} ${mm}/${dd}`;
}

function buildVerdicts(
  weather: WeatherData,
  si: SurvivalIndex,
  pi: PlantingIndex
): Verdict[] {
  const { current, forecast } = weather;
  const soilTemp = Math.round(current.soilTemperature ?? current.temperature - 5);
  const wind = Math.round(current.windSpeed);
  const humidity = Math.round(current.humidity);

  // Work the soil?
  const sw = pi.soilWorkability;
  const soilVerdict: Verdict = {
    q: "Work the soil?",
    v: { workable: "GO", "too-wet": "WAIT", "too-dry": "DRY", frozen: "NO" }[sw.status],
    tone: (
      { workable: "text-moss", "too-wet": "text-marker", "too-dry": "text-marker", frozen: "text-rust" } as const
    )[sw.status],
    why: `Soil ${soilTemp}°F. ${sw.description}`,
  };

  // Burn brush?
  const burnWhy: Record<SurvivalIndex["fireRisk"]["level"], string> = {
    low: `Wind ${wind} mph, humidity ${humidity}%. Burn small, with water at hand.`,
    moderate: `Wind ${wind} mph, humidity ${humidity}%. Keep piles small and stay with the fire.`,
    high: `Wind ${wind} mph, humidity ${humidity}%. Sparks will travel. Wait for damper air.`,
    extreme: `Wind ${wind} mph, humidity ${humidity}%. Do not burn. Not this week.`,
  };
  const burnVerdict: Verdict = {
    q: "Burn brush?",
    v: { low: "GO", moderate: "CARE", high: "NO", extreme: "NO" }[si.fireRisk.level],
    tone: (
      { low: "text-moss", moderate: "text-marker", high: "text-rust", extreme: "text-rust" } as const
    )[si.fireRisk.level],
    why: burnWhy[si.fireRisk.level],
  };

  // Catch water?
  const nextRainDay = si.waterCatchment.nextRain
    ? forecast.find((d) => d.date === si.waterCatchment.nextRain)
    : undefined;
  const waterVerdict: Verdict = nextRainDay
    ? {
        q: "Catch water?",
        v:
          nextRainDay.date === forecast[0]?.date
            ? "TODAY"
            : dayShort(nextRainDay.date).toUpperCase(),
        tone: "text-slateblue",
        why: `${nextRainDay.precipitation.toFixed(1)}" likely ${dayLong(nextRainDay.date)}. Set the barrels out the night before.`,
      }
    : {
        q: "Catch water?",
        v: "DRY",
        tone: "text-rust",
        why: "Nothing over a tenth of an inch on the 16-day sheet. Watch your stores.",
      };

  // Run solar?
  const se = si.solarEfficiency;
  const cloud = forecast[0]?.cloudCover ?? 0;
  const solarVerdict: Verdict =
    se.percentage >= 70
      ? {
          q: "Run solar?",
          v: "GOOD",
          tone: "text-moss",
          why: `${se.hours} peak sun hours today. Run the heavy loads while it lasts.`,
        }
      : se.percentage >= 40
        ? {
            q: "Run solar?",
            v: "FAIR",
            tone: "text-marker",
            why: `${se.hours} peak sun hours through ${cloud}% cloud. Charge the bank when it breaks.`,
          }
        : {
            q: "Run solar?",
            v: "POOR",
            tone: "text-rust",
            why: `${cloud}% cloud sitting on the panels. Budget the battery today.`,
          };

  return [soilVerdict, burnVerdict, waterVerdict, solarVerdict];
}

/* Per-day work-soil call for the week ledger, same thresholds as the
   soil-workability index but judged on that day's sheet alone */
function daySoilCall(day: ForecastDay): { word: string; ok: boolean; tone: Tone } {
  if (day.soilTemperature !== undefined && day.soilTemperature <= 32)
    return { word: "FROZEN", ok: false, tone: "text-rust" };
  if (day.precipitation > 0.5) return { word: "MUD", ok: false, tone: "text-slateblue" };
  if (day.precipitation > 0.15 && day.precipitationProbability > 50)
    return { word: "WAIT", ok: false, tone: "text-marker" };
  return { word: "GO", ok: true, tone: "text-moss" };
}

function buildBoard(si: SurvivalIndex, pi: PlantingIndex, forecast: ForecastDay[]): Verdict[] {
  const rows: Verdict[] = [];

  const spray = si.sprayConditions;
  rows.push({
    q: "Spray or foliar feed?",
    v: spray.suitable ? "GO" : "WAIT",
    tone: spray.suitable ? "text-moss" : "text-marker",
    why:
      spray.reason === "Conditions optimal"
        ? "Calm, mild, and humid enough. Spray in the morning lull."
        : `${spray.reason.charAt(0)}${spray.reason.slice(1).toLowerCase()}.`,
  });

  const f = pi.frostRisk;
  const confText = {
    high: "The models agree.",
    medium: "The models mostly agree.",
    low: "The models disagree, so hold this loosely.",
  }[f.confidence];
  rows.push({
    q: "Frost coming?",
    v: f.next7Days >= 60 ? "LIKELY" : f.next7Days >= 20 ? "WATCH" : "CLEAR",
    tone: f.next7Days >= 60 ? "text-rust" : f.next7Days >= 20 ? "text-marker" : "text-moss",
    why: `${f.next7Days}% odds inside 7 days, ${f.next14Days}% inside 14. ${confText}`,
  });

  const w = pi.plantingWindow;
  if (!w.opens) {
    rows.push({
      q: "Planting window?",
      v: "SHUT",
      tone: "text-rust",
      why: "No safe stretch on the sheet yet. Frost or heavy rain keeps breaking the run.",
    });
  } else if (w.opens === forecast[0]?.date) {
    rows.push({
      q: "Planting window?",
      v: "OPEN",
      tone: "text-moss",
      why: `${w.days} safe days running, ${w.confidence}% confidence.`,
    });
  } else {
    rows.push({
      q: "Planting window?",
      v: "SOON",
      tone: "text-marker",
      why: `Opens ${dayLong(w.opens)} with ${w.days} clear days behind it.`,
    });
  }

  const ls = si.livestockStress;
  rows.push({
    q: "The animals?",
    v: ls.level === "none" || ls.level === "low" ? "FINE" : ls.level === "moderate" ? "WATCH" : "STRESS",
    tone:
      ls.level === "none" || ls.level === "low"
        ? "text-moss"
        : ls.level === "moderate"
          ? "text-marker"
          : "text-rust",
    why: ls.description.endsWith(".") ? ls.description : `${ls.description}.`,
  });

  return rows;
}

/* Soil thermometer bands and copy */
function soilReading(soilTemp: number, estimated: boolean) {
  const word =
    soilTemp <= 32 ? "frozen"
    : soilTemp < 50 ? "cold"
    : soilTemp < 65 ? "workable"
    : soilTemp <= 75 ? "ideal"
    : soilTemp <= 85 ? "warm"
    : "stress";
  const tone: Tone =
    word === "frozen" ? "text-rust"
    : word === "cold" ? "text-slateblue"
    : word === "workable" || word === "ideal" ? "text-moss"
    : word === "warm" ? "text-marker"
    : "text-rust";
  const line = {
    frozen: "Nothing goes in. Wait for the thaw and check again.",
    cold: "Peas and spinach will take. Hold everything tender.",
    workable: "Cool-season crops go now. Tomatoes want 60° and rising.",
    ideal: "Everything goes in, tomatoes to sweet potatoes.",
    warm: "Fine for warm-season crops. Shade new transplants their first days.",
    stress: "Too hot to seed at midday. Sow at dusk and mulch heavy.",
  }[word];
  return { word, tone, line, source: estimated ? "estimated from air temp" : "4 in deep · Open-Meteo" };
}

/* Dotted fill-in-the-blank input */
function Blank({
  value,
  onChange,
  width = "w-20",
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  width?: string;
  label: string;
}) {
  return (
    <label className="inline-flex items-baseline gap-2">
      <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className={`${width} bg-transparent border-b-2 border-dotted border-ink/60 font-mono font-bold text-center text-lg focus:outline-none focus:border-marker`}
      />
    </label>
  );
}

function exportWeatherData(weather: WeatherData, format: "json" | "csv") {
  const locationName = weather.location.name.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().toISOString().split("T")[0];

  if (format === "json") {
    const blob = new Blob([JSON.stringify(weather, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weather_${locationName}_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const headers = ["Date", "High°F", "Low°F", "Precip(in)", "Precip%", "Wind(mph)", "UV", "Cloud%"];
    const rows = weather.forecast.map((day) => [
      day.date, day.maxTemp, day.minTemp, day.precipitation,
      day.precipitationProbability, day.windSpeed, day.uvIndex, day.cloudCover,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weather_${locationName}_${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const ROOF_STORAGE_KEY = "homesteader_roof_sqft";

export default function WeatherPage() {
  const { locations, activeLocation, switchLocation, addLocation, removeLocation, isLoaded } = useWeatherLocations();
  const { frostDates } = useFieldStation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radarOpen, setRadarOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Catchment calculator
  const [roof, setRoof] = useState("200");
  const [rain, setRain] = useState("0.5");
  const [rainTouched, setRainTouched] = useState(false);

  const {
    showCapture, captureType, isSubmitting, isSuccess, isError,
    submitEmail, dismiss, showWeeklyCapture,
  } = useWeatherEmailCapture(locations.length);

  const survivalIndex = useMemo(() => (weather ? calculateSurvivalIndex(weather) : null), [weather]);
  const plantingIndex = useMemo(() => (weather ? calculatePlantingIndex(weather) : null), [weather]);

  const verdicts = useMemo(
    () => (weather && survivalIndex && plantingIndex ? buildVerdicts(weather, survivalIndex, plantingIndex) : null),
    [weather, survivalIndex, plantingIndex]
  );
  const board = useMemo(
    () => (weather && survivalIndex && plantingIndex ? buildBoard(survivalIndex, plantingIndex, weather.forecast) : null),
    [weather, survivalIndex, plantingIndex]
  );

  const nextStorm = useMemo(() => {
    if (!weather || !survivalIndex?.waterCatchment.nextRain) return null;
    return weather.forecast.find((d) => d.date === survivalIndex.waterCatchment.nextRain) ?? null;
  }, [weather, survivalIndex]);

  const loadWeather = useCallback(async () => {
    if (!activeLocation) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherData(activeLocation.lat, activeLocation.lon);
      setWeather(data);
      setRetryCount(0);
    } catch {
      setError("No signal");
    } finally {
      setLoading(false);
    }
  }, [activeLocation]);

  const handleRetry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        loadWeather();
      }, delay);
    }
  }, [retryCount, loadWeather]);

  useEffect(() => {
    if (!isLoaded || !activeLocation) return;
    loadWeather();
  }, [activeLocation, isLoaded, loadWeather, retryCount]);

  // Roof size survives reloads; it's a property of the homestead, not the session
  useEffect(() => {
    const saved = localStorage.getItem(ROOF_STORAGE_KEY);
    if (saved) setRoof(saved);
  }, []);
  useEffect(() => {
    if (roof) localStorage.setItem(ROOF_STORAGE_KEY, roof);
  }, [roof]);

  // Prefill the calculator with the next storm on the sheet until the user edits it
  useEffect(() => {
    if (!rainTouched && nextStorm) setRain(nextStorm.precipitation.toFixed(1));
  }, [nextStorm, rainTouched]);

  const roofN = parseFloat(roof) || 0;
  const rainN = parseFloat(rain) || 0;
  const gallons = roofN * rainN * 0.623;
  const barrels = gallons / 55;
  const cans = gallons / 2;

  const soilTemp = weather ? Math.round(weather.current.soilTemperature ?? weather.current.temperature - 5) : null;
  const soil = soilTemp !== null && weather ? soilReading(soilTemp, weather.current.soilTemperature === undefined) : null;
  const soilPct = soilTemp !== null ? Math.min(100, Math.max(0, ((soilTemp - 32) / (95 - 32)) * 100)) : 0;

  const asOf = weather
    ? `${new Date(weather.lastUpdated).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · as of ${new Date(weather.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase()}`
    : "";

  return (
    <>
      {/* ── Header band ─────────────────────────────────────── */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/tools/" className="hover:text-marker underline underline-offset-4">
              Workbench
            </Link>
            <span>/</span>
            <span>No. 01 · Weather Station</span>
            <span className="ml-auto">Data: Open-Meteo · updates hourly</span>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            The wall chart: should you go outside?
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl leading-relaxed text-ink/85 italic">
            Four verdicts before one number. The chart answers the day&apos;s
            questions in a word or two, and the figures sit underneath if you
            want them.
          </p>
          <div className="mt-6">
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
          </div>
        </div>
      </section>

      {/* ── No location yet ─────────────────────────────────── */}
      {isLoaded && !activeLocation && (
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-16">
          <div className="border-2 border-dashed border-ink/40 p-10 text-center">
            <p className="font-display uppercase text-xl mb-2">Pin the chart to a place</p>
            <p className="text-ink/70 max-w-md mx-auto">
              Add a town, ZIP, or coordinates above. It stays in your browser
              and the whole chart calibrates to it.
            </p>
          </div>
        </section>
      )}

      {/* ── Loading ─────────────────────────────────────────── */}
      {(!isLoaded || (loading && activeLocation)) && (
        <section className="max-w-6xl mx-auto px-4 py-24 text-center">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.3em] text-ink/50 animate-pulse">
            Pulling the sheet from Open-Meteo...
          </p>
        </section>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && !loading && (
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-16">
          <div className="card-paper grain p-8 text-center">
            <p className="font-display uppercase text-3xl text-rust relative z-[2]">No signal</p>
            <p className="mt-2 text-ink/70 relative z-[2]">
              Could not reach Open-Meteo. The last fetched sheet stays cached once you have one.
            </p>
            {retryCount < MAX_RETRIES ? (
              <button
                onClick={handleRetry}
                className="mt-5 px-5 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.72rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors relative z-[2]"
              >
                Try again ({MAX_RETRIES - retryCount} left)
              </button>
            ) : (
              <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-wider text-rust relative z-[2]">
                Out of retries. Check the connection and reload.
              </p>
            )}
          </div>
        </section>
      )}

      {weather && !loading && survivalIndex && plantingIndex && (
        <>
          {/* ── Alerts ──────────────────────────────────────── */}
          {weather.alerts.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 pt-8">
              <WeatherAlertsBanner alerts={weather.alerts} />
            </section>
          )}

          {/* ── §1 Today's verdicts ─────────────────────────── */}
          <section className="max-w-6xl mx-auto px-4 pt-12">
            <SectionHead no="§1" title="Today's Verdicts" right={asOf} />
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {verdicts?.map((v) => (
                <div key={v.q} className="card-paper grain p-5">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/60 relative z-[2]">
                    {v.q}
                  </p>
                  <p className={`font-display uppercase text-5xl mt-2 ${v.tone} relative z-[2]`}>{v.v}</p>
                  <p className="mt-3 text-[0.92rem] leading-snug text-ink/80 border-t border-dotted border-ink/40 pt-3 relative z-[2]">
                    {v.why}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── §2 The week, ruled ──────────────────────────── */}
          <section className="max-w-6xl mx-auto px-4 pt-16">
            <SectionHead no="§2" title="The Week, Ruled" right="work-soil call judged per day" />
            <div className="card-paper grain overflow-hidden">
              <div className="ruled px-4 py-3 overflow-x-auto relative z-[2]">
                <table className="w-full font-mono text-[0.78rem] min-w-[540px]">
                  <thead>
                    <tr className="text-left uppercase tracking-widest text-[0.64rem] text-ink/55">
                      <th className="py-1.5 pr-2 font-semibold">Day</th>
                      <th className="py-1.5 pr-2 font-semibold">Hi / Lo</th>
                      <th className="py-1.5 pr-2 font-semibold">Rain</th>
                      <th className="py-1.5 pr-2 font-semibold">Wind</th>
                      <th className="py-1.5 pr-2 font-semibold">Soil</th>
                      <th className="py-1.5 font-semibold">Work soil?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weather.forecast.slice(0, 7).map((day) => {
                      const call = daySoilCall(day);
                      const frosty = day.minTemp <= 35;
                      return (
                        <tr key={day.date} className="h-[36px]">
                          <td className="pr-2 font-semibold">{ledgerDate(day.date)}</td>
                          <td className="pr-2">
                            {Math.round(day.maxTemp)} /{" "}
                            <span className={frosty ? "text-rust font-bold" : undefined}>
                              {Math.round(day.minTemp)}°F
                            </span>
                          </td>
                          <td className="pr-2">{day.precipitation.toFixed(1)}&quot;</td>
                          <td className="pr-2">{Math.round(day.windSpeed)} mph</td>
                          <td className="pr-2">
                            {day.soilTemperature !== undefined ? `${Math.round(day.soilTemperature)}°F` : "–"}
                          </td>
                          <td>
                            <span className={`font-bold ${call.tone}`}>
                              {call.ok ? "✓ " : "✕ "}
                              {call.word}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── §3 Heat and soil gauges ─────────────────────── */}
          <section className="max-w-6xl mx-auto px-4 pt-16 grid lg:grid-cols-2 gap-8 items-start">
            <DashboardErrorBoundary label="GDD_TRACKER">
              <GrowingSeasonTracker
                forecast={weather.forecast}
                locationName={activeLocation?.name || "default"}
              />
            </DashboardErrorBoundary>

            {soil && soilTemp !== null && (
              <div className="card-paper grain p-6">
                <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-5 relative z-[2]">
                  <h3 className="font-display uppercase text-lg">Soil thermometer</h3>
                  <span className="font-mono text-[0.66rem] uppercase tracking-widest text-ink/50">
                    {soil.source}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-3 relative z-[2]">
                  <span className="font-display text-4xl">{soilTemp}°F</span>
                  <span className={`font-mono text-[0.72rem] uppercase tracking-wider font-bold ${soil.tone}`}>
                    {soil.word}
                  </span>
                </div>
                <div className="relative h-8 border-2 border-ink z-[2]">
                  <div className="absolute inset-y-0 left-0 bg-slateblue/25" style={{ width: "28.6%" }} />
                  <div className="absolute inset-y-0 bg-moss/25" style={{ left: "28.6%", width: "23.8%" }} />
                  <div className="absolute inset-y-0 bg-moss/60" style={{ left: "52.4%", width: "15.9%" }} />
                  <div className="absolute inset-y-0 bg-marker/25" style={{ left: "68.3%", right: 0 }} />
                  <div
                    className="absolute -top-1.5 -bottom-1.5 w-1 bg-ink"
                    style={{ left: `calc(${soilPct}% - 2px)` }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[0.64rem] text-ink/55 mt-1.5 relative z-[2]">
                  <span>32° too cold</span>
                  <span>50° workable</span>
                  <span>65-75° ideal</span>
                  <span>85°+ stress</span>
                </div>
                <p className="mt-4 text-[0.95rem] text-ink/80 leading-snug relative z-[2]">{soil.line}</p>
              </div>
            )}
          </section>

          {/* ── §4 The rest of the board ────────────────────── */}
          <section className="max-w-6xl mx-auto px-4 pt-16">
            <SectionHead no="§3" title="The Rest of the Board" right="smaller calls, same sheet" />
            <div className="card-paper grain">
              <div className="relative z-[2] divide-y divide-dotted divide-ink/40">
                {board?.map((row) => (
                  <div
                    key={row.q}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[220px_110px_1fr] gap-x-4 gap-y-1 items-baseline px-5 py-4"
                  >
                    <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink/60">
                      {row.q}
                    </p>
                    <p className={`font-display uppercase text-2xl ${row.tone}`}>{row.v}</p>
                    <p className="col-span-2 sm:col-span-1 text-[0.92rem] leading-snug text-ink/80">
                      {row.why}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── §5 Catchment calculator ─────────────────────── */}
          <section className="max-w-6xl mx-auto px-4 pt-16">
            <SectionHead
              no="§4"
              title={nextStorm ? `${dayLong(nextStorm.date)}'s Storm, In Gallons` : "The Next Storm, In Gallons"}
              right="0.623 gal per sq ft per inch"
            />
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
              <div className="card-paper grain p-6 md:p-8 relative">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-4 relative z-[2]">
                  Fill in the blanks
                </p>
                <div className="flex flex-wrap gap-x-10 gap-y-5 relative z-[2]">
                  <Blank label="Roof feeding the barrel (sq ft)" value={roof} onChange={setRoof} width="w-24" />
                  <Blank
                    label="Rain expected (inches)"
                    value={rain}
                    onChange={(v) => {
                      setRainTouched(true);
                      setRain(v);
                    }}
                  />
                </div>
                <div className="mt-8 pt-6 border-t-2 border-ink flex flex-wrap items-baseline gap-x-4 gap-y-2 relative z-[2]">
                  <span className="font-display text-6xl leading-none">
                    {gallons > 0 ? gallons.toFixed(0) : "–"}
                  </span>
                  <span className="font-mono text-[0.78rem] uppercase tracking-wider text-ink/60">
                    gallons off your roof
                  </span>
                </div>
                <p className="mt-3 text-[1.02rem] text-ink/85 relative z-[2]">
                  That&apos;s <strong className="font-bold">{barrels >= 0.05 ? barrels.toFixed(1) : "–"}</strong> of
                  a 55-gal barrel, or about{" "}
                  <strong className="font-bold">{cans > 0 ? cans.toFixed(0) : "–"}</strong> watering cans.{" "}
                  {gallons > 55 ? "One barrel is not enough. Chain two." : "One barrel covers it."}
                </p>
                {/* the one handwritten note on the page */}
                <MarginNote side="left">← first 10 minutes rinses the roof. divert it.</MarginNote>
              </div>

              {/* the one tilted aside: no data, just the lesson */}
              <div className="border-2 border-ink bg-kraft grain p-5 rotate-1">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2 relative z-[2]">
                  If you remember one thing
                </p>
                <p className="font-serif text-lg leading-snug relative z-[2]">
                  A modest roof on a <span className="hl">modest storm</span> out-fills any rain
                  barrel you can buy. The bottleneck is storage, not rain.
                </p>
                <div className="mt-4 relative z-[2]">
                  <Stamp color="text-slateblue">Stored locally</Stamp>
                </div>
              </div>
            </div>
          </section>

          {/* ── §6 The figures underneath ───────────────────── */}
          <section className="max-w-6xl mx-auto px-4 pt-16 pb-4">
            <SectionHead no="§5" title="The Figures Underneath" right="for the ones who check the math" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 card-paper grain p-5">
                <div className="relative z-[2]">
                  <HourlyChart hourly={weather.forecast[0]?.hourly || []} />
                </div>
              </div>
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="card-paper grain p-5">
                  <div className="relative z-[2]">
                    <WeatherChart forecast={weather.forecast} />
                  </div>
                </div>
                <MoonPhaseDisplay />
              </div>
            </div>

            {/* Radar, collapsed by default */}
            <div className="mt-6">
              <button
                onClick={() => setRadarOpen((o) => !o)}
                className="flex items-center gap-3 w-full text-left px-4 py-3 border-2 border-ink/40 hover:border-ink bg-paper transition-colors group"
              >
                <Layers size={12} className="text-marker" />
                <span className="font-mono text-[0.68rem] uppercase font-bold tracking-widest text-ink/70 group-hover:text-ink flex-1">
                  Radar · live view
                </span>
                <ChevronDown
                  size={12}
                  className={`text-ink/50 transition-transform duration-200 ${radarOpen ? "rotate-180" : ""}`}
                />
              </button>
              {radarOpen && activeLocation && (
                <div className="mt-4">
                  <RadarView lat={activeLocation.lat} lon={activeLocation.lon} />
                </div>
              )}
            </div>

            {/* Take the sheet with you */}
            <div className="mt-8 flex items-center justify-center gap-3 border-t border-ink/20 pt-6">
              <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
                Take the sheet:
              </span>
              <button
                onClick={() => exportWeatherData(weather, "json")}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink/40 font-mono text-[0.64rem] uppercase tracking-wider text-ink/70 hover:border-ink hover:text-ink transition-colors"
              >
                <Download size={10} /> JSON
              </button>
              <button
                onClick={() => exportWeatherData(weather, "csv")}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink/40 font-mono text-[0.64rem] uppercase tracking-wider text-ink/70 hover:border-ink hover:text-ink transition-colors"
              >
                <Download size={10} /> CSV
              </button>
            </div>
          </section>
        </>
      )}

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

      {/* SEO anchor block: GDD calculator + rainwater catchment + soil temp cluster */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="max-w-3xl mt-12 pt-8 border-t-2 border-ink">
          <h2 className="font-display uppercase text-xl md:text-2xl mb-4">
            An off-grid weather station: survival index, GDD, and rainwater catchment
          </h2>
          <div className="space-y-4 text-[1.02rem] leading-relaxed text-ink/85">
            <p>
              Most weather apps tell you what the weather will be. They don&apos;t tell you what
              to do about it. This chart cross-references real-time weather data from
              Open-Meteo against the questions a homesteader actually has:{" "}
              <em>
                Is it dry enough to burn? Will the soil work tomorrow? How much water can I
                catch from this storm? When will pest pressure peak?
              </em>
            </p>
            <p>The output is a set of indices computed for your exact location:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Survival index:</strong> fire danger, water catchment potential, solar
                generation efficiency, livestock stress
              </li>
              <li>
                <strong>Planting index:</strong> soil workability, frost risk, growing degree
                days, and the planting window
              </li>
              <li>
                <strong>Growing degree days (GDD):</strong> accumulated heat units in real time,
                so you can predict crop maturation and pest emergence
              </li>
            </ul>
            <p>No login, no subscription, no ads. Set your ZIP, get every index live.</p>
          </div>

          <h3 className="font-display uppercase text-base md:text-lg mt-10 mb-4">
            Frequently asked questions
          </h3>
          <FaqAccordion faqs={FAQS} prefix="FIELD" numWidth={3} />

          {/* FAQPage JSON-LD, eligible for Google rich results */}
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
        </div>
      </section>
    </>
  );
}
