import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isoWeek, readClicks, recordClick, summarize } from './clicks';

describe('isoWeek', () => {
  it('labels ISO weeks, including across the year boundary', () => {
    expect(isoWeek('2026-10-21')).toBe('2026-W43');
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
    expect(isoWeek('2026-01-01')).toBe('2026-W01');
  });
});

describe('store calls', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.test');
    vi.stubEnv('KV_REST_API_TOKEN', 'tok');
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('records one day-bucketed increment and nothing else', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ result: 1 }])));
    await recordClick('dripworks', 'reddit', new Date('2026-10-21T12:00:00Z'));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://kv.test/pipeline');
    expect(JSON.parse(init.body)).toEqual([['HINCRBY', 'go:2026-10-21', 'dripworks:reddit', 1]]);
  });

  it('reads and summarizes a window', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { result: ['dripworks:reddit', '3', 'seeed:site', '1'] },
          { result: [] },
          { result: ['dripworks:reddit', '2'] },
        ]),
      ),
    );
    const rows = await readClicks(3, new Date('2026-10-21T12:00:00Z'));
    expect(rows).toHaveLength(3);
    expect(rows![2]).toEqual({ day: '2026-10-19', program: 'dripworks', channel: 'reddit', clicks: 2 });
    const s = summarize(rows!);
    expect(s.total).toBe(6);
    expect(s.byProgram).toEqual({ dripworks: 5, seeed: 1 });
    expect(s.byWeek['2026-W43']['dripworks:reddit']).toBe(5);
  });

  it('is a no-op without a configured store', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('KV_REST_API_URL', '');
    expect(await readClicks(1)).toBeNull();
    await recordClick('dripworks', 'site');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
