"use client";

import React, { useState } from 'react';
import { MapPin, Plus, X, Trash2, AlertTriangle } from 'lucide-react';
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Button from "@/components/ui/Button";
import type { SavedLocation } from "@/lib/weatherTypes";
import { geocodeLocation, geocodeZipCode, parseCoordinates } from "@/lib/weatherApi";

interface LocationManagerProps {
  locations: SavedLocation[];
  activeLocation: SavedLocation;
  onSwitch: (id: string) => void;
  onAdd: (loc: Omit<SavedLocation, 'id'>) => void;
  onRemove: (id: string) => void;
}

const LocationManager = ({ locations, activeLocation, onSwitch, onAdd, onRemove }: LocationManagerProps) => {
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
        setError("NODE_NOT_FOUND");
      }
    } catch {
      setError("COMM_LINK_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-3 bg-black/40 border-2 border-border-primary p-2 px-4 mr-2">
          <MapPin size={14} className="text-accent" />
          <Typography variant="h4" className="mb-0 text-xs font-mono tracking-tighter uppercase">{activeLocation.name}</Typography>
          <span className="text-[9px] font-mono opacity-30">[{activeLocation.lat.toFixed(2)}, {activeLocation.lon.toFixed(2)}]</span>
        </div>

        {locations.map((loc) => (
          <div key={loc.id} className="relative group">
            <button
              onClick={() => onSwitch(loc.id)}
              className={`h-9 px-4 text-[9px] font-bold font-mono uppercase border-2 transition-all ${
                activeLocation.id === loc.id
                  ? "bg-accent text-white border-accent"
                  : "border-border-primary/30 hover:border-border-primary bg-background-secondary/50"
              } ${locations.length > 1 ? "pr-8" : ""}`}
            >
              {loc.name.split(",")[0]}
            </button>
            {locations.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(loc.id); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => setShowAdd(true)}
          className="h-9 px-4 border-2 border-dashed border-border-primary/40 hover:border-accent hover:text-accent transition-all text-[9px] font-bold font-mono uppercase flex items-center gap-2"
        >
          <Plus size={14} /> ADD NODE
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <BrutalistBlock className="w-full max-w-md p-0 overflow-hidden" variant="default" refTag="SYS_NODE_MGMT">
            <div className="flex justify-between items-center p-4 border-b-2 border-border-primary bg-background-primary/30">
              <Typography variant="h4" className="mb-0 uppercase text-xs font-mono tracking-widest opacity-80">Initialization Protocol</Typography>
              <button onClick={() => setShowAdd(false)} className="hover:text-accent"><X size={20} /></button>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-6 border-b-2 border-border-primary pb-4">
                {(["city", "zip", "coords"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 text-[9px] font-bold font-mono uppercase border-2 transition-all ${
                      mode === m ? "bg-accent border-accent text-white" : "border-border-primary/20 opacity-40"
                    }`}
                  >
                    {m}
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
                    placeholder={mode === "city" ? "ENTRY_CITY_NAME..." : "ENTRY_ZIP_CODE..."}
                    className="w-full px-4 py-3 bg-black/40 border-2 border-border-primary/30 focus:border-accent outline-none text-xs font-mono uppercase transition-colors"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="LATITUDE"
                      className="w-full px-4 py-3 bg-black/40 border-2 border-border-primary/30 focus:border-accent outline-none text-xs font-mono transition-colors"
                    />
                    <input
                      type="text"
                      value={lon}
                      onChange={(e) => setLon(e.target.value)}
                      placeholder="LONGITUDE"
                      className="w-full px-4 py-3 bg-black/40 border-2 border-border-primary/30 focus:border-accent outline-none text-xs font-mono transition-colors"
                    />
                  </div>
                )}

                {error && (
                  <div className="p-3 border-2 border-red-500 bg-red-500/10 text-red-500 text-[9px] font-bold font-mono uppercase flex items-center gap-2">
                    <AlertTriangle size={12} /> ERR: {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" onClick={() => setShowAdd(false)} variant="outline" size="sm" className="flex-1">Abort</Button>
                  <Button type="submit" disabled={loading} variant="primary" size="sm" className="flex-1">
                    {loading ? "CALIBRATING..." : "EXEC_INIT"}
                  </Button>
                </div>
              </form>
            </div>
          </BrutalistBlock>
        </div>
      )}
    </div>
  );
};

export default LocationManager;
