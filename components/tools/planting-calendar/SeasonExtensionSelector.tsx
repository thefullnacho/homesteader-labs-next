"use client";

import { useState } from "react";
import { ThermometerSun, ChevronDown } from "lucide-react";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";

export type SeasonExtension = 'none' | 'row-cover' | 'cold-frame' | 'greenhouse';

interface SeasonExtensionSelectorProps {
  extension: SeasonExtension;
  onChange: (ext: SeasonExtension) => void;
}

const EXTENSIONS: { id: SeasonExtension; label: string; desc: string; days: number }[] = [
  { id: 'none',       label: 'None',        desc: 'Standard NOAA Frost Dates',      days: 0  },
  { id: 'row-cover',  label: 'Row Covers',  desc: 'Low Tunnels (+14 Days)',          days: 14 },
  { id: 'cold-frame', label: 'Cold Frames', desc: 'Glass/Poly Boxes (+28 Days)',     days: 28 },
  { id: 'greenhouse', label: 'High Tunnel', desc: 'Unheated Greenhouse (+42 Days)',  days: 42 },
];

export default function SeasonExtensionSelector({ extension, onChange }: SeasonExtensionSelectorProps) {
  const [isOpen, setIsOpen] = useState(extension !== 'none');
  const activeExt = EXTENSIONS.find(e => e.id === extension);

  return (
    <BrutalistBlock className="p-6 border-dashed border-border-primary/30" variant="default" refTag="ENV_CONTROL_01">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center justify-between w-full mb-0"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-background-secondary border-2 border-border-primary flex items-center justify-center shrink-0">
            <ThermometerSun size={20} className="text-red-400/80" />
          </div>
          <div className="text-left">
            <Typography variant="h4" className="mb-0 uppercase tracking-tighter">Season Extenders</Typography>
            {!isOpen && extension !== 'none' && (
              <Typography variant="small" className="opacity-50 text-[10px] uppercase font-mono mb-0">
                {activeExt?.label}
              </Typography>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`opacity-40 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-3 mt-6">
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
                <div className={`text-xs font-bold uppercase tracking-tight ${extension === ext.id ? 'text-accent' : 'opacity-60'}`}>
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
      )}
    </BrutalistBlock>
  );
}
