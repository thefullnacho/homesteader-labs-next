import type { SafetyLevel } from '@/lib/foragerGame/types';

const PALETTE: Record<SafetyLevel, { bg: string; fg: string; label: string }> = {
  SAFE:    { bg: 'bg-green-500/15',  fg: 'text-green-300', label: 'SAFE' },
  CAUTION: { bg: 'bg-yellow-500/15', fg: 'text-yellow-200', label: 'CAUTION' },
  DEADLY:  { bg: 'bg-red-500/20',    fg: 'text-red-300',    label: 'DEADLY' },
  UNKNOWN: { bg: 'bg-zinc-500/15',   fg: 'text-zinc-300',   label: 'UNKNOWN' },
};

export default function SafetyBadge({ level }: { level: SafetyLevel }) {
  const p = PALETTE[level] ?? PALETTE.UNKNOWN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 border-2 border-current text-[10px] font-mono font-bold uppercase tracking-widest ${p.bg} ${p.fg}`}>
      {p.label}
    </span>
  );
}
