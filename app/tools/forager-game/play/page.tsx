import { Suspense } from 'react';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import GameShell from '@/components/foragerGame/GameShell';

export const metadata = {
  title: 'Play',
  description: 'Can you beat the AI? Identify wild plants and mushrooms against the WALKING MAN PRO vision model.',
  robots: { index: false, follow: true },
};

export default function PlayPage() {
  return (
    <FieldStationLayout stationId="FORAGER_GAME_PLAY" gridLines={false}>
      <div className="max-w-xl mx-auto py-6 px-4">
        <Suspense fallback={<div className="text-xs font-mono opacity-50 uppercase">Loading...</div>}>
          <GameShell />
        </Suspense>
      </div>
    </FieldStationLayout>
  );
}
