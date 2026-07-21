'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Bot, Mail, Twitter, Share2, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { recordResult } from '@/lib/foragerGame/session';
import type { GameResult } from '@/lib/foragerGame/types';

interface Props {
  result: GameResult;
  onReplay: () => void;
}

export default function EndScreen({ result, onReplay }: Props) {
  const [recorded, setRecorded] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!recorded) {
      recordResult(result);
      setRecorded(true);
    }
  }, [result, recorded]);

  const verdictText = result.verdict === 'you-win'
    ? 'You beat the AI'
    : result.verdict === 'ai-wins' ? 'AI wins' : 'Tied';

  const shareText = encodeURIComponent(
    `I scored ${result.userScore}/${result.total} vs the Forager AI's ${result.aiScore}/${result.total}. Can you beat the AI?`,
  );
  const shareUrl = encodeURIComponent('https://homesteaderlabs.com/tools/forager-game/');
  const ogPath = `/api/forager-game/og/${result.userScore}/${result.aiScore}/`;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setEmailStatus('loading');
    setEmailError(null);
    try {
      const res = await fetch('/api/subscribe/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'forager-game',
          metadata: { mode: result.mode, userScore: result.userScore, aiScore: result.aiScore, verdict: result.verdict },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Subscribe failed');
      }
      setEmailStatus('success');
    } catch (err) {
      setEmailStatus('error');
      setEmailError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="border-2 border-ink bg-kraft grain p-6 md:p-8">
        <div className="text-center space-y-3 relative z-[2]">
          {result.verdict === 'you-win' ? (
            <Trophy size={36} className="mx-auto text-moss" />
          ) : (
            <Bot size={36} className="mx-auto text-marker" />
          )}
          <p className="font-display uppercase text-2xl md:text-3xl tracking-tight">{verdictText}</p>
          <div className="flex items-center justify-center gap-6">
            <div>
              <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 block">You</span>
              <span className="text-3xl font-display tabular-nums">{result.userScore}</span>
            </div>
            <span className="text-ink/40 font-mono">vs</span>
            <div>
              <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 block">AI</span>
              <span className="text-3xl font-display tabular-nums text-marker">{result.aiScore}</span>
            </div>
          </div>
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/50">
            Total time {(result.totalResponseMs / 1000).toFixed(1)}s · AI runs each ID in 187 ms on device
          </p>
        </div>
      </div>

      {/* Field guide capture */}
      <div className="card-paper grain p-6">
        <div className="relative z-[2]">
          <p className="font-display uppercase text-lg mb-3">Field guide</p>
          <p className="text-[0.95rem] text-ink/80 leading-relaxed mb-3">
            Drop your email. We&apos;ll send the printable lookalike field guide for every species you saw, plus seasonal foraging windows for your zone.
          </p>
          {emailStatus === 'success' ? (
            <div className="flex items-center gap-2 text-moss">
              <CheckCircle size={16} />
              <span className="font-mono text-[0.72rem] uppercase tracking-wider">Field guide on its way to {email}</span>
            </div>
          ) : (
            <form onSubmit={handleEmail} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-paper border-2 border-ink px-3 py-2 font-mono text-sm focus:border-marker focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={emailStatus === 'loading' || !email.includes('@')}
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-ink bg-ink text-paper font-mono text-[0.72rem] uppercase tracking-wider hover:bg-marker hover:border-marker disabled:opacity-40 transition-colors"
                >
                  <Mail size={14} /> Send
                </button>
              </div>
              {emailError && (
                <div className="flex items-center gap-2 text-rust font-mono text-[0.68rem]">
                  <AlertTriangle size={12} /> {emailError}
                </div>
              )}
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/40">No spam. One field guide + seasonal notes.</p>
            </form>
          )}
        </div>
      </div>

      {/* Share */}
      <div className="card-paper grain p-6">
        <div className="relative z-[2]">
          <p className="font-display uppercase text-lg mb-3">Share score</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-ink bg-paper hover:bg-kraft font-mono text-[0.72rem] uppercase tracking-wider transition-colors"
            >
              <Twitter size={12} /> X / Twitter
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-ink bg-paper hover:bg-kraft font-mono text-[0.72rem] uppercase tracking-wider transition-colors"
            >
              <Share2 size={12} /> Facebook
            </a>
            <a
              href={ogPath}
              download={`forager-score-${result.userScore}-${result.aiScore}.png`}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-ink bg-paper hover:bg-kraft font-mono text-[0.72rem] uppercase tracking-wider transition-colors"
            >
              <Share2 size={12} /> Save score card
            </a>
          </div>
        </div>
      </div>

      {/* Device CTA */}
      <div className="bg-ink text-paper border-2 border-ink p-6 md:p-8 text-center">
        <p className="font-display uppercase text-xl">The real device</p>
        <p className="mt-3 text-[0.95rem] text-paper/75 max-w-md mx-auto leading-relaxed">
          That same model, running on a 4 TOPS Hailo chip in your hand, offline, in 187 ms per scan. WALKING MAN PRO is a 5&quot; field tool that does this in your pocket.
        </p>
        <Link
          href="/shop/wlk-mn-pro/"
          className="mt-5 inline-flex items-center justify-center gap-2 bg-paper text-ink border-2 border-paper px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker hover:text-paper transition-colors"
        >
          See WALKING MAN PRO <ArrowRight size={16} />
        </Link>
      </div>

      <button
        onClick={onReplay}
        className="w-full border-2 border-ink bg-paper hover:bg-kraft px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider transition-colors"
      >
        Play again
      </button>
    </div>
  );
}
