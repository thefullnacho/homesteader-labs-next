import { describe, it, expect } from 'vitest';
import { scoreSession, makeRoundResult, formatVerdict } from './scoring';
import type { GameSession, Round } from './types';

function fakeRound(id: string, trueClass: string, aiClass: string): Round {
  return {
    id,
    imageUrl: `/img/${id}.jpg`,
    trueClass,
    trueLabel: trueClass,
    options: [trueClass, 'a', 'b', 'c'],
    optionLabels: { [trueClass]: trueClass, a: 'a', b: 'b', c: 'c' },
    ai: { predictedClass: aiClass, confidence: 0.5, topProbs: {}, correct: aiClass === trueClass },
    metadata: { safety: 'SAFE', scientific: '', lookalike: '', keyDiff: '' },
    attribution: { observer: '', license: 'cc-by', observationUrl: '' },
    domain: 'berry',
  };
}

describe('makeRoundResult', () => {
  it('flags user correct only when picks match true class', () => {
    const r = makeRoundResult('1', 'tomato', 'tomato', 'tomato', 1000);
    expect(r.userCorrect).toBe(true);
    expect(r.aiCorrect).toBe(true);
  });

  it('user wrong, AI right when AI matches truth and user does not', () => {
    // (roundId, userPick, trueClass, aiPredictedClass, responseMs)
    const r = makeRoundResult('1', 'apple', 'tomato', 'tomato', 1000);
    expect(r.userCorrect).toBe(false);
    expect(r.aiCorrect).toBe(true);
  });
});

describe('scoreSession', () => {
  it('returns you-win when user has more', () => {
    const session: GameSession = {
      mode: 'berry',
      rounds: [fakeRound('1', 'a', 'a'), fakeRound('2', 'b', 'x')],
      results: [
        makeRoundResult('1', 'a', 'a', 'a', 100),
        makeRoundResult('2', 'b', 'b', 'x', 200),
      ],
      startedAt: 0,
    };
    const result = scoreSession(session);
    expect(result.userScore).toBe(2);
    expect(result.aiScore).toBe(1);
    expect(result.verdict).toBe('you-win');
  });

  it('returns ai-wins when AI scores more', () => {
    const session: GameSession = {
      mode: 'berry',
      rounds: [fakeRound('1', 'a', 'a'), fakeRound('2', 'b', 'b')],
      results: [
        makeRoundResult('1', 'wrong', 'a', 'a', 100),
        makeRoundResult('2', 'wrong', 'b', 'b', 200),
      ],
      startedAt: 0,
    };
    const result = scoreSession(session);
    expect(result.verdict).toBe('ai-wins');
    expect(result.userScore).toBe(0);
    expect(result.aiScore).toBe(2);
  });

  it('returns tie when equal', () => {
    const session: GameSession = {
      mode: 'mixed',
      rounds: [fakeRound('1', 'a', 'a'), fakeRound('2', 'b', 'x')],
      results: [
        makeRoundResult('1', 'a', 'a', 'a', 100),
        makeRoundResult('2', 'wrong', 'b', 'x', 200),
      ],
      startedAt: 0,
    };
    const result = scoreSession(session);
    expect(result.verdict).toBe('tie');
  });

  it('totalResponseMs sums all response times', () => {
    const session: GameSession = {
      mode: 'berry',
      rounds: [fakeRound('1', 'a', 'a')],
      results: [makeRoundResult('1', 'a', 'a', 'a', 1234)],
      startedAt: 0,
    };
    expect(scoreSession(session).totalResponseMs).toBe(1234);
  });
});

describe('formatVerdict', () => {
  it('formats a you-win string', () => {
    const result = scoreSession({
      mode: 'berry',
      rounds: [fakeRound('1', 'a', 'x'), fakeRound('2', 'b', 'y')],
      results: [
        makeRoundResult('1', 'a', 'a', 'x', 0),
        makeRoundResult('2', 'b', 'b', 'y', 0),
      ],
      startedAt: 0,
    });
    expect(formatVerdict(result)).toContain('You beat the AI');
    expect(formatVerdict(result)).toContain('2 to 0');
  });
});
