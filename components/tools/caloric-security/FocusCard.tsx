'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { ScoredAction, PriorityTier, DismissalOption } from '@/lib/caloric-security/actionTypes';

// ============================================================
// FocusCard
//
// Renders a single scored action as a priority-coded card.
// Priority tier drives the color scheme (red/amber/green/cyan).
// Dismiss button reveals snooze options; selection propagates
// up to FocusCardDeck which persists to localStorage.
// ============================================================

interface TierStyle {
  dot:    string;
  label:  string;
  border: string;
  bg:     string;
  text:   string;
}

const TIER_STYLE: Record<PriorityTier, TierStyle> = {
  urgent:      { dot: 'bg-red-400',    label: 'URGENT',      border: 'border-red-500/30',    bg: 'bg-red-500/5',    text: 'text-red-400'    },
  this_week:   { dot: 'bg-amber-400',  label: 'THIS WEEK',   border: 'border-amber-500/30',  bg: 'bg-amber-500/5',  text: 'text-amber-400'  },
  on_track:    { dot: 'bg-green-400',  label: 'ON TRACK',    border: 'border-green-500/30',  bg: 'bg-green-500/5',  text: 'text-green-400'  },
  opportunity: { dot: 'bg-cyan-400',   label: 'OPPORTUNITY', border: 'border-cyan-500/30',   bg: 'bg-cyan-500/5',   text: 'text-cyan-400'   },
};

const DOMAIN_COLOR: Record<string, string> = {
  food:        'text-amber-400/50',
  water:       'text-cyan-400/50',
  energy:      'text-green-400/50',
  maintenance: 'text-purple-400/50',
  planning:    'text-blue-400/50',
};

const OPTION_LABEL: Record<string, string> = {
  done:             'Done',
  skip_today:       'Skip today',
  already_handled:  'Already handled',
  not_relevant:     'Not relevant',
  snooze_days:      'Snooze 3d',
};

const OPTION_COOLDOWN: Record<string, number> = {
  done:             1,   // recurrence.cooldown_after_completion used by parent
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
  // Use the action's own cooldown for "done"; other options have fixed cooldowns
  const doneCooldown = action.recurrence?.cooldown_after_completion ?? 1;

  function getCooldown(opt: DismissalOption): number {
    if (opt === 'done') return doneCooldown;
    return OPTION_COOLDOWN[opt] ?? 1;
  }

  return (
    <div className={`border ${t.border} ${t.bg} flex flex-col`}>
      {/* Priority row */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
          <span className={`text-[9px] font-mono uppercase font-bold tracking-widest ${t.text}`}>
            {t.label}
          </span>
        </div>
        <span className={`text-[8px] font-mono uppercase tracking-widest ${DOMAIN_COLOR[action.domain] ?? 'opacity-30'}`}>
          {action.domain}
        </span>
      </div>

      {/* Title */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[12px] font-mono font-bold leading-snug">{action.title}</p>
      </div>

      {/* Why text */}
      <div className="px-3 pb-3 flex-1">
        <p className="text-[10px] font-mono opacity-50 leading-relaxed">{interpolatedWhy}</p>
      </div>

      {/* Dismiss area */}
      {!showDismiss ? (
        <button
          onClick={() => setShowDismiss(true)}
          className="flex items-center justify-end gap-1 px-3 pb-2.5 text-[8px] font-mono uppercase opacity-20 hover:opacity-60 transition-opacity"
        >
          Dismiss <ChevronDown size={8} />
        </button>
      ) : (
        <div className="border-t border-white/5 px-3 py-2 flex flex-wrap items-center gap-1.5">
          {dismissOptions.map(opt => (
            <button
              key={opt}
              onClick={() => onDismiss(action.id, opt, getCooldown(opt))}
              className="text-[8px] font-mono uppercase border border-white/10 hover:border-white/30 px-2 py-0.5 transition-colors opacity-60 hover:opacity-100"
            >
              {OPTION_LABEL[opt] ?? opt}
            </button>
          ))}
          <button
            onClick={() => setShowDismiss(false)}
            className="ml-auto opacity-30 hover:opacity-60 transition-opacity"
          >
            <X size={9} />
          </button>
        </div>
      )}
    </div>
  );
}
