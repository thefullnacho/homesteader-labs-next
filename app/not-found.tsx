import Link from "next/link";
import { CoffeeRing, Stamp, Tape } from "@/components/field/kit";

export const metadata = {
  title: "Lost: One Page (404)",
};

const tabs = [
  { label: "Home", href: "/" },
  { label: "The tools", href: "/tools/" },
  { label: "The catalog", href: "/shop/" },
  { label: "Field notes", href: "/archive/" },
  { label: "The KB", href: "/kb/" },
];

export default function NotFoundPage() {
  return (
    <div className="bg-kraft grain border-b-2 border-ink min-h-[75vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <CoffeeRing className="absolute w-36 h-36 left-[12%] bottom-[8%] hidden md:block opacity-60" />

      <div className="relative max-w-sm w-full z-[2]">
        {/* The flyer */}
        <div className="rotate-slight-r relative">
          <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[-2deg] z-[3]" />

          <div className="bg-paper border border-ink/70 shadow-[5px_7px_0_rgba(38,34,26,0.3)] px-6 pt-8 pb-5 text-center">
            <Stamp color="text-rust" rotate="-5deg" className="text-xs">
              Not on file · 404
            </Stamp>
            <h1 className="font-display uppercase text-7xl leading-none mt-4">
              Lost
            </h1>
            <p className="font-display uppercase text-lg leading-tight mt-1">
              One page
            </p>
            <p className="mt-4 text-[0.98rem] text-ink/85 leading-snug">
              May have been moved, retitled, or eaten by a goat. Last seen
              somewhere in this archive. No reward, but no judgment either.
            </p>
            <p className="font-hand font-semibold text-marker text-xl mt-3 rotate-[-2deg]">
              if found, take a tab.
            </p>
          </div>

          {/* Tear-off tabs: the perforated strip at the bottom of the flyer */}
          <div className="flex items-start">
            {tabs.map((tab, i) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 h-24 bg-paper border border-t-2 border-ink/40 [border-top-style:dashed] [writing-mode:vertical-rl] flex items-center justify-center font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink/75 shadow-[3px_4px_0_rgba(38,34,26,0.25)] origin-top transition-transform hover:rotate-2 hover:translate-y-1 hover:text-marker ${
                  i % 2 ? "rotate-[0.8deg]" : "rotate-[-0.8deg]"
                }`}
              >
                {tab.label}
              </Link>
            ))}
            {/* One tab already torn off: somebody needed it */}
            <div aria-hidden className="flex-1">
              <div
                className="h-5 bg-paper border-t-2 border-dashed border-ink/40"
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% 45%, 72% 100%, 48% 40%, 22% 78%, 0 50%)",
                }}
              />
            </div>
          </div>
        </div>

        <p className="mt-10 text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/50">
          Posted by the archive division
        </p>
      </div>
    </div>
  );
}
