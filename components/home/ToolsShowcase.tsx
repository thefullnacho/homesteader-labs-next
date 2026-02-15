import Link from "next/link";
import { Wrench, Cloud, ArrowRight } from "lucide-react";

const tools = [
  {
    id: "fabrication",
    name: "Fabrication_Workbench",
    description: "3D STL viewer, upload models, calculate print times, generate G-code.",
    icon: "wrench",
    href: "/tools/fabrication/",
    status: "ONLINE"
  },
  {
    id: "weather",
    name: "Weather_Station",
    description: "Real-time weather data from the field. Temperature, humidity, pressure, forecasts.",
    icon: "cloud",
    href: "/tools/weather/",
    status: "ONLINE"
  }
];

const IconMap = {
  wrench: Wrench,
  cloud: Cloud,
};

export default function ToolsShowcase() {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 border-b-2 border-theme-main pb-2">
        <h2 className="text-xl font-bold uppercase">Field_Tools</h2>
        <span className="text-[10px] text-theme-secondary">
          STATUS: OPERATIONAL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const ToolIcon = IconMap[tool.icon as keyof typeof IconMap];
          return (
            <Link 
              key={tool.id}
              href={tool.href}
              className="brutalist-block p-6 hover:shadow-brutalist-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0 w-16 h-16 bg-theme-sub border-2 border-theme-main flex items-center justify-center">
                  <ToolIcon size={32} className="text-theme-main" />
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold uppercase group-hover:text-[var(--accent)] transition-colors">
                      {tool.name}
                    </h3>
                    <span className="text-[10px] border border-[var(--accent)] text-[var(--accent)] px-1">
                      {tool.status}
                    </span>
                  </div>

                  <p className="text-sm text-theme-secondary mb-4">
                    {tool.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Access Tool</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
