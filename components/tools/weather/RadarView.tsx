"use client";

import React, { useState } from 'react';
import { Map as MapIcon, Layers, Zap, WifiOff } from 'lucide-react';

interface RadarViewProps {
  lat: number;
  lon: number;
  zoom?: number;
}

const RadarView = ({ lat, lon, zoom = 6 }: RadarViewProps) => {
  const [iframeState, setIframeState] = useState<"loading" | "loaded" | "error">("loading");

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
    <div className="border-2 border-ink bg-paper overflow-hidden mb-8">
      <div className="flex items-center justify-between p-4 border-b-2 border-ink bg-kraft">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-marker animate-pulse" />
          <div>
            <span className="block font-mono font-bold uppercase text-xs tracking-widest text-ink/80">
              Live Atmospheric Telemetry
            </span>
            <span className="block font-mono text-[8px] text-ink/50 uppercase tracking-tighter">
              Source: RainViewer // Multimodal Doppler Stream
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slateblue/10 border border-slateblue/40">
            <div className={`w-1.5 h-1.5 rounded-full ${iframeState === "loaded" ? "bg-slateblue animate-pulse" : "bg-ink/30"}`} />
            <span className="text-[8px] font-mono text-slateblue font-bold uppercase">Precip</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-ink/5 border border-ink/30">
            <div className="w-1.5 h-1.5 bg-ink/60 rounded-full" />
            <span className="text-[8px] font-mono text-ink/60 font-bold uppercase">Snow</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-video md:aspect-[21/9] min-h-[300px] bg-manila">
        {/* Loading skeleton */}
        {iframeState === "loading" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-manila/80">
            <Layers size={24} className="text-marker/40 animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-ink/40">
              Acquiring radar stream...
            </span>
          </div>
        )}

        {/* Error state */}
        {iframeState === "error" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-manila/90">
            <WifiOff size={24} className="text-rust/70" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-rust/80">
              Radar stream unavailable
            </span>
            <span className="text-[8px] font-mono uppercase tracking-widest text-ink/30">
              RainViewer unreachable. Check the connection.
            </span>
          </div>
        )}

        <iframe
          src={radarUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          className={`absolute inset-0 transition-opacity duration-500 ${iframeState === "loaded" ? "opacity-100" : "opacity-0"}`}
          title="Weather Radar"
          onLoad={() => setIframeState("loaded")}
          onError={() => setIframeState("error")}
        />

        {/* Overlay scanning effect — only shown when loaded */}
        {iframeState === "loaded" && (
          <>
            <div className="absolute inset-0 pointer-events-none border border-marker/10 z-10" />
            <div className="absolute top-0 left-0 w-full h-px bg-marker/20 animate-scan z-10" />
          </>
        )}
      </div>

      <div className="p-3 bg-kraft flex items-center justify-between border-t-2 border-ink/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-ink/60">
            <MapIcon size={10} />
            <span className="text-[8px] font-mono uppercase tracking-widest">Grid: {lat.toFixed(2)} / {lon.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-ink/60">
            <Zap size={10} />
            <span className="text-[8px] font-mono uppercase tracking-widest">Refresh: 10m</span>
          </div>
        </div>
        <span className="font-mono text-[8px] text-ink/40 uppercase tracking-widest">
          HL RADAR NODE STABLE V4.0
        </span>
      </div>
    </div>
  );
};

export default RadarView;
