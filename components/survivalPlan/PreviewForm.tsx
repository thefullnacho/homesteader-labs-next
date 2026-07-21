'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function PreviewForm() {
  const [zip, setZip] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/survival-garden-plan/preview/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zip, email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to generate preview');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStatus('error');
    }
  }

  if (status === 'success' && downloadUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-moss">
          <CheckCircle size={16} />
          <span className="font-mono text-[0.72rem] uppercase tracking-wider font-bold">Preview ready</span>
        </div>
        <a
          href={downloadUrl}
          download={`survival-garden-preview-${zip}.pdf`}
          className="inline-flex items-center justify-center bg-ink text-paper border-2 border-ink px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
        >
          Download preview PDF
        </a>
        <p className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/50">
          A copy was sent to {email}. Want the full plan?{' '}
          <a href="/survival-garden-plan/wizard/" className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker">
            Build it →
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          required
          value={zip}
          onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="ZIP code"
          className="bg-paper border-2 border-ink px-3 py-2 font-mono text-sm focus:border-marker focus:outline-none transition-colors"
        />
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="bg-paper border-2 border-ink px-3 py-2 font-mono text-sm focus:border-marker focus:outline-none transition-colors"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border-2 border-rust/50 bg-rust/10 text-rust font-mono text-[0.72rem]">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={status === 'submitting' || zip.length !== 5 || !email.includes('@')}
        className="w-full bg-ink text-paper border-2 border-ink px-5 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker disabled:opacity-40 transition-colors"
      >
        {status === 'submitting' ? 'Generating…' : 'Get free preview'}
      </button>
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/40 text-center">
        We send one preview + occasional seasonal updates. No spam, no data sale.
      </p>
    </form>
  );
}
