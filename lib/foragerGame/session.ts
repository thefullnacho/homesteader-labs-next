import type { GameResult, LifetimeStats } from './types';

const STORAGE_KEY = 'forager-game-stats';

const EMPTY: LifetimeStats = {
  gamesPlayed: 0,
  userWins: 0,
  aiWins: 0,
  ties: 0,
  totalUserCorrect: 0,
  totalAiCorrect: 0,
  totalRounds: 0,
};

export function readStats(): LifetimeStats {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

export function recordResult(result: GameResult): LifetimeStats {
  const next: LifetimeStats = readStats();
  next.gamesPlayed += 1;
  next.totalUserCorrect += result.userScore;
  next.totalAiCorrect += result.aiScore;
  next.totalRounds += result.total;
  if (result.verdict === 'you-win') next.userWins += 1;
  else if (result.verdict === 'ai-wins') next.aiWins += 1;
  else next.ties += 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export function resetStats(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
