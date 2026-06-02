'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
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
      <div className="flex items-center justify-between text-[10px] font-mono opacity-60 uppercase tracking-widest">
        <span>Round {index + 1} / {total}</span>
        <span>{round.attribution.license}</span>
      </div>

      <BrutalistBlock>
        <div className="relative w-full aspect-square bg-black/30 border-2 border-foreground-primary/20">
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
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono opacity-50 uppercase">
              Loading...
            </div>
          )}
        </div>
      </BrutalistBlock>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {round.options.map(opt => (
          <button
            key={opt}
            onClick={() => handlePick(opt)}
            className="w-full text-left px-4 py-3 border-2 border-foreground-primary/30 hover:border-accent hover:bg-accent/10 hover:text-accent active:translate-y-[1px] transition-all"
          >
            <span className="text-sm font-mono font-bold uppercase">{round.optionLabels[opt] ?? opt}</span>
          </button>
        ))}
      </div>

      <p className="text-[10px] font-mono opacity-30 uppercase text-center tracking-widest">
        Photo by {round.attribution.observer} via iNaturalist
      </p>
    </div>
  );
}
