'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import RoundView from './RoundView';
import RevealView from './RevealView';
import Scoreboard from './Scoreboard';
import EndScreen from './EndScreen';
import { loadManifest, buildSession } from '@/lib/foragerGame/manifestLoader';
import { makeRoundResult, scoreSession } from '@/lib/foragerGame/scoring';
import type { GameSession, PlayMode, Round, RoundResult } from '@/lib/foragerGame/types';

type Phase = 'loading' | 'round' | 'reveal' | 'end' | 'error';

const VALID_MODES: PlayMode[] = ['berry', 'mushroom_mycologist', 'mushroom_highvalue', 'medicinal', 'mixed'];

export default function GameShell() {
  const router = useRouter();
  const params = useSearchParams();
  const modeParam = (params.get('mode') ?? 'mixed') as PlayMode;
  const mode = VALID_MODES.includes(modeParam) ? modeParam : 'mixed';

  const [phase, setPhase] = useState<Phase>('loading');
  const [session, setSession] = useState<GameSession | null>(null);
  const [index, setIndex] = useState(0);
  const [lastPick, setLastPick] = useState<{ option: string; responseMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    setPhase('loading');
    setIndex(0);
    setLastPick(null);
    try {
      const manifest = await loadManifest();
      const rounds = buildSession(manifest, mode, 10);
      if (rounds.length === 0) {
        setError('No rounds available for this mode.');
        setPhase('error');
        return;
      }
      setSession({ mode, rounds, results: [], startedAt: Date.now() });
      setPhase('round');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load game');
      setPhase('error');
    }
  }, [mode]);

  useEffect(() => { initSession(); }, [initSession]);

  if (phase === 'loading') {
    return (
      <BrutalistBlock>
        <p className="text-xs font-mono opacity-60 uppercase">Loading game data...</p>
      </BrutalistBlock>
    );
  }
  if (phase === 'error' || !session) {
    return (
      <BrutalistBlock>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-accent shrink-0 mt-1" />
          <div>
            <p className="text-sm font-mono font-bold uppercase mb-2">Could not load game</p>
            <p className="text-xs font-mono opacity-70 mb-3">{error}</p>
            <button onClick={() => router.push('/tools/forager-game/')} className="px-3 py-1.5 border-2 border-accent text-accent text-xs font-mono uppercase font-bold">
              Back to start
            </button>
          </div>
        </div>
      </BrutalistBlock>
    );
  }

  const currentRound: Round = session.rounds[index];
  const userScore = session.results.filter(r => r.userCorrect).length;
  const aiScore = session.results.filter(r => r.aiCorrect).length;

  if (phase === 'end') {
    const result = scoreSession(session);
    return <EndScreen result={result} onReplay={initSession} />;
  }

  if (phase === 'reveal' && lastPick) {
    return (
      <div className="space-y-4">
        <Scoreboard userScore={userScore} aiScore={aiScore} total={session.rounds.length} index={index + 1} />
        <RevealView
          round={currentRound}
          userPick={lastPick.option}
          responseMs={lastPick.responseMs}
          onNext={() => {
            if (index + 1 >= session.rounds.length) {
              setSession({ ...session, finishedAt: Date.now() });
              setPhase('end');
            } else {
              setIndex(i => i + 1);
              setPhase('round');
              setLastPick(null);
            }
          }}
          isLast={index + 1 >= session.rounds.length}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Scoreboard userScore={userScore} aiScore={aiScore} total={session.rounds.length} index={index + 1} />
      <RoundView
        round={currentRound}
        index={index}
        total={session.rounds.length}
        onPick={(option, responseMs) => {
          const newResult: RoundResult = makeRoundResult(
            currentRound.id,
            option,
            currentRound.trueClass,
            currentRound.ai.predictedClass,
            responseMs,
          );
          setSession({ ...session, results: [...session.results, newResult] });
          setLastPick({ option, responseMs });
          setPhase('reveal');
        }}
      />
    </div>
  );
}
