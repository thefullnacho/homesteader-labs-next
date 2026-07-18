'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Round } from '@/lib/foragerGame/types';

interface Props {
  round: Round;
  index: number;
  total: number;
  onPick: (option: string, responseMs: number) => void;
}

export default function RoundView({ round, index, total, onPick }: Props) {
  const [start, setStart] = useState<number>(() => Date.now());
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setStart(Date.now());
    setImageLoaded(false);
  }, [round.id]);

  const handlePick = (option: string) => {
    onPick(option, Date.now() - start);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55">
        <span>Round {index + 1} / {total}</span>
        <span>{round.attribution.license}</span>
      </div>

      <div className="card-paper grain p-2">
        <div className="relative w-full aspect-square bg-ink/10 border border-ink/30">
          <Image
            src={round.imageUrl}
            alt="Identify this species"
            fill
            sizes="(min-width: 768px) 600px, 100vw"
            className={`object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            priority
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/50">
              Loading…
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {round.options.map(opt => (
          <button
            key={opt}
            onClick={() => handlePick(opt)}
            className="w-full text-left px-4 py-3 border-2 border-ink bg-paper hover:bg-kraft hover:border-marker active:translate-y-[1px] transition-all"
          >
            <span className="text-sm font-mono font-bold uppercase">{round.optionLabels[opt] ?? opt}</span>
          </button>
        ))}
      </div>

      <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/40 text-center">
        Photo by {round.attribution.observer} via iNaturalist
      </p>
    </div>
  );
}
