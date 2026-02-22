"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertCircle, Terminal, Activity, ShieldAlert, Sprout } from "lucide-react";
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

type DashboardMode = "SURVIVAL" | "PLANTING";

export default function WeatherPage() {
  const { locations, activeLocation, switchLocation, addLocation, removeLocation, isLoaded } = useWeatherLocations();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DashboardMode>("SURVIVAL");

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

  useEffect(() => {
    if (!isLoaded || !activeLocation) return;

    async function loadWeather() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherData(activeLocation!.lat, activeLocation!.lon);
        setWeather(data);
      } catch {
        setError("TELEMETRY_LINK_SEVERED");
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [activeLocation, isLoaded]);

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

        {activeLocation ? (
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
        ) : (
          <BrutalistBlock className="p-12 text-center border-dashed border-border-primary/40">
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Typography variant="small" className="font-mono font-bold uppercase text-[10px] mb-0 opacity-40">Ensemble 7D Outlook</Typography>
                <div className="h-[1px] flex-grow bg-border-primary/10" />
              </div>
              <ForecastGrid forecast={weather.forecast} />
            </div>
          </div>
        )}


        {error && (
          <BrutalistBlock className="p-12 text-center border-red-500 bg-red-500/5">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4 opacity-40" />
            <Typography variant="h3" className="text-red-500 uppercase font-mono">{error}</Typography>
            <Typography variant="body" className="opacity-60 text-xs mt-2 uppercase font-mono">Attempting to re-establish uplink...</Typography>
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
