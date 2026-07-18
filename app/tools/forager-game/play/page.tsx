import { Suspense } from 'react';
import GameShell from '@/components/foragerGame/GameShell';

export const metadata = {
  title: 'Play',
  description: 'Can you beat the AI? Identify wild plants and mushrooms against the WALKING MAN PRO vision model.',
  robots: { index: false, follow: true },
};

export default function PlayPage() {
  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <Suspense fallback={<div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/50">Loading…</div>}>
        <GameShell />
      </Suspense>
    </div>
  );
}
