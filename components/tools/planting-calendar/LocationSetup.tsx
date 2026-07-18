"use client";

import { useState } from "react";
import { FrostDates } from "@/lib/tools/planting-calendar/types";

interface LocationSetupProps {
  onLocationSet: (frostDates: FrostDates) => void;
  loading: boolean;
  error: string | null;
  onLookup: (zipCode: string) => Promise<FrostDates | null>;
  currentZip?: string;
}

export default function LocationSetup({
  onLocationSet,
  loading,
  error,
  onLookup,
  currentZip,
}: LocationSetupProps) {
  const [zipCode, setZipCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setLocalError("Five digits, like the postman wants.");
      return;
    }

    const result = await onLookup(zipCode);
    if (result) {
      onLocationSet(result);
      setZipCode("");
    }
  };

  return (
    <div className="card-paper grain px-4 py-3 inline-block">
      <form onSubmit={handleSubmit} className="relative z-[2]">
        <label className="inline-flex items-baseline gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/60">
            {currentZip ? "Ledger for ZIP" : "Anchor to ZIP"}
          </span>
          <input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder={currentZip ?? "00000"}
            maxLength={10}
            inputMode="numeric"
            disabled={loading}
            className="w-24 bg-transparent border-b-2 border-dotted border-ink/60 font-mono font-bold text-center text-lg focus:outline-none focus:border-marker placeholder:text-ink/35 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !zipCode.trim()}
            className="ml-1 px-3 py-1 border-2 border-ink bg-ink text-paper font-mono text-[0.66rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-40"
          >
            {loading ? "Looking..." : currentZip ? "Re-anchor" : "Set"}
          </button>
        </label>
        {(localError || error) && (
          <p className="mt-2 font-mono text-[0.66rem] text-rust">{localError || error}</p>
        )}
        <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mt-1.5">
          Stored locally. Never leaves your browser.
        </p>
      </form>
    </div>
  );
}
