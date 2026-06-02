'use client';

import Image from 'next/image';
import { Check, X, ExternalLink } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import SafetyBadge from './SafetyBadge';
import type { Round } from '@/lib/foragerGame/types';

interface Props {
  round: Round;
  userPick: string;
  responseMs: number;
  onNext: () => void;
  isLast: boolean;
}

export default function RevealView({ round, userPick, responseMs, onNext, isLast }: Props) {
  const userCorrect = userPick === round.trueClass;
  const aiCorrect = round.ai.correct;
  const aiClass = round.ai.predictedClass;

  return (
    <div className="space-y-4">
      <BrutalistBlock>
        <div className="relative w-full aspect-[16/10] bg-black/30 border-2 border-foreground-primary/20">
          <Image src={round.imageUrl} alt={round.trueLabel} fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover" />
        </div>
      </BrutalistBlock>

      <BrutalistBlock variant="accent" refTag="TRUTH">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase opacity-60 tracking-widest">Correct answer</p>
            <p className="text-xl font-mono font-bold text-white mt-1">{round.trueLabel}</p>
            <p className="text-xs font-mono opacity-70 italic mt-1">{round.metadata.scientific}</p>
          </div>
          <SafetyBadge level={round.metadata.safety} />
        </div>
      </BrutalistBlock>

      <div className="grid grid-cols-2 gap-3">
        <Verdict
          label="You"
          correct={userCorrect}
          detail={round.optionLabels[userPick] ?? userPick}
          subDetail={`${(responseMs / 1000).toFixed(1)}s`}
        />
        <Verdict
          label="AI"
          correct={aiCorrect}
          detail={round.optionLabels[aiClass] ?? aiClass}
          subDetail={`${Math.round(round.ai.confidence * 100)}% · 187 ms on device`}
        />
      </div>

      {round.metadata.lookalike && round.metadata.lookalike !== 'N/A' && (
        <BrutalistBlock>
          <p className="text-[10px] font-mono uppercase opacity-60 tracking-widest mb-1">Watch for the lookalike</p>
          <p className="text-sm font-mono font-bold">{round.metadata.lookalike}</p>
          <p className="text-xs font-mono opacity-70 mt-2 leading-relaxed">{round.metadata.keyDiff}</p>
        </BrutalistBlock>
      )}

      <div className="flex items-center justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest">
        <a
          href={round.attribution.observationUrl}
          target="_blank"
          rel="noopener nofollow"
          className="inline-flex items-center gap-1 hover:text-accent"
        >
          {round.attribution.observer} · {round.attribution.license} <ExternalLink size={10} />
        </a>
      </div>

      <button
        onClick={onNext}
        className="w-full mt-2 inline-flex items-center justify-center font-bold uppercase bg-accent text-white border-2 border-accent px-6 py-3 text-sm shadow-brutalist active:translate-y-[2px]"
      >
        {isLast ? 'See_final_score →' : 'Next_round →'}
      </button>
    </div>
  );
}

function Verdict({ label, correct, detail, subDetail }: { label: string; correct: boolean; detail: string; subDetail: string }) {
  return (
    <div className={`border-2 p-3 ${correct ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase opacity-60 tracking-widest">{label}</span>
        {correct
          ? <Check size={14} className="text-green-400" />
          : <X size={14} className="text-red-400" />}
      </div>
      <p className="text-sm font-mono font-bold mt-1">{detail}</p>
      <p className="text-[10px] font-mono opacity-50 mt-1">{subDetail}</p>
    </div>
  );
}
