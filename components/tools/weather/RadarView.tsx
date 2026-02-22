"use client";

import React from 'react';
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import { Map as MapIcon, Layers, Zap } from 'lucide-react';

interface RadarViewProps {
  lat: number;
  lon: number;
  zoom?: number;
}

const RadarView = ({ lat, lon, zoom = 6 }: RadarViewProps) => {
  // RainViewer Embed URL
  // Parameters:
  // loc: lat,lon,zoom
  // m: 1 (multiradar)
  // s: 1 (snow)
  // c: 1 (controls)
  // l: 1 (legend)
  // t: 1 (type: radar)
  const radarUrl = `https://www.rainviewer.com/map.html?loc=${lat},${lon},${zoom}&control=1&menu=0&wnd=0&sc=1&tl=1&v=0&tc=0&ts=1&pa=1&os=1&lo=0&ls=1&lm=1`;

  return (
    <BrutalistBlock className="overflow-hidden p-0 mb-8" refTag="RADAR_ENVELOPE_V4">
      <div className="flex items-center justify-between p-4 border-b-2 border-border-primary bg-black/40">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-accent animate-pulse" />
          <div>
            <Typography variant="small" className="font-mono font-bold uppercase text-[10px] mb-0 tracking-widest opacity-80">
              Live Atmospheric Telemetry
            </Typography>
            <Typography variant="small" className="font-mono text-[8px] opacity-60 uppercase tracking-tighter mb-0">
              Source: RainViewer // Multimodal Doppler Stream
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-sm">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-mono text-blue-400 font-bold uppercase">Precip</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 border border-white/30 rounded-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            <span className="text-[8px] font-mono text-white/70 font-bold uppercase">Snow</span>
          </div>
        </div>
      </div>
      
      <div className="relative w-full aspect-video md:aspect-[21/9] min-h-[300px] bg-background-secondary/20">
        <iframe
          src={radarUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          className="absolute inset-0 grayscale-[0.2] contrast-[1.1]"
          title="Weather Radar"
        />
        
        {/* Overlay scanning effect */}
        <div className="absolute inset-0 pointer-events-none border border-accent/10 z-10" />
        <div className="absolute top-0 left-0 w-full h-px bg-accent/20 animate-scan z-10" />
      </div>

      <div className="p-3 bg-black/20 flex items-center justify-between border-t-2 border-border-primary/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 opacity-60">
            <MapIcon size={10} />
            <span className="text-[8px] font-mono uppercase tracking-widest">Grid: {lat.toFixed(2)} / {lon.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 opacity-60">
            <Zap size={10} />
            <span className="text-[8px] font-mono uppercase tracking-widest">Refresh: 10m</span>
          </div>
        </div>
        <Typography variant="small" className="font-mono text-[8px] opacity-40 uppercase tracking-widest mb-0">
          HL RADAR NODE STABLE V4.0
        </Typography>
      </div>
    </BrutalistBlock>
  );
};

export default RadarView;
