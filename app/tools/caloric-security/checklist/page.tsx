'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import DrawerBand from '@/components/tools/caloric-security/DrawerBand';
import { useFieldStation } from '@/app/context/FieldStationContext';

// ─── Task data ────────────────────────────────────────────────

interface ChecklistTask {
  id: string;
  label: string;
  detail?: string;
  category: 'seeds' | 'planting' | 'harvest' | 'preservation' | 'storage' | 'water' | 'energy' | 'planning';
}

const CATEGORY_COLORS: Record<ChecklistTask['category'], string> = {
  seeds:        'text-moss',
  planting:     'text-moss',
  harvest:      'text-marker',
  preservation: 'text-marker',
  storage:      'text-slateblue',
  water:        'text-slateblue',
  energy:       'text-rust',
  planning:     'text-ink/55',
};

const MONTHLY_TASKS: Record<number, ChecklistTask[]> = {
  1: [
    { id: 'jan-01', label: 'Audit root cellar & canned goods for spoilage',        category: 'storage',      detail: 'Check dates, look for rust, bulging lids, off-smells' },
    { id: 'jan-02', label: 'Update food inventory counts in the resilience ledger', category: 'planning' },
    { id: 'jan-03', label: 'Place seed orders, high-calorie crops first',           category: 'seeds',        detail: 'Potatoes, squash, beans, corn' },
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
    { id: 'mar-04', label: 'Prepare raised beds, amend soil with compost',         category: 'planting' },
    { id: 'mar-05', label: 'Check seed germination rates, test old stock',         category: 'seeds' },
    { id: 'mar-06', label: 'Replenish water barrels before spring dry season',     category: 'water' },
  ],
  4: [
    { id: 'apr-01', label: 'Harden off tomato and pepper starts (7–10 days)',      category: 'planting' },
    { id: 'apr-02', label: 'Plant potatoes once soil reaches 45°F',               category: 'planting' },
    { id: 'apr-03', label: 'Direct sow carrots, beets, radishes, and peas',       category: 'planting' },
    { id: 'apr-04', label: 'Rotate canned goods, oldest batch to the front',      category: 'storage',      detail: 'Label anything older than 18 months for priority use' },
    { id: 'apr-05', label: 'Set up drip irrigation before peak growing season',   category: 'water' },
    { id: 'apr-06', label: 'Check for companion planting conflicts in planned beds', category: 'planning' },
  ],
  5: [
    { id: 'may-01', label: 'Transplant tomatoes, peppers, basil after last frost', category: 'planting' },
    { id: 'may-02', label: 'Direct sow squash, cucumbers, beans, corn',           category: 'planting' },
    { id: 'may-03', label: 'Begin succession sowing lettuce (every 2–3 weeks)',   category: 'planting',     detail: 'Keeps harvest continuous through summer' },
    { id: 'may-04', label: 'Set up trellis systems for climbing crops',           category: 'planting' },
    { id: 'may-05', label: 'First harvest: radishes, spring greens, pea shoots',  category: 'harvest' },
    { id: 'may-06', label: 'Track daily water usage, calibrate irrigation',       category: 'water' },
  ],
  6: [
    { id: 'jun-01', label: 'Harvest lettuce, spinach before bolting',             category: 'harvest' },
    { id: 'jun-02', label: 'Begin strawberry harvest, freeze or jam the excess',  category: 'preservation', detail: 'Freeze whole on sheet pan, then bag. Jam: 4:3 fruit:sugar ratio' },
    { id: 'jun-03', label: 'Pickle first radishes and cucumbers',                 category: 'preservation' },
    { id: 'jun-04', label: 'Monitor soil moisture daily, peak evaporation month', category: 'water' },
    { id: 'jun-05', label: 'Log harvest weights in the resilience ledger',        category: 'planning' },
    { id: 'jun-06', label: 'Check battery charge levels & solar output',          category: 'energy' },
  ],
  7: [
    { id: 'jul-01', label: 'Peak harvest: tomatoes, zucchini, beans, cucumbers', category: 'harvest',       detail: 'Harvest daily to keep plants producing' },
    { id: 'jul-02', label: 'Process tomatoes: can, freeze, or dehydrate',        category: 'preservation',  detail: 'Boiling water bath: quarts 45 min, pints 35 min' },
    { id: 'jul-03', label: 'Dehydrate excess herbs (basil, oregano, thyme)',     category: 'preservation' },
    { id: 'jul-04', label: 'Freeze green beans, corn, and summer squash',        category: 'preservation' },
    { id: 'jul-05', label: 'Begin saving seeds from open-pollinated varieties',  category: 'seeds',         detail: 'Tomatoes, peppers, squash. Dry fully before storing' },
    { id: 'jul-06', label: 'Audit water stores, refill if below 50% capacity',   category: 'water' },
  ],
  8: [
    { id: 'aug-01', label: 'Continue seed saving: beans, cucumbers, melons',     category: 'seeds' },
    { id: 'aug-02', label: 'Start fall brassica transplants (broccoli, kale, cabbage)', category: 'planting', detail: 'Set out 6–8 wks before first frost' },
    { id: 'aug-03', label: 'Direct sow fall turnips, spinach, arugula',          category: 'planting' },
    { id: 'aug-04', label: 'Process the tomato glut: salsa, sauce, whole canned', category: 'preservation' },
    { id: 'aug-05', label: 'Prepare root cellar: clean, check humidity & temp',  category: 'storage',       detail: 'Target: 32–40°F, 90–95% humidity for most root crops' },
    { id: 'aug-06', label: 'Update the ledger with mid-season harvest data',     category: 'planning' },
  ],
  9: [
    { id: 'sep-01', label: 'Harvest winter squash & pumpkins before first frost',category: 'harvest',       detail: 'Cure 10–14 days at 80–85°F to harden skin' },
    { id: 'sep-02', label: 'Dig potatoes after tops die back',                   category: 'harvest' },
    { id: 'sep-03', label: 'Final tomato processing push, green tomatoes to relish', category: 'preservation' },
    { id: 'sep-04', label: 'Harvest and braid onions and garlic',                category: 'storage' },
    { id: 'sep-05', label: 'Plant garlic cloves for next season',                category: 'planting',      detail: 'Plant 4–6 wks before ground freeze' },
    { id: 'sep-06', label: 'Begin moving root crops into root cellar',           category: 'storage' },
  ],
  10: [
    { id: 'oct-01', label: 'Apply frost protection for late crops (row cover, cold frames)', category: 'planting' },
    { id: 'oct-02', label: 'Final harvest before killing frost',                 category: 'harvest',       detail: 'Peppers, eggplant, tender herbs. Bring in at 36°F' },
    { id: 'oct-03', label: 'Make apple/pear cider or dry fruit',                category: 'preservation' },
    { id: 'oct-04', label: 'Full food inventory audit, count days of autonomy',  category: 'planning',      detail: 'Compare against the three clocks' },
    { id: 'oct-05', label: 'Drain and store drip irrigation lines',             category: 'water' },
    { id: 'oct-06', label: 'Winterize water barrels, insulate or drain if freezing', category: 'water' },
  ],
  11: [
    { id: 'nov-01', label: 'Final root crop harvest, parsnips and carrots sweeten after frost', category: 'harvest' },
    { id: 'nov-02', label: 'Store root crops in root cellar or sand boxes',     category: 'storage' },
    { id: 'nov-03', label: 'Process leftover herbs, dry or freeze in oil',      category: 'preservation' },
    { id: 'nov-04', label: 'Close and clean garden beds, add a compost layer',  category: 'planning' },
    { id: 'nov-05', label: 'Review season results, what to plant more or less of', category: 'planning' },
    { id: 'nov-06', label: 'Battery bank maintenance, equalization charge',     category: 'energy' },
  ],
  12: [
    { id: 'dec-01', label: 'Root cellar check, remove any spoiling produce',    category: 'storage',       detail: 'One bad potato can spoil the lot. Check weekly' },
    { id: 'dec-02', label: 'Inventory all stored food, update the ledger',      category: 'planning' },
    { id: 'dec-03', label: 'Order seeds for next year, caloric density first',  category: 'seeds' },
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
    <>
      <div className="print:hidden">
        <DrawerBand
          drawer="The month's chores"
          title={`${MONTH_NAMES[currentMonth - 1]}'s chores`}
          sub={`${doneCount} of ${currentTasks.length} checked off. The list turns over on the first of the month.`}
          right={
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 border-2 border-ink bg-paper font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-kraft transition-colors"
            >
              Print the list
            </button>
          }
        />
      </div>

      {/* Print header (hidden on screen) */}
      <div className="hidden print:block mb-6 px-4">
        <h1 className="text-2xl font-bold font-mono uppercase">
          Homesteader Labs · Resilience Checklist
        </h1>
        <p className="text-sm font-mono mt-1">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
          {frostDates ? ` · Last frost: ${frostDates.lastSpringFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · First frost: ${frostDates.firstFallFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
        </p>
      </div>

      <section className="max-w-3xl mx-auto px-4 pt-10 pb-16 space-y-6">

        {/* Frost proximity alerts */}
        {lastFrostAlert && (
          <div className="border-2 border-marker bg-paper px-4 py-3 flex items-center gap-3 print:border-black print:text-black">
            <AlertTriangle size={14} className="text-marker shrink-0" />
            <p className="text-[0.92rem] leading-snug text-ink/85">
              {lastFrostAlert.type === 'last'
                ? <>Last spring frost in about <strong className="text-marker">{lastFrostAlert.days} days</strong>. The transplant window is opening.</>
                : <>Last spring frost passed <strong className="text-marker">{lastFrostAlert.days} day{lastFrostAlert.days !== 1 ? 's' : ''} ago</strong>. Safe to transplant.</>
              }
            </p>
          </div>
        )}

        {firstFrostAlert && (
          <div className="border-2 border-slateblue bg-paper px-4 py-3 flex items-center gap-3 print:border-black print:text-black">
            <AlertTriangle size={14} className="text-slateblue shrink-0" />
            <p className="text-[0.92rem] leading-snug text-ink/85">
              First fall frost in about{' '}
              <strong className="text-slateblue">{firstFrostAlert.days} days</strong>.
              Protect the tender crops now.
            </p>
          </div>
        )}

        {/* Current month tasks */}
        <div className="card-paper grain print:border print:border-black print:bg-transparent">
          <div className="border-b-2 border-ink px-5 py-2.5 flex items-center justify-between bg-manila relative z-[2]">
            <h2 className="font-display uppercase text-lg">{MONTH_NAMES[currentMonth - 1]}</h2>
            <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
              {doneCount}/{currentTasks.length} done
            </span>
          </div>

          {/* Progress bar */}
          <div className="mx-5 mt-4 h-3 border-2 border-ink bg-paper relative z-[2] print:hidden">
            <div
              className="h-full bg-moss/60 transition-all duration-500"
              style={{ width: `${currentTasks.length > 0 ? (doneCount / currentTasks.length) * 100 : 0}%` }}
            />
          </div>

          <ul className="px-5 py-4 space-y-3.5 relative z-[2] print:space-y-3">
            {currentTasks.map(task => (
              <li
                key={task.id}
                onClick={() => toggle(task.id)}
                className="flex items-start cursor-pointer group print:cursor-default"
              >
                <span className="field-checkbox mt-0.5 relative shrink-0 print:border-black">
                  {checked[task.id] && (
                    <span className="absolute -inset-1 font-hand font-bold text-marker text-2xl leading-none print:hidden">✓</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[1rem] leading-snug ${checked[task.id] ? 'text-ink/55 line-through decoration-marker/60 print:no-underline print:text-black' : ''}`}>
                    {task.label}
                    <span className={`ml-2 font-mono text-[0.6rem] uppercase tracking-widest align-middle ${CATEGORY_COLORS[task.category]} print:text-black`}>
                      {task.category}
                    </span>
                  </span>
                  {task.detail && (
                    <span className="block text-[0.85rem] text-ink/60 leading-snug mt-0.5 print:opacity-70">
                      {task.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next month preview (read-only) */}
        <div className="border-2 border-dashed border-ink/40 p-5 print:hidden">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/55 mb-3">
            On deck: {MONTH_NAMES[nextMonth - 1]}
          </p>
          <ul className="space-y-2">
            {nextTasks.slice(0, 3).map(task => (
              <li key={task.id} className="flex items-start gap-3 text-[0.92rem] text-ink/60 leading-snug">
                <span className="field-checkbox mt-0.5 shrink-0 opacity-50" />
                {task.label}
              </li>
            ))}
          </ul>
          {nextTasks.length > 3 && (
            <p className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/45 mt-2 pl-8">
              and {nextTasks.length - 3} more when the page turns
            </p>
          )}
        </div>

        {!frostDates && (
          <p className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50 text-center print:hidden">
            Set your ZIP in the{' '}
            <Link href="/tools/planting-calendar/" className="underline underline-offset-4 hover:text-marker">
              planting calendar
            </Link>
            {' '}to turn on the frost alerts.
          </p>
        )}
      </section>
    </>
  );
}
