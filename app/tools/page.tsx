"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useFieldStation } from "@/app/context/FieldStationContext";
import { isSurvivalPlanPublic } from "@/lib/survivalPlan/visibility";
import { SectionHead, Stamp } from "@/components/field/kit";

const ops = [
  {
    no: "01",
    code: "Weather",
    mission: "What's happening right now and what can I do today.",
    href: "/tools/weather/",
    need: "ZIP code",
    capabilities: [
      "Real-time conditions",
      "Frost probability matrix",
      "Soil workability index",
      "GDD tracking",
      "Solar & catchment indexes",
    ],
  },
  {
    no: "02",
    code: "Planting",
    mission: "What to plant, when to plant it, and how to extend your season.",
    href: "/tools/planting-calendar/",
    need: "ZIP code",
    capabilities: [
      "Zone-calibrated calendar",
      "Succession planting logic",
      "54 crops, variety timelines",
      "Microclimate mods",
      "Row cover to greenhouse",
    ],
  },
  {
    no: "03",
    code: "Knowledge Base",
    mission: "Look up how to grow it: 350+ crops, botanical names, sun and spacing.",
    href: "/kb/",
    need: "Curiosity",
    capabilities: [
      "353 crops on file",
      "Sun & spacing data",
      "Sowing methods",
      "Companion crops",
      "Open public-domain dataset",
    ],
  },
  {
    no: "04",
    code: "Resilience",
    mission: "How long can your homestead sustain itself.",
    href: "/tools/caloric-security/",
    need: "Pantry list",
    capabilities: [
      "Days of food, water, energy",
      "Caloric ROI by crop",
      "Companion planting advisor",
      "Canning day protocols",
      "Household profile",
    ],
  },
  {
    no: "05",
    code: "Forager Game",
    mission: "Can you out-identify the AI? Play the field-ID game.",
    href: "/tools/forager-game/",
    need: "Sharp eyes",
    capabilities: [
      "109 rounds",
      "4 expert domains",
      "Deadly lookalikes",
      "Score vs. the machine",
      "Built on WALKING MAN PRO",
    ],
  },
];

export default function FieldStationPage() {
  const { activeLocation } = useFieldStation();

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <span>Homesteader Labs</span>
            <span>/</span>
            <span>The Workbench</span>
            <span className="ml-auto">All data stays in your browser</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Free</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">No account</Stamp>
            <Stamp color="text-rust" rotate="-2.2deg">No tracking</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            The workbench
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Five instruments for running a homestead. Every one works offline,
            stores its data locally, and answers a question in plain words.
          </p>

          {/* Location calibration */}
          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 card-paper font-mono text-xs relative">
            <MapPin
              size={12}
              className={activeLocation ? "text-marker shrink-0" : "text-ink/30 shrink-0"}
            />
            {activeLocation ? (
              <span className="relative z-[2]">
                Calibrated to {activeLocation.name} ·{" "}
                <span
                  className="text-ink/50 cursor-help"
                  title="Coordinates derived from your ZIP code"
                >
                  {activeLocation.lat.toFixed(2)}° N, {Math.abs(activeLocation.lon).toFixed(2)}° W
                </span>
              </span>
            ) : (
              <span className="text-ink/60 relative z-[2]">
                Enter a ZIP code in any tool to calibrate the station
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        {/* Instruments */}
        <SectionHead no="§1" title="The Instruments" right="5 tools · 0 logins · $0" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {ops.map((op) => (
            <Link
              key={op.no}
              href={op.href}
              className="card-paper grain p-5 flex flex-col group hover:-translate-y-1 transition-transform"
            >
              <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 relative z-[2]">
                <span className="font-mono text-[0.7rem] font-bold text-marker">No. {op.no}</span>
                <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
                  You need: {op.need}
                </span>
              </div>
              <h2 className="font-display uppercase text-lg mt-3 leading-tight group-hover:text-marker transition-colors relative z-[2]">
                {op.code}
              </h2>
              <p className="text-[0.95rem] text-ink/80 mt-1 mb-4 relative z-[2]">{op.mission}</p>
              <ul className="bg-paper/70 border border-ink/30 p-3 mb-4 space-y-1.5 font-mono text-[0.7rem] uppercase tracking-wide relative z-[2] flex-1">
                {op.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="border-b border-dotted border-ink/40 pb-1 last:border-b-0 last:pb-0"
                  >
                    {cap}
                  </li>
                ))}
              </ul>
              <span className="mt-auto font-mono text-[0.72rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 relative z-[2]">
                Open →
              </span>
            </Link>
          ))}

          {/* Coming soon: field ops */}
          <div className="border-2 border-dashed border-ink/40 p-5 flex flex-col justify-center items-start text-ink/50">
            <span className="font-mono text-[0.64rem] uppercase tracking-widest mb-2">
              Coming soon
            </span>
            <h2 className="font-display uppercase text-lg leading-tight mb-2">Field Ops</h2>
            <p className="text-[0.92rem] leading-snug">
              The tool you take when you leave the homestead. Weather reads
              conditions, planting plans the season, resilience counts reserves.
              Field Ops identifies what nature already provides.
            </p>
          </div>
        </div>

        {/* Survival Garden Plan: paid, personalized PDF */}
        {isSurvivalPlanPublic() && (
          <div className="border-2 border-ink bg-kraft grain p-6 md:p-8 relative mb-10">
            <div className="relative z-[2] flex items-center justify-between flex-wrap gap-6">
              <div className="max-w-lg">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2">
                  Personalized plan · $19
                </p>
                <h2 className="font-display uppercase text-xl leading-tight mb-2">
                  Survival Garden Plan
                </h2>
                <p className="text-[0.98rem] text-ink/85 leading-snug">
                  Answer a few questions about your ZIP, household, and space.
                  Get a zone-calibrated, printable PDF: what to grow, when to
                  plant, and a vetted seed-vendor list. Yours forever.
                </p>
              </div>
              <Link
                href="/survival-garden-plan/"
                className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors shrink-0"
              >
                Build mine →
              </Link>
            </div>
          </div>
        )}

        {/* Station footer */}
        <p className="text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          All data stored locally · No account · No tracking · Infrastructure-independent
        </p>
      </div>
    </>
  );
}
