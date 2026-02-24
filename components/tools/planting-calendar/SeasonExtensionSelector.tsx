"use client";

import { ThermometerSun } from "lucide-react";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";

export type SeasonExtension = 'none' | 'row-cover' | 'cold-frame' | 'greenhouse';

interface SeasonExtensionSelectorProps {
  extension: SeasonExtension;
  onChange: (ext: SeasonExtension) => void;
}

const EXTENSIONS: { id: SeasonExtension; label: string; desc: string; days: number }[] = [
  { id: 'none', label: 'NO_MODIFIERS', desc: 'Standard NOAA Frost Dates', days: 0 },
  { id: 'row-cover', label: 'ROW_COVERS', desc: 'Low Tunnels (+14 Days)', days: 14 },
  { id: 'cold-frame', label: 'COLD_FRAMES', desc: 'Glass/Poly Boxes (+28 Days)', days: 28 },
  { id: 'greenhouse', label: 'HIGH_TUNNEL', desc: 'Unheated Greenhouse (+42 Days)', days: 42 },
];

export default function SeasonExtensionSelector({ extension, onChange }: SeasonExtensionSelectorProps) {
  return (
    <BrutalistBlock className="p-6 border-dashed border-border-primary/30" variant="default" refTag="ENV_CONTROL_01">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-background-secondary border-2 border-border-primary flex items-center justify-center shrink-0">
          <ThermometerSun size={20} className="text-accent opacity-60" />
        </div>
        <div>
          <Typography variant="h4" className="mb-0 uppercase tracking-tighter">Microclimate_Mods</Typography>
          <Typography variant="small" className="opacity-40 text-[9px] uppercase font-mono mb-0">Hardware_Overrides</Typography>
        </div>
      </div>

      <div className="space-y-3">
        {EXTENSIONS.map((ext) => (
          <button
            key={ext.id}
            onClick={() => onChange(ext.id)}
            className={`w-full p-3 border-2 transition-all flex items-center justify-between text-left group ${
              extension === ext.id
                ? "border-accent bg-accent/5"
                : "border-border-primary/20 hover:border-border-primary/60 bg-black/10"
            }`}
          >
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-tight ${extension === ext.id ? 'text-accent' : 'opacity-60'}`}>
                {ext.label}
              </div>
              <div className="text-[8px] font-mono opacity-40 uppercase">{ext.desc}</div>
            </div>
            {extension === ext.id && (
              <div className="w-2 h-2 bg-accent shrink-0" />
            )}
          </button>
        ))}
      </div>
    </BrutalistBlock>
  );
}
