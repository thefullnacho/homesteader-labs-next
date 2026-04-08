import Link from "next/link";
import { Wrench, Cloud, Sprout, ShieldCheck } from "lucide-react";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";

const tools = [
  {
    id: "weather",
    name: "Weather Station",
    description: "Real-time conditions, frost risk, soil workability, growing degree days, and more — calibrated to your location.",
    icon: "cloud",
    href: "/tools/weather/",
    iconColor: "text-sky-400",
  },
  {
    id: "planting-calendar",
    name: "Planting Calendar",
    description: "Zone-calibrated planting dates with succession logic, season extension options, and lunar sync. 54 crops.",
    icon: "sprout",
    href: "/tools/planting-calendar/",
    iconColor: "text-green-500",
  },
  {
    id: "caloric-security",
    name: "Resilience Dashboard",
    description: "Track your household's food, water, and energy autonomy. Set up your profile and see how many days your homestead can sustain itself.",
    icon: "shield",
    href: "/tools/caloric-security/",
    iconColor: "text-amber-500",
  },
  {
    id: "fabrication",
    name: "Workshop",
    description: "3D print estimation tools. Upload an STL, pick your material, and get time and cost estimates.",
    icon: "wrench",
    href: "/tools/fabrication/",
    iconColor: "text-accent",
  },
];

const IconMap = {
  wrench: Wrench,
  cloud: Cloud,
  sprout: Sprout,
  shield: ShieldCheck,
};

export default function ToolsShowcase() {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 border-b-2 border-border-primary pb-2">
        <Typography variant="h3" className="mb-0">Tools</Typography>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => {
          const ToolIcon = IconMap[tool.icon as keyof typeof IconMap];
          return (
            <Link 
              key={tool.id}
              href={tool.href}
              className="group"
            >
              <BrutalistBlock className="h-full p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
                  <div className="shrink-0 w-10 h-10 bg-background-secondary border-2 border-border-primary flex items-center justify-center">
                    <ToolIcon size={20} className={tool.iconColor} />
                  </div>
                  <Typography variant="h4" className="mb-0 text-sm sm:text-base text-center sm:text-left group-hover:text-accent transition-colors">
                    {tool.name}
                  </Typography>
                </div>
              </BrutalistBlock>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
