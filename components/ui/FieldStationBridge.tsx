import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BridgeLink {
  label: string;
  sub: string;
  href: string;
  code: string;
}

const BRIDGE_MAP: Record<"WEATHER" | "PLANT" | "SURVIVAL", BridgeLink[]> = {
  WEATHER: [
    {
      label: "Frost probability matrix → see your planting window",
      sub: "Zone-calibrated calendar, succession logic, lunar sync",
      href: "/tools/planting-calendar/",
      code: "Planting",
    },
    {
      label: "Current conditions affecting your reserves",
      sub: "Cross-reference weather against your autonomy clocks",
      href: "/tools/caloric-security/",
      code: "Resilience",
    },
  ],
  PLANT: [
    {
      label: "Track harvest against your household calorie target",
      sub: "Caloric ROI by crop, autonomy clocks, canning protocols",
      href: "/tools/caloric-security/",
      code: "Resilience",
    },
    {
      label: "Check current weather affecting your schedule",
      sub: "Frost probability, GDD tracking, soil workability",
      href: "/tools/weather/",
      code: "Weather",
    },
  ],
  SURVIVAL: [
    {
      label: "Weather conditions affecting your stores",
      sub: "Frost risk, precipitation forecast, catchment efficiency",
      href: "/tools/weather/",
      code: "Weather",
    },
    {
      label: "Caloric ROI by crop — optimize your planting",
      sub: "Zone-calibrated calendar with succession and lunar sync",
      href: "/tools/planting-calendar/",
      code: "Planting",
    },
    {
      label: "Monthly resilience checklist",
      sub: "Season-aware tasks: seeds, harvests, preservation, storage rotation",
      href: "/tools/caloric-security/checklist/",
      code: "Checklist",
    },
  ],
};

export default function FieldStationBridge({
  currentOps,
}: {
  currentOps: "WEATHER" | "PLANT" | "SURVIVAL";
}) {
  const links = BRIDGE_MAP[currentOps];

  return (
    <div className="mt-16 pt-6 border-t border-border-primary/30">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">
          {'// Related Tools'}
        </span>
        <div className="flex-1 h-px bg-border-primary/20" />
        <Link
          href="/tools/"
          className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-30 hover:opacity-70 hover:text-accent transition-all"
        >
          ← All Tools
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <Link
            key={link.code}
            href={link.href}
            className="group flex items-start gap-3 p-3 border border-border-primary/30 hover:border-accent hover:bg-background-secondary transition-all"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono uppercase tracking-wide opacity-60 group-hover:opacity-100 group-hover:text-accent transition-all leading-tight">
                {link.label}
              </p>
              <p className="text-[10px] font-mono opacity-30 group-hover:opacity-50 mt-1 leading-tight">
                {link.sub}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[9px] font-mono border border-current px-1 opacity-40 group-hover:opacity-100 group-hover:text-accent group-hover:border-accent transition-all">
                {link.code}
              </span>
              <ArrowRight
                size={12}
                className="opacity-30 group-hover:opacity-100 group-hover:text-accent transition-all"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
