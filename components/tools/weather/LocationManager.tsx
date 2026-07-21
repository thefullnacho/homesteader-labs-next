"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Plus, X, Trash2 } from 'lucide-react';
import type { SavedLocation } from "@/lib/weatherTypes";
import { geocodeLocation, geocodeZipCode, parseCoordinates } from "@/lib/weatherApi";

interface LocationManagerProps {
  locations: SavedLocation[];
  activeLocation?: SavedLocation | null;
  growingZone?: string;
  onSwitch: (id: string) => void;
  onAdd: (loc: Omit<SavedLocation, 'id'>) => void;
  onRemove: (id: string) => void;
}

const MODE_LABELS = { city: "Town", zip: "ZIP", coords: "Coordinates" } as const;

const LocationManager = ({ locations, activeLocation, growingZone, onSwitch, onAdd, onRemove }: LocationManagerProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState<"city" | "zip" | "coords">("city");
  const [query, setQuery] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result: { lat: number; lon: number; name: string } | null = null;
      if (mode === "city") result = await geocodeLocation(query);
      else if (mode === "zip") result = await geocodeZipCode(query);
      else if (mode === "coords") result = parseCoordinates(lat, lon);

      if (result) {
        onAdd(result);
        setShowAdd(false);
        setQuery("");
        setLat("");
        setLon("");
      } else {
        setError("Could not find that place. Check the spelling and try again.");
      }
    } catch {
      setError("Connection failed. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-stretch">
        {activeLocation && (
          <div className="card-paper flex items-center gap-3 px-4 py-2 mr-2">
            <MapPin size={13} className="text-marker shrink-0 relative z-[2]" />
            <div className="relative z-[2]">
              <p className="font-mono text-[0.72rem] font-bold uppercase tracking-wide leading-tight">
                {activeLocation.name}
              </p>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink/50 mt-0.5">
                {growingZone && <span className="text-marker">Zone {growingZone}</span>}
                {growingZone && activeLocation.elevation ? " · " : ""}
                {activeLocation.elevation
                  ? `${Math.round(activeLocation.elevation).toLocaleString()} ft`
                  : !growingZone && (
                      <span title="Coordinates derived from your ZIP code" className="cursor-help">
                        {activeLocation.lat.toFixed(2)}, {activeLocation.lon.toFixed(2)}
                      </span>
                    )}
              </p>
            </div>
          </div>
        )}

        {locations.map((loc) => (
          <div key={loc.id} className="relative group">
            <button
              onClick={() => onSwitch(loc.id)}
              className={`h-full px-4 py-2 font-mono text-[0.66rem] font-bold uppercase tracking-wider border-2 transition-colors ${
                activeLocation?.id === loc.id
                  ? "bg-ink text-paper border-ink"
                  : "border-ink/40 hover:border-ink text-ink/70 hover:text-ink"
              } ${locations.length > 1 ? "pr-8" : ""}`}
            >
              {loc.name.split(",")[0]}
            </button>
            {locations.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(loc.id); }}
                aria-label={`Remove ${loc.name.split(",")[0]}`}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 opacity-30 group-hover:opacity-100 group-hover:text-rust transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 border-2 border-dashed border-ink/40 hover:border-marker hover:text-marker transition-colors font-mono text-[0.66rem] font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Plus size={13} /> Add a place
        </button>
      </div>
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink/50 mt-2">
        Stored locally. Never leaves your browser.
      </p>

      {/* Portaled past the header's isolated stacking context (.grain sets
          isolation: isolate), which would otherwise trap the overlay */}
      {showAdd && createPortal(
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-[100]">
          <div className="card-paper grain w-full max-w-md">
            <div className="flex justify-between items-center px-5 py-3 border-b-2 border-ink relative z-[2]">
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em]">
                Pin a place
              </span>
              <button onClick={() => setShowAdd(false)} aria-label="Close" className="hover:text-marker">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 relative z-[2]">
              <div className="flex gap-2 mb-5">
                {(["city", "zip", "coords"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 font-mono text-[0.64rem] font-bold uppercase tracking-wider border-2 transition-colors ${
                      mode === m ? "bg-ink text-paper border-ink" : "border-ink/30 text-ink/50 hover:border-ink/60"
                    }`}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                {mode !== "coords" ? (
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={mode === "city" ? "Town or city name" : "ZIP code"}
                    className="w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="Latitude"
                      className="w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40"
                    />
                    <input
                      type="text"
                      value={lon}
                      onChange={(e) => setLon(e.target.value)}
                      placeholder="Longitude"
                      className="w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40"
                    />
                  </div>
                )}

                {error && (
                  <p className="px-3 py-2 border-2 border-rust text-rust font-mono text-[0.7rem]">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-2.5 border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60"
                  >
                    {loading ? "Looking it up..." : "Pin it"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LocationManager;
