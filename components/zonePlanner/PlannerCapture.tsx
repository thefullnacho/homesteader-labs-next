'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, Download } from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Email capture for the free zone planner.
 *
 * The sheet repeats data the page above already gives away, which is the point:
 * the trade is a printable copy for an address, not access for an address. The
 * copy here says only what the route actually does. It downloads the PDF in the
 * browser and adds the address to the list; it does not email the file.
 */
export default function PlannerCapture({ zone, cropCount }: { zone: string; cropCount: number }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/zone-planner/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone, email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not build the planner');
      }
      setDownloadUrl(URL.createObjectURL(await res.blob()));
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }

  return (
    <div className="mt-8 border-2 border-ink bg-kraft grain no-print">
      <div className="relative z-[2] p-6 md:p-8">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-marker mb-2">
          Take it outside
        </p>
        <h3 className="font-display uppercase text-xl md:text-2xl leading-tight">
          Zone {zone} fall planner
        </h3>
        <p className="font-serif text-ink/75 mt-3 max-w-xl">
          The {cropCount} deadlines above as a printable four-page sheet, plus the pests worth
          watching for what you are sowing, a blank grid for your own beds, and a checklist for
          before you sow. Everything on it is on this page already. The sheet is for the pocket of
          a coat.
        </p>

        {status === 'success' && downloadUrl ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-moss">
              <CheckCircle size={16} />
              <span className="font-mono text-[0.72rem] uppercase tracking-wider font-bold">
                Planner ready
              </span>
            </div>
            <a
              href={downloadUrl}
              download={`fall-planner-zone-${zone}.pdf`}
              className="inline-flex items-center gap-2 bg-ink text-paper border-2 border-ink px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
            >
              <Download size={15} />
              Download zone {zone} planner
            </a>
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink/50">
              Saved to your list as zone {zone}. You will get a storage and preservation note when
              the harvest lands, in about six weeks.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 max-w-md">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="flex-1 bg-paper border-2 border-ink px-3 py-2.5 font-mono text-sm focus:border-marker focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'submitting' || !email.includes('@')}
                className="bg-ink text-paper border-2 border-ink px-5 py-2.5 font-mono text-[0.76rem] uppercase tracking-wider hover:bg-marker hover:border-marker disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {status === 'submitting' ? 'Building…' : 'Send the planner'}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 border-2 border-rust/50 bg-rust/10 text-rust font-mono text-[0.72rem]">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink/45">
              We tag your zone, never your address or ZIP. Seasonal notes only. No trackers, no
              data sale, unsubscribe in one click.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
