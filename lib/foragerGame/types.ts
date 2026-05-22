export type SafetyLevel = 'SAFE' | 'CAUTION' | 'DEADLY' | 'UNKNOWN';

export type DomainKey =
  | 'berry'
  | 'mushroom_mycologist'
  | 'mushroom_highvalue'
  | 'medicinal';

export type PlayMode = DomainKey | 'mixed';

export interface RoundAi {
  predictedClass: string;
  confidence: number;
  topProbs: Record<string, number>;
  correct: boolean;
}

export interface RoundMetadata {
  safety: SafetyLevel;
  scientific: string;
  lookalike: string;
  keyDiff: string;
}

export interface RoundAttribution {
  observer: string;
  license: string;
  observationUrl: string;
}

export interface Round {
  id: string;
  imageUrl: string;
  trueClass: string;
  trueLabel: string;
  options: string[];
  optionLabels: Record<string, string>;
  ai: RoundAi;
  metadata: RoundMetadata;
  attribution: RoundAttribution;
  domain: DomainKey;
}

export interface DomainSlice {
  label: string;
  rounds: Omit<Round, 'domain'>[];
}

export interface GameManifest {
  version: number;
  generatedAt: string;
  modelMeta: {
    architecture: string;
    device: string;
    deviceTimingMs: number;
    browserTimingMs: number;
  };
  domains: Record<DomainKey, DomainSlice>;
}

export interface RoundResult {
  roundId: string;
  userPick: string;
  userCorrect: boolean;
  aiCorrect: boolean;
  responseMs: number;
}

export interface GameSession {
  mode: PlayMode;
  rounds: Round[];
  results: RoundResult[];
  startedAt: number;
  finishedAt?: number;
}

export interface GameResult {
  mode: PlayMode;
  userScore: number;
  aiScore: number;
  total: number;
  verdict: 'you-win' | 'ai-wins' | 'tie';
  totalResponseMs: number;
  results: RoundResult[];
}

export interface LifetimeStats {
  gamesPlayed: number;
  userWins: number;
  aiWins: number;
  ties: number;
  totalUserCorrect: number;
  totalAiCorrect: number;
  totalRounds: number;
}
