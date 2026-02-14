"use client";

import { useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { FrostDates } from "../types";

interface LocationSetupProps {
  onLocationSet: (frostDates: FrostDates) => void;
  loading: boolean;
  error: string | null;
  onLookup: (zipCode: string) => Promise<FrostDates | null>;
}

export default function LocationSetup({ 
  onLocationSet, 
  loading, 
  error, 
  onLookup 
}: LocationSetupProps) {
  const [zipCode, setZipCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Basic validation
    if (!zipCode.trim()) {
      setLocalError("Please enter a zip code");
      return;
    }

    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setLocalError("Please enter a valid 5-digit zip code");
      return;
    }

    const result = await onLookup(zipCode);
    if (result) {
      onLocationSet(result);
    }
  };

  return (
    <div className="brutalist-block p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[var(--accent)] flex items-center justify-center">
          <MapPin size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Step 1: Your Location</h3>
          <p className="text-xs text-theme-secondary">Enter your zip code for accurate frost dates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase opacity-70 mb-2">Zip Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="12345"
              maxLength={5}
              className="flex-1 bg-theme-sub border border-theme-main px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !zipCode.trim()}
              className="px-4 py-2 bg-[var(--accent)] text-white text-sm uppercase font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Looking Up...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Lookup
                </>
              )}
            </button>
          </div>
        </div>

        {(localError || error) && (
          <div className="p-3 border border-red-600 bg-red-600/10 text-red-600 text-xs">
            {localError || error}
          </div>
        )}

        <div className="text-[10px] opacity-50">
          <p>We use NOAA frost date data for accuracy.</p>
          <p>Your data is stored locally on your device.</p>
        </div>
      </form>
    </div>
  );
}
