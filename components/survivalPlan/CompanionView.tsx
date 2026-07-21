'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, Grid3x3, Sprout, FileText, ShoppingBag, ExternalLink } from 'lucide-react';
import type { SurvivalPlanOutput } from '@/lib/survivalPlan/types';

const ACTION_COLORS: Record<string, string> = {
  'start-indoors': 'bg-slateblue/15 text-slateblue border-slateblue/50',
  'transplant':    'bg-moss/15 text-moss border-moss/50',
  'direct-sow':    'bg-marker/15 text-marker border-marker/50',
  'harvest':       'bg-rust/15 text-rust border-rust/50',
};

const ACTION_LABELS: Record<string, string> = {
  'start-indoors': 'Start indoors',
  'transplant':    'Transplant',
  'direct-sow':    'Direct sow',
  'harvest':       'Harvest',
};

const TABS = [
  { id: 'lineup',       label: 'Crops',    icon: Sprout },
  { id: 'layout',       label: 'Layout',   icon: Grid3x3 },
  { id: 'schedule',     label: 'Schedule', icon: Calendar },
  { id: 'preservation', label: 'Storage',  icon: FileText },
  { id: 'seeds',        label: 'Seeds',    icon: ShoppingBag },
];

export default function CompanionView({ plan, encodedToken }: { plan: SurvivalPlanOutput; encodedToken: string }) {
  const [tab, setTab] = useState<string>('lineup');

  const grid = useMemo(() => {
    const g: Array<Array<{ icon: string; name: string } | null>> =
      Array.from({ length: plan.layoutGridHeight }, () => Array(plan.layoutGridWidth).fill(null));
    for (const cell of plan.layout) {
      for (let dy = 0; dy < cell.h; dy++) {
        for (let dx = 0; dx < cell.w; dx++) {
          const gy = cell.y + dy, gx = cell.x + dx;
          if (gy < g.length && gx < g[gy].length) g[gy][gx] = { icon: cell.icon, name: cell.cropName };
        }
      }
    }
    return g;
  }, [plan]);

  return (
    <div className="space-y-6">

      {/* Overview ledger */}
      <div className="card-paper grain p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-[2]">
          <Stat label="Growing zone" value={plan.growingZone} />
          <Stat label="Frost-free days" value={String(plan.frostDates.frostFreeDays)} />
          <Stat label="Crops" value={String(plan.allocations.length)} />
          <Stat label="Days of food" value={`${plan.daysOfFood.toFixed(0)} d`} highlight />
        </div>
        <div className="mt-4 pt-4 border-t border-dotted border-ink/40 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[0.68rem] uppercase tracking-wider relative z-[2]">
          <div><span className="text-ink/50">Total calories:</span> <span className="text-marker font-bold">{plan.totalKcal.toLocaleString()} kcal</span></div>
          <div><span className="text-ink/50">Protein:</span> <span className="font-bold">{Math.round(plan.totalProteinG).toLocaleString()} g</span></div>
          <div><span className="text-ink/50">Carbs:</span> <span className="font-bold">{Math.round(plan.totalCarbsG).toLocaleString()} g</span></div>
          <div><span className="text-ink/50">Fat:</span> <span className="font-bold">{Math.round(plan.totalFatG).toLocaleString()} g</span></div>
        </div>
      </div>

      {/* Drawer pulls */}
      <div className="flex flex-wrap items-end gap-2 border-b-2 border-ink pb-0" role="tablist" aria-label="Plan sections">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 pt-2 pb-2.5 font-mono text-[0.72rem] uppercase tracking-wider border-2 border-b-0 border-ink transition-colors ${
                active ? 'bg-ink text-paper' : 'bg-manila hover:bg-kraft text-ink'
              }`}
              style={{
                clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0 100%)',
                marginBottom: '-2px',
              }}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'lineup' && (
        <div className="space-y-3">
          {plan.allocations.map((a, i) => (
            <div key={i} className="card-paper grain p-4">
              <div className="flex items-start justify-between gap-4 relative z-[2]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink/40">#{i + 1}</span>
                    <span className="font-display uppercase text-base truncate">{a.cropName}</span>
                  </div>
                  <p className="font-mono text-[0.68rem] text-ink/60 mt-1">{a.varietyName}</p>
                  <p className="text-[0.92rem] text-ink/70 mt-1 italic">{a.rationale}</p>
                </div>
                <div className="text-right font-mono shrink-0">
                  <p className="text-marker font-bold text-sm">{a.projectedKcal.toLocaleString()} kcal</p>
                  <p className="text-ink/60 text-[0.68rem] mt-1">{a.plantCount} plants · {a.sqFtUsed.toFixed(1)} sqft</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'layout' && (
        <div className="card-paper grain p-5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/55 mb-3 relative z-[2]">
            {plan.layoutGridWidth} × {plan.layoutGridHeight} ft · each cell = 1 sq ft
          </p>
          <div className="overflow-x-auto relative z-[2]">
            <div className="inline-block border-2 border-ink">
              {grid.map((row, y) => (
                <div key={y} className="flex">
                  {row.map((cell, x) => (
                    <div
                      key={x}
                      className={`w-6 h-6 border border-ink/20 flex items-center justify-center text-[10px] ${cell ? 'bg-kraft' : ''}`}
                      title={cell?.name}
                    >
                      {cell ? cell.icon : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[0.68rem] relative z-[2]">
            {plan.allocations.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-ink/70">
                <span>· {a.cropName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-3">
          {plan.schedule.map(week => (
            <div key={week.weekIso} className="card-paper grain p-4">
              <div className="flex items-center justify-between mb-3 relative z-[2]">
                <span className="font-display uppercase text-base">{week.weekLabel}</span>
                <span className="font-mono text-[0.68rem] text-ink/40">{week.weekIso}</span>
              </div>
              <div className="space-y-1.5 relative z-[2]">
                {week.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-xs">
                    <span className={`px-2 py-0.5 border text-[0.64rem] uppercase ${ACTION_COLORS[e.action] ?? ''}`}>
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                    <span className="truncate">{e.cropName}</span>
                    <span className="text-ink/50 text-[0.68rem] truncate">{e.varietyName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'preservation' && (
        <div className="space-y-3">
          {plan.preservation.map((p, i) => (
            <div key={i} className="card-paper grain p-4">
              <div className="flex items-start justify-between gap-4 relative z-[2]">
                <div className="flex-1">
                  <p className="font-display uppercase text-base">{p.cropName}</p>
                  <p className="font-mono text-[0.68rem] text-ink/60 mt-1">
                    Harvest ~ {new Date(p.harvestDateIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="font-mono text-[0.68rem] text-ink/50 mt-1">
                    {p.methods.length > 0 ? p.methods.join(' · ') : 'fresh eating'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm text-marker font-bold">
                    {p.storageMonths > 0 ? `${p.storageMonths} mo` : 'fresh'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'seeds' && (
        <div className="space-y-3">
          {plan.affiliateLinks.map((link, i) => (
            <div key={i} className="card-paper grain p-4">
              <div className="flex items-start justify-between gap-4 relative z-[2]">
                <div className="flex-1">
                  <p className="font-display uppercase text-base">{link.cropName}</p>
                  <p className="font-mono text-[0.68rem] text-ink/60 mt-1">{link.varietyName}</p>
                  <p className="font-mono text-[0.68rem] text-ink/40 mt-1">{link.vendor}</p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-ink bg-paper hover:bg-kraft font-mono text-[0.72rem] uppercase tracking-wider shrink-0 transition-colors"
                >
                  Buy <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))}
          <p className="font-mono text-[0.64rem] text-ink/40 uppercase italic">
            Some links support the lab. Vendors are vetted for quality and ethos alignment.
          </p>
        </div>
      )}

      {/* Re-run CTA */}
      <div className="border-2 border-ink bg-kraft grain p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-[2]">
          <div>
            <p className="font-mono font-bold uppercase text-sm">Re-run with different inputs?</p>
            <p className="font-mono text-[0.68rem] text-ink/60 uppercase mt-1">
              The wizard pre-fills with your current plan, adjust and regenerate
            </p>
          </div>
          <Link
            href={`/survival-garden-plan/wizard/?p=${encodedToken}`}
            className="inline-flex items-center justify-center bg-ink text-paper border-2 border-ink px-5 py-2.5 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
          >
            Modify plan
          </Link>
        </div>
      </div>

    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 mb-1">{label}</p>
      <p className={`text-2xl font-display tabular-nums ${highlight ? 'text-marker' : ''}`}>{value}</p>
    </div>
  );
}
