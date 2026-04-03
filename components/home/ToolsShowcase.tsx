import Link from "next/link";
import { Wrench, Cloud, Sprout, ShieldCheck, ArrowRight } from "lucide-react";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";

const tools = [
  {
    id: "weather",
    name: "WEATHER_OPS",
    description: "What's happening right now and what can I do today. Frost probability, soil workability, GDD, solar capture, catchment efficiency.",
    icon: "cloud",
    href: "/tools/weather/",
    status: "ONLINE"
  },
  {
    id: "planting-calendar",
    name: "PLANT_OPS",
    description: "What to plant, when to plant it, and how to extend your season. Zone-calibrated, succession logic, lunar sync, 54 crops.",
    icon: "sprout",
    href: "/tools/planting-calendar/",
    status: "ONLINE"
  },
  {
    id: "caloric-security",
    name: "SURVIVAL_OPS",
    description: "How long can your homestead sustain itself. Days of food, water, and energy. Caloric ROI, household profile, canning protocols.",
    icon: "shield",
    href: "/tools/caloric-security/",
    status: "ONLINE"
  },
  {
    id: "fabrication",
    name: "Fabrication_Workbench",
    description: "3D STL viewer, upload models, calculate print times, generate G-code.",
    icon: "wrench",
    href: "/tools/fabrication/",
    status: "ONLINE"
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
        <Typography variant="h3" className="mb-0">HL_SYS_OPS // Field_Station</Typography>
        <span className="text-xs text-foreground-secondary font-mono">
          STATUS: OPERATIONAL
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const ToolIcon = IconMap[tool.icon as keyof typeof IconMap];
          return (
            <Link 
              key={tool.id}
              href={tool.href}
              className="group"
            >
              <BrutalistBlock className="h-full">
                <div className="flex items-start gap-4 h-full">
                  {/* Icon */}
                  <div className="shrink-0 w-16 h-16 bg-background-secondary border-2 border-border-primary flex items-center justify-center">
                    <ToolIcon size={32} className="text-foreground-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <Typography variant="h4" className="mb-0 group-hover:text-accent transition-colors">
                        {tool.name}
                      </Typography>
                      <span className="text-xs border border-accent text-accent px-1 font-mono">
                        {tool.status}
                      </span>
                    </div>

                    <Typography variant="small" className="text-foreground-secondary mb-4 block">
                      {tool.description}
                    </Typography>

                    <div className="flex items-center gap-2 text-xs text-accent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity font-bold uppercase">
                      <span>Access Tool</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </BrutalistBlock>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
