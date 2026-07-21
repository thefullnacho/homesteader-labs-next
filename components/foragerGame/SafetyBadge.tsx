import type { SafetyLevel } from '@/lib/foragerGame/types';

const PALETTE: Record<SafetyLevel, { bg: string; fg: string; label: string }> = {
  SAFE:    { bg: 'bg-moss/15',      fg: 'text-moss',      label: 'SAFE' },
  CAUTION: { bg: 'bg-marker/15',    fg: 'text-marker',    label: 'CAUTION' },
  DEADLY:  { bg: 'bg-rust/15',      fg: 'text-rust',      label: 'DEADLY' },
  UNKNOWN: { bg: 'bg-slateblue/15', fg: 'text-slateblue', label: 'UNKNOWN' },
};

export default function SafetyBadge({ level }: { level: SafetyLevel }) {
  const p = PALETTE[level] ?? PALETTE.UNKNOWN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 border-2 border-current text-[10px] font-mono font-bold uppercase tracking-widest ${p.bg} ${p.fg}`}>
      {p.label}
    </span>
  );
}
