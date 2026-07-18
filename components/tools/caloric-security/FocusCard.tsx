'use client';

import { useState } from 'react';
import type { ScoredAction, PriorityTier, DismissalOption } from '@/lib/caloric-security/actionTypes';

// ============================================================
// FocusCard
//
// One scored action as a checklist line on the docket.
// Priority tier drives the tag color; "done" and the snooze
// options propagate up to FocusCardDeck, which persists the
// dismissal to localStorage.
// ============================================================

const TIER_STYLE: Record<PriorityTier, { label: string; tag: string }> = {
  urgent:      { label: 'URGENT',      tag: 'text-marker border-marker' },
  this_week:   { label: 'THIS WEEK',   tag: 'text-rust border-rust' },
  on_track:    { label: 'ON TRACK',    tag: 'text-moss border-moss' },
  opportunity: { label: 'OPPORTUNITY', tag: 'text-slateblue border-slateblue' },
};

const OPTION_LABEL: Record<string, string> = {
  done:             'Done',
  skip_today:       'Skip today',
  already_handled:  'Already handled',
  not_relevant:     'Not relevant',
  snooze_days:      'Snooze 3d',
};

const OPTION_COOLDOWN: Record<string, number> = {
  done:             1,   // recurrence.cooldown_after_completion used instead
  skip_today:       1,
  already_handled:  7,
  not_relevant:     30,
  snooze_days:      3,
};

interface FocusCardProps {
  scored:    ScoredAction;
  onDismiss: (id: string, option: DismissalOption, cooldownDays: number) => void;
}

export default function FocusCard({ scored, onDismiss }: FocusCardProps) {
  const { action, tier, interpolatedWhy } = scored;
  const t = TIER_STYLE[tier];
  const [showDismiss, setShowDismiss] = useState(false);

  const dismissOptions = (action.dismissal?.options ?? ['done', 'skip_today']) as DismissalOption[];
  const doneCooldown = action.recurrence?.cooldown_after_completion ?? 1;

  function getCooldown(opt: DismissalOption): number {
    if (opt === 'done') return doneCooldown;
    return OPTION_COOLDOWN[opt] ?? 1;
  }

  return (
    <div className="border-b border-dotted border-ink/40 pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="field-checkbox mt-1 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-[1rem] leading-snug">
            <span className="font-semibold">{action.title}</span>
            <span className={`ml-2 font-mono text-[0.62rem] uppercase tracking-widest border px-1 py-0.5 align-middle whitespace-nowrap ${t.tag}`}>
              {t.label}
            </span>
            <span className="ml-2 font-mono text-[0.62rem] uppercase tracking-widest text-ink/45 align-middle">
              {action.domain}
            </span>
          </p>
          <p className="mt-1 text-[0.88rem] text-ink/70 leading-snug">{interpolatedWhy}</p>

          {!showDismiss ? (
            <button
              onClick={() => setShowDismiss(true)}
              className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-ink/45 hover:text-marker underline underline-offset-4"
            >
              Check it off
            </button>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {dismissOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => onDismiss(action.id, opt, getCooldown(opt))}
                  className="font-mono text-[0.62rem] uppercase tracking-wider border-2 border-ink bg-paper px-2 py-0.5 hover:bg-kraft transition-colors"
                >
                  {OPTION_LABEL[opt] ?? opt}
                </button>
              ))}
              <button
                onClick={() => setShowDismiss(false)}
                className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/45 hover:text-ink px-1"
              >
                Never mind
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
