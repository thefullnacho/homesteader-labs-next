'use client';

interface Props {
  userScore: number;
  aiScore: number;
  total: number;
  index: number;
}

export default function Scoreboard({ userScore, aiScore, total, index }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-2 border-foreground-primary/20 bg-black/30">
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase opacity-60 tracking-widest">You</p>
        <p className="text-2xl font-mono font-bold text-foreground-primary tabular-nums">{userScore}</p>
      </div>
      <div className="flex-1 text-center">
        <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Round</p>
        <p className="text-lg font-mono font-bold opacity-60 tabular-nums">{index} / {total}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase opacity-60 tracking-widest">AI</p>
        <p className="text-2xl font-mono font-bold text-accent tabular-nums">{aiScore}</p>
      </div>
    </div>
  );
}
