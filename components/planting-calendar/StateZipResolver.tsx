'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';

type Result =
  | { kind: 'zone'; zip: string; zone: string; hasPage: boolean }
  | { kind: 'unknown'; zip: string }
  | { kind: 'error'; message: string };

/**
 * The state page's actual job: take a reader who knows their state and hand
 * them to the zone that decides their dates.
 *
 * Client-side and talking to /api/zone/[zip], because the PRISM table is
 * ~529KB and belongs nowhere near a browser bundle. The route is
 * force-static and immutable-cached, so this is a CDN read.
 *
 * Two results are not failures and must not read as errors. A ZIP outside
 * PRISM's coverage (PO-box-only ranges, some new ZIPs) returns no zone, and a
 * ZIP in a zone with no page of its own resolves fine but cannot be linked.
 * Both send the reader to the interactive tool rather than a 404, per spec
 * §5.3. `pageZones` is passed in from the server so this component never
 * imports the zone list and never drifts from it.
 */
export default function StateZipResolver({
  stateName,
  pageZones,
}: {
  stateName: string;
  pageZones: readonly string[];
}) {
  const [zip, setZip] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function resolve(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = zip.trim().slice(0, 5);
    if (!/^\d{5}$/.test(cleaned)) {
      setResult({ kind: 'error', message: 'That needs to be five digits.' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/zone/${cleaned}/`);
      const body = await res.json().catch(() => ({}));
      if (body?.zone) {
        setResult({
          kind: 'zone',
          zip: cleaned,
          zone: body.zone,
          hasPage: pageZones.includes(body.zone),
        });
      } else {
        setResult({ kind: 'unknown', zip: cleaned });
      }
    } catch {
      setResult({ kind: 'error', message: 'Could not reach the zone table. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-paper grain no-print">
      <div className="relative z-[2] p-5 sm:p-6">
        <form onSubmit={resolve} className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/55">
              {stateName} ZIP code
            </span>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000"
              aria-label={`ZIP code in ${stateName}`}
              className="mt-1 block w-40 bg-paper border-2 border-ink px-3 py-2 font-mono text-base tracking-widest focus:outline-none focus:border-marker"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="border-2 border-ink bg-ink text-paper font-mono text-[0.7rem] uppercase tracking-[0.18em] px-4 py-2.5 hover:bg-marker hover:border-marker disabled:opacity-50"
          >
            {busy ? 'Looking…' : 'Find my zone'}
          </button>
        </form>

        {result?.kind === 'zone' && result.hasPage && (
          <p className="font-serif text-ink/85 mt-4">
            {result.zip} is zone <strong>{result.zone}</strong>.{' '}
            <Link
              href={`/tools/planting-calendar/zone/${result.zone}/`}
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker inline-flex items-center gap-1"
            >
              Its full sowing schedule <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        )}

        {result?.kind === 'zone' && !result.hasPage && (
          <p className="font-serif text-ink/85 mt-4">
            {result.zip} is zone <strong>{result.zone}</strong>, which has no calendar page here
            yet. It sits outside the fourteen zones that hold 98% of US ZIP codes, and above 10b
            there are no frost normals to build a calendar from at all.{' '}
            <Link
              href="/tools/planting-calendar/"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              The interactive calendar
            </Link>{' '}
            will still work from your dates.
          </p>
        )}

        {result?.kind === 'unknown' && (
          <p className="font-serif text-ink/85 mt-4">
            {result.zip} is not in the PRISM table. That is normal for PO-box-only and newly issued
            ZIP codes rather than a mistake on your part. Try a neighbouring ZIP, or use{' '}
            <Link
              href="/tools/planting-calendar/"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              the interactive calendar
            </Link>
            .
          </p>
        )}

        {result?.kind === 'error' && (
          <p className="font-mono text-[0.72rem] text-rust mt-4 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
