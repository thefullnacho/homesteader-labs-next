"use client";

import { getMoonPhase } from "@/lib/weatherApi";

export default function MoonPhaseDisplay() {
  const moon = getMoonPhase();

  return (
    <div className="card-paper grain p-5">
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-4 relative z-[2]">
        <h3 className="font-display uppercase text-lg">The moon</h3>
        <span className="font-mono text-[0.66rem] uppercase tracking-widest text-ink/50">
          tonight
        </span>
      </div>

      <div className="flex items-center gap-5 relative z-[2]">
        <div className="text-4xl w-16 h-16 border-2 border-ink bg-paper flex items-center justify-center shrink-0">
          {moon.emoji}
        </div>

        <div className="flex-1">
          <p className="font-mono text-[0.78rem] font-bold uppercase tracking-wider mb-2">
            {moon.label}
          </p>

          <div className="flex justify-between font-mono text-[0.62rem] uppercase tracking-wider text-ink/60 mb-1">
            <span>Lit</span>
            <span>{moon.illumination}%</span>
          </div>
          <div className="w-full h-1.5 border border-ink/40 bg-paper mb-3">
            <div className="h-full bg-slateblue" style={{ width: `${moon.illumination}%` }} />
          </div>

          <div className="flex gap-6 font-mono text-[0.64rem] uppercase tracking-wider">
            <span>
              <span className="text-ink/50 mr-1.5">Full in</span>
              <strong className="font-bold">
                {moon.daysUntilFull === 0 ? "tonight" : `${moon.daysUntilFull}d`}
              </strong>
            </span>
            <span>
              <span className="text-ink/50 mr-1.5">New in</span>
              <strong className="font-bold">
                {moon.daysUntilNew === 0 ? "tonight" : `${moon.daysUntilNew}d`}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
