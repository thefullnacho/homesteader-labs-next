'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, Grid3x3, Sprout, FileText, ShoppingBag, ExternalLink } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import type { SurvivalPlanOutput } from '@/lib/survivalPlan/types';

const ACTION_COLORS: Record<string, string> = {
  'start-indoors': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'transplant':    'bg-green-500/20 text-green-300 border-green-500/40',
  'direct-sow':    'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  'harvest':       'bg-accent/20 text-accent border-accent/40',
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

      <BrutalistBlock refTag="OVERVIEW">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Growing zone" value={plan.growingZone} />
          <Stat label="Frost-free days" value={String(plan.frostDates.frostFreeDays)} />
          <Stat label="Crops" value={String(plan.allocations.length)} />
          <Stat label="Days of food" value={`${plan.daysOfFood.toFixed(0)} d`} highlight />
        </div>
        <div className="mt-4 pt-4 border-t border-foreground-primary/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono uppercase opacity-70">
          <div><span className="opacity-50">Total calories:</span> <span className="text-accent font-bold">{plan.totalKcal.toLocaleString()} kcal</span></div>
          <div><span className="opacity-50">Protein:</span> <span className="font-bold">{Math.round(plan.totalProteinG).toLocaleString()} g</span></div>
          <div><span className="opacity-50">Carbs:</span> <span className="font-bold">{Math.round(plan.totalCarbsG).toLocaleString()} g</span></div>
          <div><span className="opacity-50">Fat:</span> <span className="font-bold">{Math.round(plan.totalFatG).toLocaleString()} g</span></div>
        </div>
      </BrutalistBlock>

      <div className="flex flex-wrap gap-2 border-b-2 border-foreground-primary/20 pb-0">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase border-2 border-b-0 -mb-[2px] ${
                active
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-transparent text-foreground-primary/60 hover:text-foreground-primary'
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'lineup' && (
        <div className="space-y-2">
          {plan.allocations.map((a, i) => (
            <BrutalistBlock key={i}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono opacity-40">#{i + 1}</span>
                    <span className="text-sm font-mono font-bold uppercase truncate">{a.cropName}</span>
                  </div>
                  <p className="text-[10px] font-mono opacity-60 mt-1">{a.varietyName}</p>
                  <p className="text-[10px] font-mono opacity-50 mt-1 italic">{a.rationale}</p>
                </div>
                <div className="text-right text-xs font-mono shrink-0">
                  <p className="text-accent font-bold">{a.projectedKcal.toLocaleString()} kcal</p>
                  <p className="opacity-60 text-[10px] mt-1">{a.plantCount} plants · {a.sqFtUsed.toFixed(1)} sqft</p>
                </div>
              </div>
            </BrutalistBlock>
          ))}
        </div>
      )}

      {tab === 'layout' && (
        <BrutalistBlock>
          <p className="text-[10px] font-mono uppercase opacity-50 mb-3">
            {plan.layoutGridWidth} × {plan.layoutGridHeight} ft · each cell = 1 sq ft
          </p>
          <div className="overflow-x-auto">
            <div className="inline-block border-2 border-accent">
              {grid.map((row, y) => (
                <div key={y} className="flex">
                  {row.map((cell, x) => (
                    <div
                      key={x}
                      className={`w-6 h-6 border border-foreground-primary/20 flex items-center justify-center text-[10px] ${cell ? 'bg-accent/10' : ''}`}
                      title={cell?.name}
                    >
                      {cell ? cell.icon : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-mono">
            {plan.allocations.map((a, i) => (
              <div key={i} className="flex items-center gap-2 opacity-70">
                <span>· {a.cropName}</span>
              </div>
            ))}
          </div>
        </BrutalistBlock>
      )}

      {tab === 'schedule' && (
        <div className="space-y-3">
          {plan.schedule.map(week => (
            <BrutalistBlock key={week.weekIso}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono font-bold uppercase">{week.weekLabel}</span>
                <span className="text-[10px] font-mono opacity-40">{week.weekIso}</span>
              </div>
              <div className="space-y-1.5">
                {week.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono">
                    <span className={`px-2 py-0.5 border text-[10px] uppercase ${ACTION_COLORS[e.action] ?? ''}`}>
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                    <span className="truncate">{e.cropName}</span>
                    <span className="opacity-50 text-[10px] truncate">{e.varietyName}</span>
                  </div>
                ))}
              </div>
            </BrutalistBlock>
          ))}
        </div>
      )}

      {tab === 'preservation' && (
        <div className="space-y-2">
          {plan.preservation.map((p, i) => (
            <BrutalistBlock key={i}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-mono font-bold uppercase">{p.cropName}</p>
                  <p className="text-[10px] font-mono opacity-60 mt-1">
                    Harvest ~ {new Date(p.harvestDateIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-[10px] font-mono opacity-50 mt-1">
                    {p.methods.length > 0 ? p.methods.join(' · ') : 'fresh eating'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-accent font-bold">
                    {p.storageMonths > 0 ? `${p.storageMonths} mo` : 'fresh'}
                  </p>
                </div>
              </div>
            </BrutalistBlock>
          ))}
        </div>
      )}

      {tab === 'seeds' && (
        <div className="space-y-2">
          {plan.affiliateLinks.map((link, i) => (
            <BrutalistBlock key={i}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-mono font-bold uppercase">{link.cropName}</p>
                  <p className="text-[10px] font-mono opacity-60 mt-1">{link.varietyName}</p>
                  <p className="text-[10px] font-mono opacity-40 mt-1">{link.vendor}</p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-accent text-accent text-xs font-mono font-bold uppercase hover:bg-accent hover:text-white shrink-0"
                >
                  Buy <ExternalLink size={10} />
                </a>
              </div>
            </BrutalistBlock>
          ))}
          <p className="text-[10px] font-mono opacity-40 uppercase italic">
            Some links support the lab. Vendors are vetted for quality and ethos alignment.
          </p>
        </div>
      )}

      <BrutalistBlock>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono font-bold uppercase">Re-run with different inputs?</p>
            <p className="text-[10px] font-mono opacity-60 uppercase mt-1">
              The wizard pre-fills with your current plan — adjust and regenerate
            </p>
          </div>
          <Link
            href={`/survival-garden-plan/wizard/?p=${encodedToken}`}
            className="inline-flex items-center justify-center font-bold uppercase bg-accent text-white border-2 border-accent px-5 py-2 text-xs shadow-brutalist"
          >
            Modify_plan
          </Link>
        </div>
      </BrutalistBlock>

    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-mono opacity-50 uppercase mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold ${highlight ? 'text-accent' : ''}`}>{value}</p>
    </div>
  );
}
