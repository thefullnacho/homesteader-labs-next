'use client';

interface Props {
  userScore: number;
  aiScore: number;
  total: number;
  index: number;
}

export default function Scoreboard({ userScore, aiScore, total, index }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-2 border-ink bg-kraft">
      <div className="text-center">
        <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55">You</p>
        <p className="text-2xl font-display tabular-nums">{userScore}</p>
      </div>
      <div className="flex-1 text-center">
        <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/45">Round</p>
        <p className="text-lg font-mono font-bold text-ink/60 tabular-nums">{index} / {total}</p>
      </div>
      <div className="text-center">
        <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55">AI</p>
        <p className="text-2xl font-display tabular-nums text-marker">{aiScore}</p>
      </div>
    </div>
  );
}
