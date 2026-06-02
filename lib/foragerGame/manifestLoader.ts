import type { DomainKey, GameManifest, PlayMode, Round } from './types';

const MANIFEST_URL = '/forager-game/manifest.json';

let cached: GameManifest | null = null;

export async function loadManifest(): Promise<GameManifest> {
  if (cached) return cached;
  const res = await fetch(MANIFEST_URL, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
  cached = (await res.json()) as GameManifest;
  return cached;
}

function rngFromSeed(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s & 0x7fffffff) / 2147483647;
  };
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSession(
  manifest: GameManifest,
  mode: PlayMode,
  count = 10,
  seed?: number,
): Round[] {
  const rng = seed != null ? rngFromSeed(seed) : Math.random;

  const allRounds: Round[] = [];
  const domainKeys: DomainKey[] = ['berry', 'mushroom_mycologist', 'mushroom_highvalue', 'medicinal'];

  for (const dom of domainKeys) {
    const slice = manifest.domains[dom];
    if (!slice) continue;
    for (const r of slice.rounds) {
      allRounds.push({ ...r, domain: dom });
    }
  }

  let pool: Round[];
  if (mode === 'mixed') {
    pool = allRounds;
  } else {
    pool = allRounds.filter(r => r.domain === mode);
  }

  if (pool.length === 0) return [];
  const shuffled = shuffle(pool, rng);

  // If we have more candidates than count, take first N (already shuffled).
  // If we have fewer, return all (game just plays shorter).
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function listDomains(manifest: GameManifest): Array<{ key: DomainKey; label: string; count: number }> {
  return (Object.entries(manifest.domains) as [DomainKey, GameManifest['domains'][DomainKey]][])
    .map(([key, slice]) => ({ key, label: slice.label, count: slice.rounds.length }));
}
