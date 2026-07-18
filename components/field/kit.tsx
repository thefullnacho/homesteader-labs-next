import type { ReactNode } from 'react';

/* Field kit: the paper-notebook primitives. Usage rules live in the
   style tile; the short version is one handwritten note per view, at
   most one tilted non-data aside on working pages, props (Tape,
   CoffeeRing, PaperClip) only on browsing surfaces. */

/* Rubber stamp label */
export function Stamp({
  children,
  color = 'text-rust',
  className = '',
  rotate,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  rotate?: string;
}) {
  return (
    <span
      className={`stamp ${color} ${className}`}
      style={rotate ? { transform: `rotate(${rotate})` } : undefined}
    >
      {children}
    </span>
  );
}

/* Masking tape strip */
export function Tape({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-7 w-24 bg-[#e8e0c8]/80 shadow-sm ${className}`}
      style={{
        clipPath: 'polygon(2% 8%, 98% 0%, 100% 88%, 96% 100%, 4% 96%, 0% 82%)',
        backdropFilter: 'blur(1px)',
        opacity: 0.85,
      }}
    />
  );
}

/* Field-guide spec box: the at-a-glance card at the top of a guide */
export function SpecBox({
  rows,
  title = 'AT A GLANCE',
  className = '',
}: {
  rows: [string, ReactNode][];
  title?: string;
  className?: string;
}) {
  return (
    <aside className={`card-paper grain ${className}`}>
      <div className="border-b-2 border-ink px-4 py-2 flex items-center justify-between">
        <span className="font-mono text-[0.68rem] font-bold tracking-[0.18em] uppercase">
          {title}
        </span>
        <span className="font-mono text-[0.68rem] text-ink/50">■ ■ ■</span>
      </div>
      <dl className="px-4 py-1">
        {rows.map(([k, v], i) => (
          <div
            key={i}
            className="flex gap-3 py-2 border-b border-dotted border-ink/40 last:border-b-0 items-baseline"
          >
            <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/60 w-24 shrink-0">
              {k}
            </dt>
            <dd className="text-[0.95rem] leading-snug">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

/* Handwritten margin note; inline below 1700px, in the margin above */
export function MarginNote({
  children,
  side = 'right',
}: {
  children: ReactNode;
  side?: 'left' | 'right';
}) {
  return (
    <span
      className={`block min-[1700px]:absolute min-[1700px]:w-44 min-[1700px]:text-[1.05rem] my-3 min-[1700px]:my-0 font-hand font-semibold leading-tight text-marker ${
        side === 'right'
          ? 'min-[1700px]:-right-48 min-[1700px]:top-0 min-[1700px]:rotate-2'
          : 'min-[1700px]:-left-48 min-[1700px]:top-0 min-[1700px]:-rotate-2'
      }`}
    >
      <span className="min-[1700px]:hidden mr-1">✎</span>
      {children}
    </span>
  );
}

/* Coffee ring, pure SVG */
export function CoffeeRing({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={`pointer-events-none ${className}`}>
      <defs>
        <filter id="ringrough">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="7" />
        </filter>
      </defs>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#6b4f2a" strokeWidth="5" opacity="0.28" filter="url(#ringrough)" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#6b4f2a" strokeWidth="1.5" opacity="0.2" filter="url(#ringrough)" strokeDasharray="30 12 60 20" />
    </svg>
  );
}

/* Wire paper clip */
export function PaperClip({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 60"
      className={`pointer-events-none ${className}`}
      fill="none"
      stroke="#8a8378"
      strokeWidth="2.4"
    >
      <path d="M8 14 v32 a6 6 0 0 0 12 0 V10 a4 4 0 0 0 -8 0 v30" />
    </svg>
  );
}

/* Section heading with index number */
export function SectionHead({
  no,
  title,
  right,
}: {
  no: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-2 mb-8">
      <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tight">
        <span className="font-mono text-sm font-semibold text-marker align-super mr-2">
          {no}
        </span>
        {title}
      </h2>
      {right && (
        <div className="font-mono text-[0.7rem] uppercase tracking-widest text-ink/60 pb-1">
          {right}
        </div>
      )}
    </div>
  );
}
