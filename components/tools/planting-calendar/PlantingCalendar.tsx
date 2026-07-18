"use client";

import { PlantingDate, FrostDates } from "@/lib/tools/planting-calendar/types";
import {
  groupDatesByMonth,
  sortDatesByDate,
} from "@/lib/tools/planting-calendar/plantingCalculations";
import { getCropById } from "@/lib/tools/planting-calendar/crops";
import { CalendarPlus, Printer } from "lucide-react";

interface PlantingCalendarProps {
  dates: PlantingDate[];
  frostDates: FrostDates;
  onEmailCapture: () => void;
  caloricSummary?: {
    crops: { cropName: string; icon: string; quantity: number; totalKcal: number }[];
    totalKcal: number;
    daysOfFood: number;
  } | null;
}

function downloadICS(dates: PlantingDate[], frostDates: FrostDates) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Homesteader Labs//Planting Calendar//EN',
    'CALSCALE:GREGORIAN',
  ];

  dates.forEach((d, idx) => {
    const start = new Date(d.date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `hl-plant-${d.cropId}-${d.action}-${idx}@homesteaderlabs`;
    const summary = `${d.cropName}: ${d.action.replace(/-/g, ' ')}${d.successionNumber ? ` (round ${d.successionNumber})` : ''}`;
    const description = d.notes?.join('; ') ?? '';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${start}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planting-calendar-${frostDates.zipCode}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

const ACTION_LABEL: Record<PlantingDate["action"], string> = {
  "start-indoors": "start inside",
  transplant: "plant out",
  "direct-sow": "sow",
  harvest: "harvest",
};

const ACTION_TONE: Record<PlantingDate["action"], string> = {
  "start-indoors": "text-slateblue",
  transplant: "text-moss",
  "direct-sow": "text-moss",
  harvest: "text-marker",
};

export default function PlantingCalendar({
  dates,
  frostDates,
  onEmailCapture,
  caloricSummary,
}: PlantingCalendarProps) {
  const sortedDates = sortDatesByDate(dates);
  const groupedByMonth = groupDatesByMonth(sortedDates);

  const months = Array.from(groupedByMonth.entries()).sort((a, b) => {
    const dateA = a[1][0]?.date || new Date();
    const dateB = b[1][0]?.date || new Date();
    return dateA.getTime() - dateB.getTime();
  });

  if (dates.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start print:block">
      {/* The ledger */}
      <div className="card-paper grain print:border-0 print:shadow-none">
        <div className="ruled px-5 py-4 relative z-[2]">
          {months.map(([month, monthDates]) => (
            <div key={month} className="mb-6 last:mb-0 print:break-inside-avoid">
              <p className="font-display uppercase text-lg border-b-2 border-ink pb-1 mb-2">
                {month}
              </p>
              <div>
                {monthDates.map((date, idx) => {
                  const crop = getCropById(date.cropId);
                  return (
                    <div
                      key={`${date.cropId}-${date.action}-${idx}`}
                      className={`flex items-baseline gap-3 py-1.5 border-b border-dotted border-ink/30 last:border-b-0 ${
                        date.completed ? "opacity-50" : ""
                      }`}
                    >
                      <span className="font-mono text-[0.72rem] font-bold w-14 shrink-0">
                        {new Date(date.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span
                        className={`font-mono text-[0.66rem] font-bold uppercase tracking-wider w-24 shrink-0 ${ACTION_TONE[date.action]}`}
                      >
                        {date.completed ? "✓ done" : ACTION_LABEL[date.action]}
                      </span>
                      <span className="text-[0.95rem] leading-snug min-w-0">
                        <span className="font-semibold">{crop?.icon} {date.cropName}</span>
                        <span className="text-ink/60"> · {date.varietyName}</span>
                        {date.successionNumber && (
                          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/50">
                            {" "}· round {date.successionNumber}
                          </span>
                        )}
                        {date.lunarPhase && (
                          <span
                            className={`font-mono text-[0.62rem] uppercase tracking-wider ${
                              date.lunarAligned ? "text-moss" : "text-rust"
                            }`}
                          >
                            {" "}· {date.lunarPhase} {date.lunarAligned ? "in phase" : "off phase"}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side rail: what it feeds you + take it with you */}
      <div className="space-y-6 print:hidden">
        {caloricSummary && caloricSummary.totalKcal > 0 && (
          <div className="card-paper grain p-5">
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-3 relative z-[2]">
              <h3 className="font-display uppercase text-lg">What it feeds you</h3>
              <span className="font-mono text-[0.66rem] uppercase tracking-widest text-ink/50">
                est. season yield
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3 relative z-[2]">
              {caloricSummary.daysOfFood >= 1 ? (
                <>
                  <span className="font-display text-4xl">~{caloricSummary.daysOfFood}</span>
                  <span className="font-mono text-[0.72rem] uppercase tracking-wider text-ink/60">
                    days of food at 2,000 kcal
                  </span>
                </>
              ) : (
                <>
                  <span className="font-display text-4xl">{caloricSummary.totalKcal.toLocaleString()}</span>
                  <span className="font-mono text-[0.72rem] uppercase tracking-wider text-ink/60">
                    kcal · under a day at 2,000. Add plants.
                  </span>
                </>
              )}
            </div>
            <div className="relative z-[2]">
              {caloricSummary.crops.map((c) => (
                <div
                  key={c.cropName}
                  className="flex justify-between font-mono text-[0.7rem] py-1 border-b border-dotted border-ink/30 last:border-b-0"
                >
                  <span>
                    {c.icon} {c.cropName} × {c.quantity}
                  </span>
                  <span className="text-ink/70">{c.totalKcal.toLocaleString()} kcal</span>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 relative z-[2]">
              Full picture on the resilience board
            </p>
          </div>
        )}

        <div className="card-paper grain p-5">
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] mb-3 relative z-[2]">
            Take it with you
          </p>
          <div className="flex flex-col gap-2 relative z-[2]">
            <button
              onClick={() => downloadICS(dates, frostDates)}
              className="flex items-center justify-center gap-2 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
            >
              <CalendarPlus size={14} /> Export .ics
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-2.5 border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-kraft transition-colors"
            >
              <Printer size={14} /> Print the ledger
            </button>
            <button
              onClick={onEmailCapture}
              className="flex items-center justify-center gap-2 py-2.5 border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-kraft transition-colors"
            >
              Weekly reminders by email
            </button>
          </div>
          <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 relative z-[2]">
            .ics works with Google, Apple, and Outlook
          </p>
        </div>
      </div>
    </div>
  );
}
