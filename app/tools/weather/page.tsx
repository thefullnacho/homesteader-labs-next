"use client";

import { useState, useEffect } from "react";
import { 
  Cloud, Sun, Wind, Droplets, Thermometer, Eye, 
  MapPin, Plus, X, AlertTriangle, Sprout, Flame,
  Droplet, Zap, Beef, AlertCircle, CheckCircle, Trash2
} from "lucide-react";
import { useWeatherLocations } from "../../hooks/useWeatherLocations";
import { useWeatherEmailCapture } from "../../hooks/useWeatherEmailCapture";
import EmailCapture from "../../components/weather/EmailCapture";
import { fetchWeatherData, geocodeLocation, geocodeZipCode, parseCoordinates } from "../../lib/weatherApi";
import { calculateSurvivalIndex } from "../../lib/survivalIndex";
import { calculatePlantingIndex, formatFrostRisk, formatConfidence } from "../../lib/plantingIndex";
import type { WeatherData, SurvivalIndex, PlantingIndex } from "../../lib/weatherTypes";

type AddLocationMode = "city" | "zip" | "coords";

export default function WeatherPage() {
  const { locations, activeLocation, switchLocation, addLocation, removeLocation, isLoaded } = useWeatherLocations();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [survivalIndex, setSurvivalIndex] = useState<SurvivalIndex | null>(null);
  const [plantingIndex, setPlantingIndex] = useState<PlantingIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addMode, setAddMode] = useState<AddLocationMode>("city");
  const [cityQuery, setCityQuery] = useState("");
  const [zipQuery, setZipQuery] = useState("");
  const [latQuery, setLatQuery] = useState("");
  const [lonQuery, setLonQuery] = useState("");
  const [addingLocation, setAddingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Email capture for weather station
  const {
    showCapture,
    captureType,
    isSubmitting,
    isSuccess,
    submitEmail,
    dismiss,
    showWeeklyCapture
  } = useWeatherEmailCapture(locations.length);

  // Fetch weather data when active location changes
  useEffect(() => {
    if (!isLoaded || !activeLocation) return;

    async function loadWeather() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeatherData(activeLocation!.lat, activeLocation!.lon);
        setWeather(data);
        setSurvivalIndex(calculateSurvivalIndex(data));
        setPlantingIndex(calculatePlantingIndex(data));
      } catch (err) {
        setError("Failed to fetch weather data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [activeLocation, isLoaded]);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingLocation(true);
    setLocationError(null);

    let result: { lat: number; lon: number; name: string } | null = null;

    try {
      if (addMode === "city") {
        if (!cityQuery.trim()) {
          setLocationError("Please enter a city name");
          setAddingLocation(false);
          return;
        }
        result = await geocodeLocation(cityQuery);
      } else if (addMode === "zip") {
        if (!zipQuery.trim()) {
          setLocationError("Please enter a zip code");
          setAddingLocation(false);
          return;
        }
        result = await geocodeZipCode(zipQuery);
      } else if (addMode === "coords") {
        if (!latQuery.trim() || !lonQuery.trim()) {
          setLocationError("Please enter both latitude and longitude");
          setAddingLocation(false);
          return;
        }
        const parsed = parseCoordinates(latQuery, lonQuery);
        if (parsed) {
          result = parsed;
        }
      }

      if (result) {
        const previousCount = locations.length;
        addLocation({
          name: result.name,
          lat: result.lat,
          lon: result.lon,
        });
        setCityQuery("");
        setZipQuery("");
        setLatQuery("");
        setLonQuery("");
        setShowAddLocation(false);
        
        // Show email capture after adding 2nd location (genius moment!)
        if (previousCount === 1) {
          setTimeout(() => showWeeklyCapture(), 500);
        }
      } else {
        setLocationError("Location not found. Please check your input and try again.");
      }
    } catch (err) {
      setLocationError("Error finding location. Please try again.");
    }

    setAddingLocation(false);
  };

  const closeAddModal = () => {
    setShowAddLocation(false);
    setCityQuery("");
    setZipQuery("");
    setLatQuery("");
    setLonQuery("");
    setLocationError(null);
  };

  if (!isLoaded || (loading && activeLocation)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-theme-secondary">Loading weather data...</p>
          </div>
        </div>
      </div>
    );
  }

  // No location set - prompt user to add one
  if (!activeLocation || locations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="brutalist-block p-8 text-center max-w-lg mx-auto">
          <MapPin size={48} className="text-[var(--accent)] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 uppercase">No Location Set</h2>
          <p className="text-theme-secondary mb-6 text-sm">
            Add your first location to view weather data, survival index, and planting conditions.
          </p>
          <button
            onClick={() => setShowAddLocation(true)}
            className="px-6 py-2 bg-[var(--accent)] text-white text-sm uppercase hover:brightness-110 transition-all"
          >
            Add Location
          </button>
        </div>

        {/* Add Location Modal */}
        {showAddLocation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="brutalist-block bg-theme-bg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold uppercase">Add Your First Location</h3>
                <button 
                  onClick={closeAddModal}
                  className="hover:text-[var(--accent)]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="flex gap-1 mb-4 border-b border-theme-main pb-2">
                {[
                  { mode: "city" as const, label: "City" },
                  { mode: "zip" as const, label: "Zip Code" },
                  { mode: "coords" as const, label: "Coordinates" },
                ].map((tab) => (
                  <button
                    key={tab.mode}
                    type="button"
                    onClick={() => setAddMode(tab.mode)}
                    className={`px-3 py-1 text-xs uppercase transition-all ${
                      addMode === tab.mode
                        ? "bg-[var(--accent)] text-white"
                        : "border border-theme-main hover:bg-theme-sub"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAddLocation}>
                {addMode === "city" && (
                  <div>
                    <label className="text-[10px] uppercase opacity-60 mb-1 block">City, State/Country</label>
                    <input
                      type="text"
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      placeholder="e.g., Portland, OR or London, UK"
                      className="w-full px-3 py-2 bg-theme-sub border border-theme-main mb-4 text-sm"
                    />
                  </div>
                )}

                {addMode === "zip" && (
                  <div>
                    <label className="text-[10px] uppercase opacity-60 mb-1 block">Zip / Postal Code</label>
                    <input
                      type="text"
                      value={zipQuery}
                      onChange={(e) => setZipQuery(e.target.value)}
                      placeholder="e.g., 97201 or SW1A 1AA"
                      className="w-full px-3 py-2 bg-theme-sub border border-theme-main mb-4 text-sm"
                    />
                    <p className="text-[10px] opacity-40 -mt-3 mb-4">
                      US zip codes work best. International postal codes may have limited results.
                    </p>
                  </div>
                )}

                {addMode === "coords" && (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] uppercase opacity-60 mb-1 block">Latitude</label>
                        <input
                          type="text"
                          value={latQuery}
                          onChange={(e) => setLatQuery(e.target.value)}
                          placeholder="e.g., 45.5152"
                          className="w-full px-3 py-2 bg-theme-sub border border-theme-main text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase opacity-60 mb-1 block">Longitude</label>
                        <input
                          type="text"
                          value={lonQuery}
                          onChange={(e) => setLonQuery(e.target.value)}
                          placeholder="e.g., -122.6784"
                          className="w-full px-3 py-2 bg-theme-sub border border-theme-main text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] opacity-40 -mt-3 mb-4">
                      Use decimal degrees. Lat: -90 to 90, Lon: -180 to 180
                    </p>
                  </div>
                )}

                {locationError && (
                  <div className="mb-4 p-2 border border-red-500 bg-red-500/10 text-red-500 text-xs">
                    {locationError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="flex-1 px-4 py-2 border border-theme-main text-sm hover:bg-theme-sub"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingLocation}
                    className="flex-1 px-4 py-2 bg-[var(--accent)] text-white text-sm hover:brightness-110 disabled:opacity-50"
                  >
                    {addingLocation ? "Adding..." : "Add Location"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="brutalist-block border-[var(--accent)] p-8 text-center">
          <AlertTriangle size={48} className="text-[var(--accent)] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Weather Station Offline</h2>
          <p className="text-theme-secondary mb-4">{error || "Unable to load weather data"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="border-2 border-theme-main px-4 py-2 hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4">
        <div>
          <h2 className="text-2xl font-bold uppercase">Weather_Station</h2>
          <p className="text-xs text-theme-secondary mt-1">
            Multi-source ensemble | Open-Meteo API
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          {/* Location Tabs */}
          <div className="flex gap-2 flex-wrap">
            {locations.map((loc) => (
              <div key={loc.id} className="relative group">
                <button
                  onClick={() => switchLocation(loc.id)}
                  className={`px-3 py-1 text-xs uppercase border transition-all ${
                    activeLocation.id === loc.id
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "border-theme-main hover:bg-theme-sub"
                  } ${locations.length > 1 ? "pr-7" : ""}`}
                >
                  {loc.name.split(",")[0]}
                </button>
                {locations.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLocation(loc.id);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                    title="Remove location"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setShowAddLocation(true)}
              className="px-3 py-1 text-xs uppercase border border-theme-main hover:bg-[var(--accent)] hover:text-white transition-colors flex items-center gap-1"
            >
              <Plus size={12} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="brutalist-block bg-theme-bg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold uppercase">Add Location</h3>
              <button 
                onClick={closeAddModal}
                className="hover:text-[var(--accent)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 mb-4 border-b border-theme-main pb-2">
              {[
                { mode: "city" as const, label: "City" },
                { mode: "zip" as const, label: "Zip Code" },
                { mode: "coords" as const, label: "Coordinates" },
              ].map((tab) => (
                <button
                  key={tab.mode}
                  type="button"
                  onClick={() => setAddMode(tab.mode)}
                  className={`px-3 py-1 text-xs uppercase transition-all ${
                    addMode === tab.mode
                      ? "bg-[var(--accent)] text-white"
                      : "border border-theme-main hover:bg-theme-sub"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddLocation}>
              {addMode === "city" && (
                <div>
                  <label className="text-[10px] uppercase opacity-60 mb-1 block">City, State/Country</label>
                  <input
                    type="text"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="e.g., Portland, OR or London, UK"
                    className="w-full px-3 py-2 bg-theme-sub border border-theme-main mb-4 text-sm"
                  />
                </div>
              )}

              {addMode === "zip" && (
                <div>
                  <label className="text-[10px] uppercase opacity-60 mb-1 block">Zip / Postal Code</label>
                  <input
                    type="text"
                    value={zipQuery}
                    onChange={(e) => setZipQuery(e.target.value)}
                    placeholder="e.g., 97201 or SW1A 1AA"
                    className="w-full px-3 py-2 bg-theme-sub border border-theme-main mb-4 text-sm"
                  />
                  <p className="text-[10px] opacity-40 -mt-3 mb-4">
                    US zip codes work best. International postal codes may have limited results.
                  </p>
                </div>
              )}

              {addMode === "coords" && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] uppercase opacity-60 mb-1 block">Latitude</label>
                      <input
                        type="text"
                        value={latQuery}
                    onChange={(e) => setLatQuery(e.target.value)}
                    placeholder="e.g., 45.5152"
                    className="w-full px-3 py-2 bg-theme-sub border border-theme-main text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase opacity-60 mb-1 block">Longitude</label>
                  <input
                    type="text"
                    value={lonQuery}
                    onChange={(e) => setLonQuery(e.target.value)}
                    placeholder="e.g., -122.6784"
                    className="w-full px-3 py-2 bg-theme-sub border border-theme-main text-sm"
                  />
                </div>
              </div>
              <p className="text-[10px] opacity-40 -mt-3 mb-4">
                Use decimal degrees. Lat: -90 to 90, Lon: -180 to 180
              </p>
            </div>
          )}

          {locationError && (
            <div className="mb-4 p-2 border border-red-500 bg-red-500/10 text-red-500 text-xs">
              {locationError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeAddModal}
              className="flex-1 px-4 py-2 border border-theme-main text-sm hover:bg-theme-sub"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingLocation}
              className="flex-1 px-4 py-2 bg-[var(--accent)] text-white text-sm hover:brightness-110 disabled:opacity-50"
            >
              {addingLocation ? "Adding..." : "Add Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
      )}

      {/* Current Conditions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-[var(--accent)]" />
          <span className="text-sm font-bold">{activeLocation.name}</span>
          <span className="text-xs text-theme-secondary">
            ({activeLocation.lat.toFixed(2)}, {activeLocation.lon.toFixed(2)})
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Temperature */}
          <div className="brutalist-block bg-secondary p-4">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer size={16} className="text-[var(--accent)]" />
              <div className="text-[10px] uppercase opacity-60">Temperature</div>
            </div>
            <div className="text-3xl font-bold">{Math.round(weather.current.temperature)}°F</div>
            <div className="text-xs opacity-60 mt-1">
              Feels like {Math.round(weather.current.feelsLike)}°F
            </div>
          </div>

          {/* Humidity */}
          <div className="brutalist-block bg-secondary p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets size={16} className="text-[var(--accent)]" />
              <div className="text-[10px] uppercase opacity-60">Humidity</div>
            </div>
            <div className="text-3xl font-bold">{weather.current.humidity}%</div>
            <div className="text-xs opacity-60 mt-1">
              Dew point: {Math.round(weather.current.dewPoint)}°F
            </div>
          </div>

          {/* Wind */}
          <div className="brutalist-block bg-secondary p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wind size={16} className="text-[var(--accent)]" />
              <div className="text-[10px] uppercase opacity-60">Wind</div>
            </div>
            <div className="text-3xl font-bold">{Math.round(weather.current.windSpeed)}</div>
            <div className="text-xs opacity-60 mt-1">
              mph from {getWindDirection(weather.current.windDirection)}
            </div>
          </div>

          {/* UV / Solar */}
          <div className="brutalist-block bg-secondary p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sun size={16} className="text-[var(--accent)]" />
              <div className="text-[10px] uppercase opacity-60">UV Index</div>
            </div>
            <div className="text-3xl font-bold">{weather.current.uvIndex}</div>
            <div className="text-xs opacity-60 mt-1">
              {getUVDescription(weather.current.uvIndex)}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border border-theme-main/30 p-3">
            <div className="text-[10px] uppercase opacity-60 mb-1">Pressure</div>
            <div className="text-lg font-bold">{Math.round(weather.current.pressure)}</div>
            <div className="text-[10px] opacity-40">hPa</div>
          </div>
          <div className="border border-theme-main/30 p-3">
            <div className="text-[10px] uppercase opacity-60 mb-1">Cloud Cover</div>
            <div className="text-lg font-bold">{weather.current.cloudCover}%</div>
            <div className="text-[10px] opacity-40">{weather.current.cloudCover > 50 ? "Overcast" : "Clear"}</div>
          </div>
          <div className="border border-theme-main/30 p-3">
            <div className="text-[10px] uppercase opacity-60 mb-1">Visibility</div>
            <div className="text-lg font-bold">{(weather.current.visibility / 1000).toFixed(1)}</div>
            <div className="text-[10px] opacity-40">km</div>
          </div>
        </div>
      </div>

      {/* Survival Index */}
      {survivalIndex && (
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-[var(--accent)]" />
            Survival Index
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Fire Risk */}
            <div className="brutalist-block p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={16} className="text-[var(--accent)]" />
                <span className="text-[10px] uppercase">Fire Risk</span>
              </div>
              <div className="text-xl font-bold mb-1" style={{ color: getRiskColor(survivalIndex.fireRisk.level) }}>
                {survivalIndex.fireRisk.level.toUpperCase()}
              </div>
              <div className="text-[10px] opacity-60">{survivalIndex.fireRisk.description}</div>
            </div>

            {/* Water Catchment */}
            <div className="brutalist-block p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplet size={16} className="text-[var(--accent)]" />
                <span className="text-[10px] uppercase">Water</span>
              </div>
              <div className="text-xl font-bold mb-1">
                {survivalIndex.waterCatchment.potential.toUpperCase()}
              </div>
              <div className="text-[10px] opacity-60">
                {survivalIndex.waterCatchment.nextRain 
                  ? `Rain: ${new Date(survivalIndex.waterCatchment.nextRain).toLocaleDateString()}`
                  : "No rain forecast"}
              </div>
            </div>

            {/* Spray Conditions */}
            <div className="brutalist-block p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cloud size={16} className="text-[var(--accent)]" />
                <span className="text-[10px] uppercase">Spray</span>
              </div>
              <div className="text-xl font-bold mb-1" style={{ color: survivalIndex.sprayConditions.suitable ? '#22c55e' : '#ef4444' }}>
                {survivalIndex.sprayConditions.suitable ? "OK" : "NO"}
              </div>
              <div className="text-[10px] opacity-60">{survivalIndex.sprayConditions.reason}</div>
            </div>

            {/* Solar */}
            <div className="brutalist-block p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-[var(--accent)]" />
                <span className="text-[10px] uppercase">Solar</span>
              </div>
              <div className="text-xl font-bold mb-1">{survivalIndex.solarEfficiency.percentage}%</div>
              <div className="text-[10px] opacity-60">{survivalIndex.solarEfficiency.hours} peak hrs</div>
            </div>

            {/* Livestock */}
            <div className="brutalist-block p-4">
              <div className="flex items-center gap-2 mb-2">
                <Beef size={16} className="text-[var(--accent)]" />
                <span className="text-[10px] uppercase">Livestock</span>
              </div>
              <div className="text-xl font-bold mb-1" style={{ color: getStressColor(survivalIndex.livestockStress.level) }}>
                {survivalIndex.livestockStress.level.toUpperCase()}
              </div>
              <div className="text-[10px] opacity-60">{survivalIndex.livestockStress.description}</div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="brutalist-block bg-theme-sub/30 p-4 flex items-center justify-between">
            <span className="text-sm font-bold uppercase">Overall Readiness</span>
            <div className="flex items-center gap-3">
              <div className="w-48 h-4 bg-theme-sub border border-theme-main overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent)] transition-all"
                  style={{ width: `${survivalIndex.overall}%` }}
                />
              </div>
              <span className="text-lg font-bold">{survivalIndex.overall}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* Planting Index */}
      {plantingIndex && (
        <div className="mb-8">
          <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
            <Sprout size={18} className="text-[var(--accent)]" />
            Planting Index
            <span className="text-[10px] font-normal opacity-60 ml-2">
              ({formatConfidence(plantingIndex.frostRisk.confidence)})
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frost Risk Chart */}
            <div className="brutalist-block p-6">
              <h4 className="text-sm font-bold uppercase mb-4">Frost Risk Forecast</h4>
              
              {[
                { label: "Next 7 Days", risk: plantingIndex.frostRisk.next7Days },
                { label: "Next 14 Days", risk: plantingIndex.frostRisk.next14Days },
                { label: "Next 30 Days", risk: plantingIndex.frostRisk.next30Days },
              ].map((period) => (
                <div key={period.label} className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{period.label}</span>
                    <span style={{ color: formatFrostRisk(period.risk).color }}>
                      {formatFrostRisk(period.risk).label} ({period.risk}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-theme-sub border border-theme-main overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={{ 
                        width: `${period.risk}%`,
                        backgroundColor: formatFrostRisk(period.risk).color
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-theme-main/30">
                <div className="flex justify-between text-xs">
                  <span className="opacity-60">Temperature Variance:</span>
                  <span>±{plantingIndex.frostRisk.variance}°F</span>
                </div>
              </div>
            </div>

            {/* Planting Status */}
            <div className="space-y-4">
              {/* Soil Workability */}
              <div className="brutalist-block p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold uppercase">Soil Workability</span>
                  <span className={`text-xs px-2 py-1 border ${getSoilStatusClass(plantingIndex.soilWorkability.status)}`}>
                    {plantingIndex.soilWorkability.status.toUpperCase().replace("-", " ")}
                  </span>
                </div>
                <p className="text-xs text-theme-secondary">{plantingIndex.soilWorkability.description}</p>
              </div>

              {/* Planting Window */}
              <div className="brutalist-block p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold uppercase">Planting Window</span>
                  {plantingIndex.plantingWindow.opens && (
                    <span className="text-xs px-2 py-1 border border-green-600 text-green-600">
                      {plantingIndex.plantingWindow.confidence}% CONFIDENT
                    </span>
                  )}
                </div>
                {plantingIndex.plantingWindow.opens ? (
                  <>
                    <p className="text-xs text-theme-secondary mb-1">
                      Opens: {new Date(plantingIndex.plantingWindow.opens).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-theme-secondary">
                      {plantingIndex.plantingWindow.days} consecutive safe days forecast
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-theme-secondary">No safe window detected in forecast</p>
                )}
              </div>

              {/* Growing Degree Days */}
              <div className="brutalist-block p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold uppercase">Growing Degree Days</span>
                  <span className="text-xs">{plantingIndex.growingDegreeDays.current} / {plantingIndex.growingDegreeDays.target}</span>
                </div>
                <div className="w-full h-2 bg-theme-sub border border-theme-main overflow-hidden mb-2">
                  <div 
                    className="h-full bg-green-600 transition-all"
                    style={{ width: `${plantingIndex.growingDegreeDays.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] opacity-60">Base 50°F | 14-day accumulation</p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6 brutalist-block border-[var(--accent)] bg-secondary/30 p-4">
            <h4 className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-[var(--accent)]" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {plantingIndex.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-theme-secondary flex items-start gap-2">
                  <span className="text-[var(--accent)] shrink-0">&gt;</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 7-Day Forecast */}
      <div className="brutalist-block bg-secondary p-6">
        <h3 className="text-sm font-bold uppercase mb-4">7-Day Forecast</h3>
        <div className="grid grid-cols-7 gap-2">
          {weather.forecast.slice(0, 7).map((day, i) => (
            <div key={day.date} className="text-center p-2 border border-theme-main/20">
              <div className="text-[10px] opacity-60 mb-1">
                {i === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-lg mb-1">{getWeatherEmoji(day.cloudCover, day.precipitation)}</div>
              <div className="text-xs font-bold">{Math.round(day.maxTemp)}°</div>
              <div className="text-[10px] opacity-60">{Math.round(day.minTemp)}°</div>
              {day.precipitation > 0.1 && (
                <div className="text-[9px] text-blue-400 mt-1">
                  {day.precipitation.toFixed(1)}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] opacity-40">
        <p>Last updated: {new Date(weather.lastUpdated).toLocaleString()}</p>
        <p>Data source: Open-Meteo API | No tracking | No cookies</p>
      </div>

      {/* Email Capture Modal */}
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
  );
}

// Helper functions
function getWindDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function getUVDescription(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

function getWeatherEmoji(cloudCover: number, precipitation: number): string {
  if (precipitation > 0.2) return "🌧";
  if (precipitation > 0.05) return "🌦";
  if (cloudCover > 75) return "☁";
  if (cloudCover > 40) return "⛅";
  return "☀";
}

function getRiskColor(level: string): string {
  switch (level) {
    case "low": return "#22c55e";
    case "moderate": return "#eab308";
    case "high": return "#f97316";
    case "extreme": return "#ef4444";
    default: return "#22c55e";
  }
}

function getStressColor(level: string): string {
  switch (level) {
    case "none": return "#22c55e";
    case "low": return "#eab308";
    case "moderate": return "#f97316";
    case "high": return "#ef4444";
    case "extreme": return "#dc2626";
    default: return "#22c55e";
  }
}

function getSoilStatusClass(status: string): string {
  switch (status) {
    case "workable":
      return "border-green-600 text-green-600";
    case "frozen":
    case "too-wet":
      return "border-red-600 text-red-600";
    case "too-dry":
      return "border-yellow-600 text-yellow-600";
    default:
      return "border-theme-main";
  }
}
