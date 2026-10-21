import { dayKey } from '@/lib/affiliates';

/**
 * Click counts for /go/ links, in Upstash Redis over its REST API (no client
 * package). One hash per UTC day, `go:YYYY-MM-DD`, field `program:channel`,
 * value a count. Nothing else is stored: no IP, user agent, referrer or time
 * finer than the day.
 *
 * The Vercel Marketplace integration sets KV_REST_API_*; a store made directly
 * on Upstash gives UPSTASH_REDIS_REST_*. Either works. Without them counting is
 * skipped and the redirect still happens.
 */

function store(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

async function pipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  const s = store();
  if (!s) return null;
  const res = await fetch(`${s.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(`upstash: ${r.error}`);
    return r.result;
  });
}

export async function recordClick(program: string, channel: string, now = new Date()): Promise<void> {
  await pipeline([['HINCRBY', `go:${dayKey(now)}`, `${program}:${channel}`, 1]]);
}

export interface ClickRow {
  day: string;
  program: string;
  channel: string;
  clicks: number;
}

/** Every nonzero count for the last `days` UTC days, today included. */
export async function readClicks(days: number, now = new Date()): Promise<ClickRow[] | null> {
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    keys.push(dayKey(new Date(now.getTime() - i * 86_400_000)));
  }
  const results = await pipeline(keys.map((d) => ['HGETALL', `go:${d}`]));
  if (!results) return null;

  const rows: ClickRow[] = [];
  results.forEach((flat, i) => {
    // HGETALL over REST is a flat [field, value, field, value, ...] array.
    const list = (flat as string[] | null) ?? [];
    for (let j = 0; j + 1 < list.length; j += 2) {
      const [program, channel] = list[j].split(':');
      rows.push({ day: keys[i], program, channel, clicks: Number(list[j + 1]) });
    }
  });
  return rows;
}

/** ISO 8601 week label, e.g. 2026-W43. */
export function isoWeek(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

type Tally = Record<string, number>;

export function summarize(rows: ClickRow[]) {
  const byProgram: Tally = {};
  const byChannel: Tally = {};
  const byWeek: Record<string, Tally> = {};
  let total = 0;
  for (const r of rows) {
    total += r.clicks;
    byProgram[r.program] = (byProgram[r.program] ?? 0) + r.clicks;
    byChannel[r.channel] = (byChannel[r.channel] ?? 0) + r.clicks;
    const w = (byWeek[isoWeek(r.day)] ??= {});
    const k = `${r.program}:${r.channel}`;
    w[k] = (w[k] ?? 0) + r.clicks;
  }
  return { total, byProgram, byChannel, byWeek };
}
