import type { GameResult, GameSession, RoundResult } from './types';

export function scoreSession(session: GameSession): GameResult {
  const userScore = session.results.filter(r => r.userCorrect).length;
  const aiScore   = session.results.filter(r => r.aiCorrect).length;
  const total     = session.rounds.length;
  const totalResponseMs = session.results.reduce((acc, r) => acc + r.responseMs, 0);

  let verdict: GameResult['verdict'] = 'tie';
  if (userScore > aiScore) verdict = 'you-win';
  else if (aiScore > userScore) verdict = 'ai-wins';

  return {
    mode: session.mode,
    userScore,
    aiScore,
    total,
    verdict,
    totalResponseMs,
    results: session.results,
  };
}

export function makeRoundResult(
  roundId: string,
  userPick: string,
  trueClass: string,
  aiPredictedClass: string,
  responseMs: number,
): RoundResult {
  return {
    roundId,
    userPick,
    userCorrect: userPick === trueClass,
    aiCorrect: aiPredictedClass === trueClass,
    responseMs,
  };
}

export function formatVerdict(result: GameResult): string {
  if (result.verdict === 'you-win') return `You beat the AI · ${result.userScore} to ${result.aiScore}`;
  if (result.verdict === 'ai-wins') return `AI wins · ${result.aiScore} to ${result.userScore}`;
  return `Tied · ${result.userScore} all`;
}
