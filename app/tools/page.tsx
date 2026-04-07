"use client";

import Link from "next/link";
import { Cloud, Sprout, Shield, Compass, ArrowRight, MapPin } from "lucide-react";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import { useFieldStation } from "@/app/context/FieldStationContext";

const ops = [
  {
    id: "weather",
    code: "Weather",
    mission: "What's happening right now and what can I do today.",
    href: "/tools/weather/",
    icon: Cloud,
    status: "ONLINE" as const,
    capabilities: [
      "Real-time conditions",
      "Frost probability matrix",
      "Soil workability index",
      "Application suitability",
      "Livestock metabolic load",
      "GDD tracking",
      "Solar capture index",
      "Catchment efficiency",
    ],
  },
  {
    id: "plant",
    code: "Planting",
    mission: "What to plant, when to plant it, and how to extend your season.",
    href: "/tools/planting-calendar/",
    icon: Sprout,
    status: "ONLINE" as const,
    capabilities: [
      "Zone-calibrated calendar",
      "Succession planting logic",
      "Microclimate mods",
      "Lunar sync",
      "Variety-specific timelines",
      "54 crops",
      "Row cover → greenhouse extension",
      "Deployment recommendations",
    ],
  },
  {
    id: "survival",
    code: "Resilience",
    mission: "How long can your homestead sustain itself.",
    href: "/tools/caloric-security/",
    icon: Shield,
    status: "ONLINE" as const,
    capabilities: [
      "Days of food",
      "Days of water",
      "Days of energy",
      "Caloric ROI by crop",
      "Companion planting advisor",
      "Canning day protocols",
      "Household profile",
      "Solar & catchment integration",
    ],
  },
];

export default function FieldStationPage() {
  const { activeLocation } = useFieldStation();

  return (
    <FieldStationLayout stationId="HL_SYS_FIELD_STATION_V1">
      {/* System Header */}
      <div className="mb-10">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 mb-2">
              Homesteader Labs
            </div>
            <Typography variant="h1" className="mb-2">
              Field Station
            </Typography>
            <Typography variant="body" className="text-foreground-secondary max-w-xl mb-0">
              Homestead operations platform. Free. No account. All data stored locally.
            </Typography>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0" />
        </div>

        {/* Location Calibration Status */}
        <div className="flex items-center gap-3 p-3 border border-border-primary/40 bg-background-secondary/30 font-mono text-xs">
          <MapPin
            size={12}
            className={activeLocation ? "text-accent shrink-0" : "opacity-30 shrink-0"}
          />
          {activeLocation ? (
            <>
              <span className="opacity-70 truncate">{activeLocation.name}</span>
              <span
                className="hidden sm:inline opacity-40 ml-auto shrink-0 cursor-help"
                title="Coordinates derived from your ZIP code"
              >
                {activeLocation.lat.toFixed(4)}° N &nbsp;
                {Math.abs(activeLocation.lon).toFixed(4)}° W
              </span>
            </>
          ) : (
            <span className="opacity-40">
              Enter a ZIP code to get started
            </span>
          )}
        </div>
      </div>

      {/* Triptych — three OPS panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {ops.map((op) => {
          const Icon = op.icon;
          return (
            <BrutalistBlock key={op.id} className="flex flex-col h-full" refTag={op.code}>
              {/* Panel header */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <Icon size={20} className="text-accent" />
                </div>
              </div>

              {/* Mode identifier */}
              <h2 className="text-xl font-bold font-mono tracking-tight mb-1">{op.code}</h2>
              <p className="text-xs text-foreground-secondary font-mono mb-5 leading-relaxed">
                {op.mission}
              </p>

              {/* Capability list */}
              <ul className="flex-1 space-y-1.5 mb-6">
                {op.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide opacity-75"
                  >
                    <span className="w-1 h-1 bg-accent shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>

              {/* Entry CTA */}
              <Link
                href={op.href}
                className="flex items-center justify-between w-full px-4 py-3 bg-accent text-white text-sm font-bold font-mono uppercase tracking-wider hover:bg-accent/90 transition-colors shadow-brutalist-sm hover:shadow-brutalist"
              >
                <span>Open</span>
                <ArrowRight size={16} />
              </Link>
            </BrutalistBlock>
          );
        })}
      </div>

      {/* FIELD_OPS — future fourth mode teaser */}
      <div className="mb-10">
        <div className="opacity-40 pointer-events-none select-none">
          <BrutalistBlock refTag="FIELD_OPS">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-current/30 flex items-center justify-center">
                  <Compass size={20} className="opacity-50" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50 mb-1">
                    Coming Soon
                  </div>
                  <h2 className="text-lg font-bold font-mono">Workshop</h2>
                  <p className="text-xs font-mono opacity-60 mt-1 max-w-lg">
                    The tool you take when you leave the homestead. Identifies what nature already provides.
                    Weather tells you conditions, planting tells you what to grow, survival tracks your
                    reserves — FIELD_OPS identifies what nature already provides.
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono border border-current/30 px-2 py-1 opacity-40 shrink-0">
                OFFLINE
              </span>
            </div>
          </BrutalistBlock>
        </div>
      </div>

      {/* System footer tagline */}
      <div className="text-center py-4 border-t border-border-primary/10">
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-25">
          All data stored locally &nbsp;·&nbsp; No account &nbsp;·&nbsp; No tracking &nbsp;·&nbsp; Infrastructure-independent
        </p>
      </div>
    </FieldStationLayout>
  );
}
