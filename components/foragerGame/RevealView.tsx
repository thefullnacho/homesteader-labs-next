'use client';

import Image from 'next/image';
import { Check, X, ExternalLink } from 'lucide-react';
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
      <div className="card-paper grain p-2">
        <div className="relative w-full aspect-[16/10] bg-ink/10 border border-ink/30">
          <Image src={round.imageUrl} alt={round.trueLabel} fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover" />
        </div>
      </div>

      {/* The truth card */}
      <div className="border-2 border-ink bg-kraft grain p-5">
        <div className="flex items-start justify-between gap-3 relative z-[2]">
          <div>
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55">Correct answer</p>
            <p className="font-display uppercase text-xl mt-1">{round.trueLabel}</p>
            <p className="text-sm italic text-ink/70 mt-1">{round.metadata.scientific}</p>
          </div>
          <SafetyBadge level={round.metadata.safety} />
        </div>
      </div>

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
        <div className="card-paper grain p-5">
          <div className="relative z-[2]">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-rust mb-1">Watch for the lookalike</p>
            <p className="font-bold">{round.metadata.lookalike}</p>
            <p className="text-[0.95rem] text-ink/80 mt-2 leading-relaxed">{round.metadata.keyDiff}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/50">
        <a
          href={round.attribution.observationUrl}
          target="_blank"
          rel="noopener nofollow"
          className="inline-flex items-center gap-1 underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
        >
          {round.attribution.observer} · {round.attribution.license} <ExternalLink size={10} />
        </a>
      </div>

      <button
        onClick={onNext}
        className="w-full mt-2 inline-flex items-center justify-center bg-ink text-paper border-2 border-ink px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
      >
        {isLast ? 'See final score →' : 'Next round →'}
      </button>
    </div>
  );
}

function Verdict({ label, correct, detail, subDetail }: { label: string; correct: boolean; detail: string; subDetail: string }) {
  return (
    <div className={`border-2 p-3 bg-paper ${correct ? 'border-moss' : 'border-rust'}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55">{label}</span>
        {correct
          ? <Check size={14} className="text-moss" />
          : <X size={14} className="text-rust" />}
      </div>
      <p className="text-sm font-mono font-bold mt-1">{detail}</p>
      <p className="font-mono text-[0.64rem] text-ink/50 mt-1">{subDetail}</p>
    </div>
  );
}
