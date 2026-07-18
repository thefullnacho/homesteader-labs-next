"use client";

/* The season as a chart-ledger: one row per crop, slate for indoors,
   moss for in-ground, marker for the eating window. Frost dates and
   today are vertical rules. Succession sowings are tick marks. */

export interface GanttRow {
  id: string;
  name: string;
  datesLine: string;
  segs: { a: Date; b: Date; t: "i" | "g" | "h" }[];
  ticks: Date[];
}

interface SeasonGanttProps {
  rows: GanttRow[];
  lastFrost: Date;
  firstFrost: Date;
  today: Date;
}

const SEG_CLS = { i: "bg-slateblue/60", g: "bg-moss/50", h: "bg-marker/70" };

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function SeasonGantt({ rows, lastFrost, firstFrost, today }: SeasonGanttProps) {
  // Chart range: first of the earliest month touched, through the month after the last date
  const allDates = rows.flatMap((r) => r.segs.flatMap((s) => [s.a, s.b])).concat([lastFrost, firstFrost, today]);
  const min = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const max = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const t0 = new Date(min.getFullYear(), min.getMonth(), 1).getTime();
  const t1 = new Date(max.getFullYear(), max.getMonth() + 1, 1).getTime();
  const span = t1 - t0;

  const x = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - t0) / span) * 100));

  // Month labels across the range
  const months: { label: string; date: Date }[] = [];
  for (let m = new Date(t0); m.getTime() < t1; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    months.push({ label: m.toLocaleDateString("en-US", { month: "short" }), date: new Date(m) });
  }

  const todayVisible = today.getTime() >= t0 && today.getTime() <= t1;

  return (
    <div className="card-paper grain overflow-hidden">
      <div className="overflow-x-auto relative z-[2]">
        <div className="flex px-4 pt-3 min-w-[640px]">
          {/* label column */}
          <div className="w-44 shrink-0 pr-3">
            <div className="h-7" />
            {rows.map((r) => (
              <div key={r.id} className="h-14 border-b border-ink/15 flex flex-col justify-center">
                <span className="font-mono text-[0.74rem] font-bold uppercase tracking-wide leading-tight">
                  {r.name}
                </span>
                <span className="font-mono text-[0.58rem] text-ink/55 leading-tight">{r.datesLine}</span>
              </div>
            ))}
            <div className="h-8" />
          </div>

          {/* chart area */}
          <div className="relative flex-1">
            {/* month header */}
            <div className="h-7 relative border-b-2 border-ink">
              {months.map((m) => (
                <span
                  key={`${m.date.getFullYear()}-${m.date.getMonth()}`}
                  className="absolute font-mono text-[0.6rem] uppercase tracking-widest text-ink/55"
                  style={{ left: `${x(m.date)}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* frost rules + today */}
            <div className="absolute top-7 bottom-0 pointer-events-none" style={{ left: `${x(lastFrost)}%` }}>
              <div className="h-full border-l-2 border-dashed border-slateblue/70" />
              <span
                className="absolute top-1 -translate-x-1/2 font-mono text-[0.56rem] uppercase tracking-wide text-slateblue whitespace-nowrap bg-paper px-0.5"
                title={fmt(lastFrost)}
              >
                frost out
              </span>
            </div>
            <div className="absolute top-7 bottom-0 pointer-events-none" style={{ left: `${x(firstFrost)}%` }}>
              <div className="h-full border-l-2 border-dashed border-slateblue/70" />
              <span
                className="absolute top-1 -translate-x-1/2 font-mono text-[0.56rem] uppercase tracking-wide text-slateblue whitespace-nowrap bg-paper px-0.5"
                title={fmt(firstFrost)}
              >
                frost in
              </span>
            </div>
            {todayVisible && (
              <div className="absolute top-7 bottom-0 pointer-events-none" style={{ left: `${x(today)}%` }}>
                <div className="h-full w-0.5 bg-marker/80" />
                <span className="absolute bottom-1 -translate-x-1/2 font-mono text-[0.56rem] uppercase tracking-wide text-marker whitespace-nowrap bg-paper px-0.5 font-bold">
                  today
                </span>
              </div>
            )}

            {/* rows */}
            {rows.map((r) => (
              <div key={r.id} className="h-14 relative border-b border-ink/15">
                {r.segs.map((s, i) => (
                  <div
                    key={i}
                    className={`absolute h-4 top-1/2 -translate-y-1/2 border border-ink/50 ${SEG_CLS[s.t]}`}
                    style={{ left: `${x(s.a)}%`, width: `${Math.max(1.2, x(s.b) - x(s.a))}%` }}
                    title={`${fmt(s.a)} – ${fmt(s.b)}`}
                  />
                ))}
                {r.ticks.map((d) => (
                  <span
                    key={d.getTime()}
                    className="absolute w-0.5 h-6 top-1/2 -translate-y-1/2 bg-ink/70"
                    style={{ left: `${x(d)}%` }}
                    title={`sow again ${fmt(d)}`}
                  />
                ))}
              </div>
            ))}
            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
