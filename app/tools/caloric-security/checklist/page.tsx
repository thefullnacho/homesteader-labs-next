'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Printer, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Typography from '@/components/ui/Typography';
import { useFieldStation } from '@/app/context/FieldStationContext';

// ─── Task data ────────────────────────────────────────────────

interface ChecklistTask {
  id: string;
  label: string;
  detail?: string;
  category: 'seeds' | 'planting' | 'harvest' | 'preservation' | 'storage' | 'water' | 'energy' | 'planning';
}

const CATEGORY_COLORS: Record<ChecklistTask['category'], string> = {
  seeds:        'text-green-400',
  planting:     'text-lime-400',
  harvest:      'text-orange-400',
  preservation: 'text-yellow-400',
  storage:      'text-blue-400',
  water:        'text-cyan-400',
  energy:       'text-purple-400',
  planning:     'text-border-primary opacity-60',
};

const MONTHLY_TASKS: Record<number, ChecklistTask[]> = {
  1: [
    { id: 'jan-01', label: 'Audit root cellar & canned goods for spoilage',        category: 'storage',      detail: 'Check dates, look for rust, bulging lids, off-smells' },
    { id: 'jan-02', label: 'Update food inventory counts in Caloric Dashboard',     category: 'planning' },
    { id: 'jan-03', label: 'Place seed orders — prioritize high-calorie crops',     category: 'seeds',        detail: 'Potatoes, squash, beans, corn' },
    { id: 'jan-04', label: 'Check water storage levels & barrel seals',             category: 'water' },
    { id: 'jan-05', label: 'Inspect solar panels and battery bank connections',     category: 'energy' },
    { id: 'jan-06', label: 'Plan bed layout and companion groupings for spring',    category: 'planning' },
  ],
  2: [
    { id: 'feb-01', label: 'Start onions, leeks, and celery indoors (10–12 wks before last frost)', category: 'seeds' },
    { id: 'feb-02', label: 'Sharpen and oil all hand tools',                        category: 'planning' },
    { id: 'feb-03', label: 'Test rain catchment system & clean first-flush diverters', category: 'water' },
    { id: 'feb-04', label: 'Review companion planting plan before buying seeds',    category: 'planning' },
    { id: 'feb-05', label: 'Rotate oldest canned goods to front of shelf',         category: 'storage' },
  ],
  3: [
    { id: 'mar-01', label: 'Start peppers indoors (8–10 wks before last frost)',   category: 'seeds' },
    { id: 'mar-02', label: 'Start tomatoes indoors (6–8 wks before last frost)',   category: 'seeds' },
    { id: 'mar-03', label: 'Direct sow cold-hardy greens outdoors (spinach, kale, lettuce)', category: 'planting', detail: 'Can go in ground 4–6 wks before last frost' },
    { id: 'mar-04', label: 'Prepare raised beds — amend soil with compost',        category: 'planting' },
    { id: 'mar-05', label: 'Check seed germination rates — test old stock',        category: 'seeds' },
    { id: 'mar-06', label: 'Replenish water barrels before spring dry season',     category: 'water' },
  ],
  4: [
    { id: 'apr-01', label: 'Harden off tomato and pepper starts (7–10 days)',      category: 'planting' },
    { id: 'apr-02', label: 'Plant potatoes once soil reaches 45°F',               category: 'planting' },
    { id: 'apr-03', label: 'Direct sow carrots, beets, radishes, and peas',       category: 'planting' },
    { id: 'apr-04', label: 'Rotate canned goods — move 2024 batch to front',      category: 'storage',      detail: 'Label anything older than 18 months for priority use' },
    { id: 'apr-05', label: 'Set up drip irrigation before peak growing season',   category: 'water' },
    { id: 'apr-06', label: 'Check for companion planting conflicts in planned beds', category: 'planning' },
  ],
  5: [
    { id: 'may-01', label: 'Transplant tomatoes, peppers, basil after last frost', category: 'planting' },
    { id: 'may-02', label: 'Direct sow squash, cucumbers, beans, corn',           category: 'planting' },
    { id: 'may-03', label: 'Begin succession sowing lettuce (every 2–3 weeks)',   category: 'planting',     detail: 'Keeps harvest continuous through summer' },
    { id: 'may-04', label: 'Set up trellis systems for climbing crops',           category: 'planting' },
    { id: 'may-05', label: 'First harvest: radishes, spring greens, pea shoots',  category: 'harvest' },
    { id: 'may-06', label: 'Track daily water usage — calibrate irrigation system', category: 'water' },
  ],
  6: [
    { id: 'jun-01', label: 'Harvest lettuce, spinach before bolting',             category: 'harvest' },
    { id: 'jun-02', label: 'Begin strawberry harvest — freeze or jam excess',     category: 'preservation', detail: 'Freeze whole on sheet pan, then bag. Jam: 4:3 fruit:sugar ratio' },
    { id: 'jun-03', label: 'Pickle first radishes and cucumbers',                 category: 'preservation' },
    { id: 'jun-04', label: 'Monitor soil moisture daily — peak evaporation month',category: 'water' },
    { id: 'jun-05', label: 'Log harvest weights in caloric dashboard',            category: 'planning' },
    { id: 'jun-06', label: 'Check battery charge levels & solar output',          category: 'energy' },
  ],
  7: [
    { id: 'jul-01', label: 'Peak harvest: tomatoes, zucchini, beans, cucumbers', category: 'harvest',       detail: 'Harvest daily to keep plants producing' },
    { id: 'jul-02', label: 'Process tomatoes — can, freeze, or dehydrate',       category: 'preservation',  detail: 'Boiling water bath: quarts 45 min, pints 35 min' },
    { id: 'jul-03', label: 'Dehydrate excess herbs (basil, oregano, thyme)',     category: 'preservation' },
    { id: 'jul-04', label: 'Freeze green beans, corn, and summer squash',        category: 'preservation' },
    { id: 'jul-05', label: 'Begin saving seeds from open-pollinated varieties',  category: 'seeds',         detail: 'Tomatoes, peppers, squash — dry fully before storing' },
    { id: 'jul-06', label: 'Audit water stores — refill if below 50% capacity', category: 'water' },
  ],
  8: [
    { id: 'aug-01', label: 'Continue seed saving — beans, cucumbers, melons',    category: 'seeds' },
    { id: 'aug-02', label: 'Start fall brassica transplants (broccoli, kale, cabbage)', category: 'planting', detail: 'Set out 6–8 wks before first frost' },
    { id: 'aug-03', label: 'Direct sow fall turnips, spinach, arugula',          category: 'planting' },
    { id: 'aug-04', label: 'Process tomato glut — salsa, sauce, whole canned',  category: 'preservation' },
    { id: 'aug-05', label: 'Prepare root cellar — clean, check humidity & temp', category: 'storage',       detail: 'Target: 32–40°F, 90–95% humidity for most root crops' },
    { id: 'aug-06', label: 'Update caloric dashboard with mid-season harvest data', category: 'planning' },
  ],
  9: [
    { id: 'sep-01', label: 'Harvest winter squash & pumpkins before first frost',category: 'harvest',       detail: 'Cure 10–14 days at 80–85°F to harden skin' },
    { id: 'sep-02', label: 'Dig potatoes after tops die back',                   category: 'harvest' },
    { id: 'sep-03', label: 'Final tomato processing push — green tomatoes → relish', category: 'preservation' },
    { id: 'sep-04', label: 'Harvest and braid onions and garlic',                category: 'storage' },
    { id: 'sep-05', label: 'Plant garlic cloves for next season',                category: 'planting',      detail: 'Plant 4–6 wks before ground freeze' },
    { id: 'sep-06', label: 'Begin moving root crops into root cellar',           category: 'storage' },
  ],
  10: [
    { id: 'oct-01', label: 'Apply frost protection for late crops (row cover, cold frames)', category: 'planting' },
    { id: 'oct-02', label: 'Final harvest before killing frost',                 category: 'harvest',       detail: 'Peppers, eggplant, tender herbs — bring in at 36°F' },
    { id: 'oct-03', label: 'Make apple/pear cider or dry fruit',                category: 'preservation' },
    { id: 'oct-04', label: 'Full food inventory audit — calculate days of autonomy', category: 'planning',  detail: 'Compare to Caloric Dashboard target' },
    { id: 'oct-05', label: 'Drain and store drip irrigation lines',             category: 'water' },
    { id: 'oct-06', label: 'Winterize water barrels — insulate or drain if freezing', category: 'water' },
  ],
  11: [
    { id: 'nov-01', label: 'Final root crop harvest — parsnips, carrots sweeten after frost', category: 'harvest' },
    { id: 'nov-02', label: 'Store root crops in root cellar or sand boxes',     category: 'storage' },
    { id: 'nov-03', label: 'Process leftover herbs — dry or freeze in oil',     category: 'preservation' },
    { id: 'nov-04', label: 'Close and clean garden beds — add compost layer',   category: 'planning' },
    { id: 'nov-05', label: 'Review season results — what to plant more/less of', category: 'planning' },
    { id: 'nov-06', label: 'Battery bank maintenance — equalization charge',    category: 'energy' },
  ],
  12: [
    { id: 'dec-01', label: 'Root cellar check — remove any spoiling produce',   category: 'storage',       detail: 'One bad potato can spoil the lot — check weekly' },
    { id: 'dec-02', label: 'Inventory all stored food — update caloric dashboard', category: 'planning' },
    { id: 'dec-03', label: 'Order seeds for next year — prioritize caloric density', category: 'seeds' },
    { id: 'dec-04', label: 'Rest, review, and plan next season layout',          category: 'planning' },
    { id: 'dec-05', label: 'Check water storage for winter contamination',       category: 'water' },
    { id: 'dec-06', label: 'Inspect solar array for snow buildup or damage',    category: 'energy' },
  ],
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Component ───────────────────────────────────────────────

export default function ResilienceChecklist() {
  const { frostDates } = useFieldStation();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1–12
  const currentYear  = now.getFullYear();

  // Persistence: localStorage key per year-month
  const storageKey = `hl_checklist_${currentYear}_${String(currentMonth).padStart(2, '0')}`;

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setChecked(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey]);

  const toggle = useCallback((taskId: string) => {
    setChecked(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  const currentTasks = MONTHLY_TASKS[currentMonth] ?? [];
  const nextMonth    = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextTasks    = MONTHLY_TASKS[nextMonth] ?? [];

  const doneCount = currentTasks.filter(t => checked[t.id]).length;

  // Frost proximity alert
  const lastFrostAlert = (() => {
    if (!frostDates) return null;
    const diff = Math.ceil(
      (frostDates.lastSpringFrost.getTime() - now.getTime()) / 86400000
    );
    if (diff > 0 && diff <= 21) return { type: 'last' as const, days: diff };
    if (diff < 0 && diff >= -7) return { type: 'passed' as const, days: Math.abs(diff) };
    return null;
  })();

  const firstFrostAlert = (() => {
    if (!frostDates) return null;
    const diff = Math.ceil(
      (frostDates.firstFallFrost.getTime() - now.getTime()) / 86400000
    );
    if (diff > 0 && diff <= 21) return { type: 'first' as const, days: diff };
    return null;
  })();

  return (
    <FieldStationLayout stationId="HL_CHECKLIST_V1.0">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-border-primary pb-6 print:hidden">
          <div>
            <Link
              href="/tools/caloric-security"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-40 hover:opacity-80 transition-opacity mb-3"
            >
              <ArrowLeft size={10} /> Dashboard
            </Link>
            <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono">
              Monthly Checklist
            </Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              {MONTH_NAMES[currentMonth - 1]} {currentYear} {'//'} {doneCount}/{currentTasks.length} complete
            </Typography>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 border-2 border-border-primary hover:border-accent hover:text-accent transition-colors text-xs font-bold font-mono uppercase bg-black/20 print:hidden self-start"
          >
            <Printer size={12} />
            Print Guide
          </button>
        </div>

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold font-mono uppercase">
            Homesteader Labs — Resilience Checklist
          </h1>
          <p className="text-sm font-mono mt-1">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
            {frostDates ? ` · Last frost: ${frostDates.lastSpringFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · First frost: ${frostDates.firstFallFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
          </p>
        </div>

        {/* Frost proximity alerts */}
        {lastFrostAlert && (
          <BrutalistBlock className="p-4 border-orange-500/50 bg-orange-500/10 text-orange-400 print:border print:border-black print:bg-transparent print:text-black" refTag="FROST_ALERT">
            <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold">
              <AlertTriangle size={14} />
              {lastFrostAlert.type === 'last'
                ? `Last spring frost in ~${lastFrostAlert.days} days — transplant window opening`
                : `Last spring frost passed ${lastFrostAlert.days} day${lastFrostAlert.days !== 1 ? 's' : ''} ago — safe to transplant`
              }
            </div>
          </BrutalistBlock>
        )}

        {firstFrostAlert && (
          <BrutalistBlock className="p-4 border-blue-500/50 bg-blue-500/10 text-blue-400 print:border print:border-black print:bg-transparent print:text-black" refTag="FIRST_FROST_ALERT">
            <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold">
              <AlertTriangle size={14} />
              First fall frost in ~{firstFrostAlert.days} days — protect tender crops now
            </div>
          </BrutalistBlock>
        )}

        {/* Current month tasks */}
        <BrutalistBlock
          className="p-6 print:border print:border-black print:bg-transparent"
          refTag={`${MONTH_NAMES[currentMonth - 1].toUpperCase().slice(0, 3)}_TASKS`}
        >
          <div className="flex items-center justify-between mb-5">
            <Typography variant="h3" className="mb-0 uppercase tracking-tighter">
              {MONTH_NAMES[currentMonth - 1]} Tasks
            </Typography>
            <span className="text-[9px] font-mono opacity-30 uppercase">
              {doneCount}/{currentTasks.length} done
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-black/20 mb-6 print:hidden">
            <div
              className="h-1 bg-accent transition-all duration-500"
              style={{ width: `${currentTasks.length > 0 ? (doneCount / currentTasks.length) * 100 : 0}%` }}
            />
          </div>

          <div className="space-y-2 print:space-y-3">
            {currentTasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggle(task.id)}
                className="flex items-start gap-3 p-3 cursor-pointer group hover:bg-black/10 transition-colors print:cursor-default print:hover:bg-transparent print:p-1"
              >
                <div className={`mt-0.5 shrink-0 transition-colors print:hidden ${checked[task.id] ? 'text-accent' : 'opacity-30 group-hover:opacity-60'}`}>
                  {checked[task.id] ? <CheckSquare size={14} /> : <Square size={14} />}
                </div>
                {/* Print-only checkbox */}
                <div className="hidden print:block w-4 h-4 border border-black shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className={`text-xs font-mono uppercase leading-tight transition-opacity ${checked[task.id] ? 'line-through opacity-30 print:no-underline print:opacity-100' : ''}`}>
                    <span className={`mr-2 ${CATEGORY_COLORS[task.category]} print:text-black`}>
                      [{task.category.toUpperCase().slice(0, 4)}]
                    </span>
                    {task.label}
                  </p>
                  {task.detail && (
                    <p className="text-[9px] font-mono opacity-30 mt-1 leading-tight uppercase print:opacity-60">
                      {task.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </BrutalistBlock>

        {/* Next month preview (read-only) */}
        <BrutalistBlock className="p-6 opacity-50 print:hidden" refTag={`NEXT_${MONTH_NAMES[nextMonth - 1].toUpperCase().slice(0, 3)}`}>
          <Typography variant="h4" className="mb-4 text-xs uppercase tracking-widest opacity-60">
            Upcoming: {MONTH_NAMES[nextMonth - 1]}
          </Typography>
          <div className="space-y-2">
            {nextTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-start gap-3 p-2">
                <Square size={12} className="mt-0.5 shrink-0 opacity-30" />
                <p className="text-[10px] font-mono uppercase opacity-50 leading-tight">{task.label}</p>
              </div>
            ))}
            {nextTasks.length > 3 && (
              <p className="text-[9px] font-mono opacity-30 uppercase pl-7">
                +{nextTasks.length - 3} more tasks in {MONTH_NAMES[nextMonth - 1]}
              </p>
            )}
          </div>
        </BrutalistBlock>

        {!frostDates && (
          <p className="text-[9px] font-mono opacity-30 uppercase text-center print:hidden">
            Set your ZIP code in the{' '}
            <Link href="/tools/planting-calendar/" className="underline">Planting Calendar</Link>
            {' '}to enable frost date alerts.
          </p>
        )}
      </div>
    </FieldStationLayout>
  );
}
