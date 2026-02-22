"use client";

import { useState } from "react";
import { Loader2, Satellite } from "lucide-react";
import { FrostDates } from "@/lib/tools/planting-calendar/types";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Button from "@/components/ui/Button";

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

    if (!zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setLocalError("ERR_INVALID_ZIP");
      return;
    }

    const result = await onLookup(zipCode);
    if (result) {
      onLocationSet(result);
    }
  };

  return (
    <BrutalistBlock className="p-6" variant="default" refTag="LOC_INIT_01">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-accent border-2 border-foreground-primary flex items-center justify-center shrink-0">
          <Satellite size={20} className="text-white" />
        </div>
        <div>
          <Typography variant="h4" className="mb-0 uppercase tracking-tighter">Region_Initialization</Typography>
          <Typography variant="small" className="opacity-40 text-[9px] uppercase font-mono mb-0">Establish_Microclimate_Uplink</Typography>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className="block text-[10px] font-mono font-bold uppercase opacity-40 mb-2 tracking-widest">
            Enter_ZIP_Coordinates
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="00000"
              maxLength={5}
              className="flex-1 bg-black/20 border-2 border-border-primary/30 px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent transition-colors uppercase placeholder:opacity-20"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !zipCode.trim()}
              variant="primary"
              size="sm"
              className="px-6"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "SCAN"
              )}
            </Button>
          </div>
        </div>

        {(localError || error) && (
          <div className="p-3 border-2 border-red-500 bg-red-500/10 text-red-500 text-[10px] font-mono font-bold uppercase flex items-center gap-2">
            <span className="animate-pulse">⚠</span> {localError || error}
          </div>
        )}

        <div className="text-[9px] font-mono opacity-30 uppercase leading-relaxed border-t border-border-primary/10 pt-4">
          <p>[•] DATA_SRC: NOAA_HISTORICAL_NORMALS</p>
          <p>[•] CACHE: LOCAL_STORAGE_PERSISTENT</p>
        </div>
      </form>
    </BrutalistBlock>
  );
}
