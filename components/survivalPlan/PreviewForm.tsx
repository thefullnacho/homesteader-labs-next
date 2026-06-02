'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

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
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle size={16} />
          <span className="text-xs font-mono uppercase font-bold">Preview ready</span>
        </div>
        <a
          href={downloadUrl}
          download={`survival-garden-preview-${zip}.pdf`}
          className="inline-flex items-center justify-center font-bold uppercase bg-accent text-white border-2 border-accent px-6 py-2 text-sm shadow-brutalist"
        >
          Download_Preview_PDF
        </a>
        <p className="text-[10px] font-mono opacity-50 uppercase">
          A copy was sent to {email}. Want the full plan? <a href="/survival-garden-plan/wizard/" className="text-accent underline">Build it →</a>
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
          className="bg-black/30 border-2 border-foreground-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
        />
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="bg-black/30 border-2 border-foreground-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}
      <Button
        variant="primary"
        size="md"
        type="submit"
        disabled={status === 'submitting' || zip.length !== 5 || !email.includes('@')}
        className="w-full"
      >
        {status === 'submitting' ? 'Generating...' : 'Get_Free_Preview'}
      </Button>
      <p className="text-[10px] font-mono opacity-40 uppercase text-center">
        We send one preview + occasional seasonal updates. No spam, no data sale.
      </p>
    </form>
  );
}
