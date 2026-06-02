'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Bot, Mail, Twitter, Share2, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Typography from '@/components/ui/Typography';
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
      <BrutalistBlock variant="accent" refTag="RESULT">
        <div className="text-center space-y-3 py-2">
          {result.verdict === 'you-win' ? (
            <Trophy size={36} className="mx-auto text-white" />
          ) : (
            <Bot size={36} className="mx-auto text-white" />
          )}
          <Typography variant="h2" className="uppercase tracking-tight">{verdictText}</Typography>
          <div className="flex items-center justify-center gap-6 text-lg font-mono">
            <div>
              <span className="text-[10px] font-mono uppercase opacity-60 block">You</span>
              <span className="text-3xl font-bold tabular-nums">{result.userScore}</span>
            </div>
            <span className="opacity-40">vs</span>
            <div>
              <span className="text-[10px] font-mono uppercase opacity-60 block">AI</span>
              <span className="text-3xl font-bold tabular-nums text-white">{result.aiScore}</span>
            </div>
          </div>
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
            Total time {(result.totalResponseMs / 1000).toFixed(1)}s · AI runs each ID in 187 ms on device
          </p>
        </div>
      </BrutalistBlock>

      <BrutalistBlock>
        <Typography variant="h3" className="uppercase tracking-tight mb-3">Field_Guide</Typography>
        <p className="text-xs font-mono opacity-70 leading-relaxed mb-3">
          Drop your email — we&apos;ll send the printable lookalike field guide for every species you saw, plus seasonal foraging windows for your zone.
        </p>
        {emailStatus === 'success' ? (
          <div className="flex items-center gap-2 text-accent">
            <CheckCircle size={16} />
            <span className="text-xs font-mono uppercase">Field guide on its way to {email}</span>
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
                className="flex-1 bg-black/30 border-2 border-foreground-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
              />
              <button
                type="submit"
                disabled={emailStatus === 'loading' || !email.includes('@')}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-accent text-accent font-bold uppercase text-xs hover:bg-accent hover:text-white disabled:opacity-40"
              >
                <Mail size={14} /> Send
              </button>
            </div>
            {emailError && (
              <div className="flex items-center gap-2 text-red-300 text-[10px] font-mono">
                <AlertTriangle size={12} /> {emailError}
              </div>
            )}
            <p className="text-[10px] font-mono opacity-30 uppercase tracking-widest">No spam. One field guide + seasonal notes.</p>
          </form>
        )}
      </BrutalistBlock>

      <BrutalistBlock>
        <Typography variant="h3" className="uppercase tracking-tight mb-3">Share_score</Typography>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground-primary/40 hover:border-accent hover:text-accent text-xs font-mono font-bold uppercase"
          >
            <Twitter size={12} /> X / Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground-primary/40 hover:border-accent hover:text-accent text-xs font-mono font-bold uppercase"
          >
            <Share2 size={12} /> Facebook
          </a>
          <a
            href={ogPath}
            download={`forager-score-${result.userScore}-${result.aiScore}.png`}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground-primary/40 hover:border-accent hover:text-accent text-xs font-mono font-bold uppercase"
          >
            <Share2 size={12} /> Save score card
          </a>
        </div>
      </BrutalistBlock>

      <BrutalistBlock variant="accent">
        <div className="text-center space-y-3 py-2">
          <Typography variant="h3" className="uppercase tracking-tight">The_real_device</Typography>
          <p className="text-xs font-mono opacity-80 max-w-md mx-auto leading-relaxed">
            That same model — running on a 4 TOPS Hailo chip in your hand, offline, in 187 ms per scan. WALKING MAN PRO is a 5&quot; field tool that does this in your pocket.
          </p>
          <Link
            href="/shop/wlk-mn-pro/"
            className="inline-flex items-center justify-center gap-2 font-bold uppercase bg-white text-accent border-2 border-white px-6 py-3 text-sm shadow-brutalist hover:bg-white/90"
          >
            See WALKING MAN PRO <ArrowRight size={16} />
          </Link>
        </div>
      </BrutalistBlock>

      <button
        onClick={onReplay}
        className="w-full border-2 border-foreground-primary/40 hover:border-accent hover:text-accent px-6 py-3 text-sm font-mono font-bold uppercase"
      >
        Play_again
      </button>
    </div>
  );
}
