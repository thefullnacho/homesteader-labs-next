"use client";

export type SeasonExtension = 'none' | 'row-cover' | 'cold-frame' | 'greenhouse';

interface SeasonExtensionSelectorProps {
  extension: SeasonExtension;
  onChange: (ext: SeasonExtension) => void;
}

const EXTENSIONS: { id: SeasonExtension; label: string; desc: string }[] = [
  { id: 'none',       label: 'Bare ground',  desc: 'straight NOAA dates' },
  { id: 'row-cover',  label: 'Row covers',   desc: 'low tunnels, +14 days' },
  { id: 'cold-frame', label: 'Cold frames',  desc: 'glass or poly boxes, +28 days' },
  { id: 'greenhouse', label: 'High tunnel',  desc: 'unheated greenhouse, +42 days' },
];

export default function SeasonExtensionSelector({ extension, onChange }: SeasonExtensionSelectorProps) {
  return (
    <div className="card-paper grain p-5">
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] mb-1 relative z-[2]">
        Season extenders
      </p>
      <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/50 mb-3 relative z-[2]">
        Cover stretches both ends of the season
      </p>
      <div className="space-y-2 relative z-[2]">
        {EXTENSIONS.map((ext) => (
          <button
            key={ext.id}
            onClick={() => onChange(ext.id)}
            aria-pressed={extension === ext.id}
            className={`w-full px-3 py-2 border-2 transition-colors flex items-baseline justify-between gap-3 text-left ${
              extension === ext.id
                ? "border-ink bg-ink text-paper"
                : "border-ink/30 hover:border-ink bg-paper"
            }`}
          >
            <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wide">
              {ext.label}
            </span>
            <span
              className={`font-mono text-[0.62rem] uppercase tracking-wider ${
                extension === ext.id ? "text-paper/70" : "text-ink/50"
              }`}
            >
              {ext.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
