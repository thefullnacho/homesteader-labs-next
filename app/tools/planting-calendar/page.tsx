"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import LocationSetup from "@/components/tools/planting-calendar/LocationSetup";
import CropSelector from "@/components/tools/planting-calendar/CropSelector";
import PlantingCalendar from "@/components/tools/planting-calendar/PlantingCalendar";
import PlantingEmailCapture from "@/components/tools/planting-calendar/PlantingEmailCapture";
import SeasonGantt, { GanttRow } from "@/components/tools/planting-calendar/SeasonGantt";
import useFrostDates from "./hooks/useFrostDates";
import SeasonExtensionSelector, { SeasonExtension } from "@/components/tools/planting-calendar/SeasonExtensionSelector";
import ContextualRequisition from "@/components/tools/ContextualRequisition";
import { SelectedCrop, PlantingDate, FrostDates } from "@/lib/tools/planting-calendar/types";
import { getCropById } from "@/lib/tools/planting-calendar/crops";
import { calculateCropYield } from "@/lib/caloric-security/yieldCalculations";
import { calculateCropSchedule, canStillPlant } from "@/lib/tools/planting-calendar/plantingCalculations";
import { SectionHead, Stamp } from "@/components/field/kit";
import FaqAccordion from "@/components/ui/FaqAccordion";

// SEO FAQ, also serialized as FAQPage JSON-LD for rich results
const FAQS: { q: string; a: string }[] = [
  {
    q: "When should I plant tomatoes?",
    a: "Tomatoes need 6 to 8 weeks indoors before transplant, and transplant goes out 1 to 2 weeks after your last frost. If your last frost is May 1, that's seeds around March 6 and transplants around May 15. The tool above does this math for every crop you select.",
  },
  {
    q: "What's the difference between \"last frost\" and \"frost-free\"?",
    a: "Last frost is the average date of the last spring frost in your area, and there's still a ~50% chance of frost on that exact day. Frost-free is a high-confidence date (90%+) that frost won't return. Wait for frost-free with cold-sensitive transplants like tomatoes and peppers.",
  },
  {
    q: "How is this different from the back of a seed packet?",
    a: "Seed packets give you generic months. This calendar uses your ZIP-derived frost date as the anchor, so \"plant after last frost\" becomes a specific date for your garden. It also handles succession, re-sowing every 2 to 3 weeks for continuous harvest, which packets don't.",
  },
  {
    q: "Does it work for short growing seasons?",
    a: "Yes. The calendar flags crops that can't complete their lifecycle in your frost-free window. If your season is too short for, say, watermelon, you'll see that in the output rather than getting an over-optimistic schedule.",
  },
  {
    q: "Can I save my schedule?",
    a: "Yes. Export to .ics, which works with Google Calendar, Apple Calendar, and Outlook. Your crop selections and preferences also persist in your browser so the next visit picks up where you left off.",
  },
];

/* ── display helpers ─────────────────────────────────────────── */

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

type Tone = "text-moss" | "text-marker" | "text-rust" | "text-slateblue";

interface FortnightCard {
  v: string;
  tone: Tone;
  hex: string;
  crop: string;
  why: string;
  quiet?: boolean;
}

function nameList(names: string[]): string {
  const unique = Array.from(new Set(names));
  if (unique.length <= 3) return unique.join(" · ");
  return `${unique.slice(0, 3).join(" · ")} +${unique.length - 3} more`;
}

/* The four fortnight verdicts, read off the computed schedule */
function buildFortnight(
  plantingDates: PlantingDate[],
  selectedCrops: SelectedCrop[],
  frost: FrostDates,
  today: Date
): FortnightCard[] {
  const end = new Date(today.getTime() + 14 * 86400000);
  const inWindow = (d: Date) => d >= today && d < end;

  const indoor = plantingDates.filter((d) => d.action === "start-indoors" && !d.completed && inWindow(d.date));
  const sow = plantingDates.filter(
    (d) => (d.action === "direct-sow" || d.action === "transplant") && !d.completed && inWindow(d.date)
  );
  const harvest = plantingDates.filter((d) => d.action === "harvest" && inWindow(d.date));

  // Doors closing: last viable sowing lands inside the fortnight
  const lastCalls: { name: string; lastChance: Date }[] = [];
  selectedCrops.forEach((sc) => {
    const crop = getCropById(sc.cropId);
    const variety = crop?.varieties.find((v) => v.id === sc.varietyId);
    if (!crop || !variety) return;
    const check = canStillPlant(crop, variety, frost, today);
    if (check.canPlant && check.lastChance && inWindow(check.lastChance)) {
      lastCalls.push({ name: crop.name, lastChance: check.lastChance });
    }
  });
  lastCalls.sort((a, b) => a.lastChance.getTime() - b.lastChance.getTime());

  const first = (list: PlantingDate[]) => list.reduce((a, b) => (a.date <= b.date ? a : b));

  return [
    indoor.length > 0
      ? {
          v: "START INSIDE",
          tone: "text-slateblue",
          hex: "#3f5d6b",
          crop: nameList(indoor.map((d) => d.cropName)),
          why: `${indoor.length} tray sowing${indoor.length === 1 ? "" : "s"} due. First: ${first(indoor).cropName} on ${fmt(first(indoor).date)}.`,
        }
      : {
          v: "START INSIDE",
          tone: "text-slateblue",
          hex: "#3f5d6b",
          crop: "Nothing due",
          why: "No tray sowings on the sheet this fortnight.",
          quiet: true,
        },
    sow.length > 0
      ? {
          v: "SOW NOW",
          tone: "text-moss",
          hex: "#5c6b3c",
          crop: nameList(sow.map((d) => d.cropName)),
          why: `${sow.length} outdoor job${sow.length === 1 ? "" : "s"} this fortnight. First: ${first(sow).cropName} on ${fmt(first(sow).date)}.`,
        }
      : {
          v: "SOW NOW",
          tone: "text-moss",
          hex: "#5c6b3c",
          crop: "Nothing due",
          why: "No outdoor sowings due. The drawer rests.",
          quiet: true,
        },
    harvest.length > 0
      ? {
          v: "HARVEST",
          tone: "text-marker",
          hex: "#e4571f",
          crop: nameList(harvest.map((d) => d.cropName)),
          why: `First pickings from ${fmt(first(harvest).date)}. Check daily once they start.`,
        }
      : {
          v: "HARVEST",
          tone: "text-marker",
          hex: "#e4571f",
          crop: "Nothing ready",
          why: "Nothing comes ready inside two weeks.",
          quiet: true,
        },
    lastCalls.length > 0
      ? {
          v: "LAST CALL",
          tone: "text-rust",
          hex: "#a8442a",
          crop: nameList(lastCalls.map((c) => c.name)),
          why: `The door closes ${fmt(lastCalls[0].lastChance)} to beat the ${fmt(frost.firstFallFrost)} frost. Sow or skip.`,
        }
      : {
          v: "LAST CALL",
          tone: "text-rust",
          hex: "#a8442a",
          crop: "No doors closing",
          why: "Nothing runs out of season inside two weeks.",
          quiet: true,
        },
  ];
}

/* Gantt rows from the computed schedule: main segs + succession ticks */
function buildGanttRows(
  plantingDates: PlantingDate[],
  selectedCrops: SelectedCrop[],
  firstFrost: Date
): GanttRow[] {
  const rows: GanttRow[] = [];

  selectedCrops.forEach((sc) => {
    const crop = getCropById(sc.cropId);
    if (!crop) return;
    const mine = plantingDates.filter((d) => d.cropId === sc.cropId);
    if (mine.length === 0) return;

    const main = mine.filter((d) => !d.successionNumber);
    const si = main.find((d) => d.action === "start-indoors");
    const plant = main.find((d) => d.action === "transplant") ?? main.find((d) => d.action === "direct-sow");
    const hv = main.find((d) => d.action === "harvest");
    if (!plant || !hv) return;

    const harvestEnd = new Date(Math.min(firstFrost.getTime(), hv.date.getTime() + 21 * 86400000));
    const segs: GanttRow["segs"] = [];
    if (si) segs.push({ a: si.date, b: plant.date, t: "i" });
    segs.push({ a: plant.date, b: hv.date, t: "g" });
    segs.push({ a: hv.date, b: harvestEnd, t: "h" });

    const ticks = mine
      .filter((d) => d.successionNumber && (d.action === "direct-sow" || d.action === "transplant"))
      .map((d) => d.date);

    const datesLine = si
      ? `start ${fmt(si.date)} · out ${fmt(plant.date)} · eat ${fmt(hv.date)}`
      : `sow ${fmt(plant.date)} · eat ${fmt(hv.date)}${ticks.length > 0 ? ` · ${ticks.length + 1} sowings` : ""}`;

    rows.push({ id: crop.id, name: crop.name, datesLine, segs, ticks });
  });

  return rows;
}

export default function PlantingCalendarPage() {
  const { frostDates, loading, error, lookupFrostDates } = useFrostDates();
  const [selectedCrops, setSelectedCrops] = useState<SelectedCrop[]>([]);
  const [seasonExtension, setSeasonExtension] = useState<SeasonExtension>("none");
  const [lunarSync, setLunarSync] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [hiddenCrops, setHiddenCrops] = useState<Set<string>>(new Set());
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmailError, setIsEmailError] = useState(false);

  const { plantingDates, omittedCrops, adjustedFrostDates } = useMemo(() => {
    if (!frostDates) return { plantingDates: [], omittedCrops: [], adjustedFrostDates: null };

    // Apply season extension
    const extensionDays = {
      none: 0,
      "row-cover": 14,
      "cold-frame": 28,
      greenhouse: 42,
    }[seasonExtension];

    // Experience buffer: beginners plant later, because nobody plants on the optimal day
    const experienceBufferDays = { beginner: 7, intermediate: 3, advanced: 0 }[experienceLevel];

    const adjustedFrost = {
      ...frostDates,
      lastSpringFrost: new Date(frostDates.lastSpringFrost.getTime()
        - extensionDays * 86400000
        + experienceBufferDays * 86400000),
      firstFallFrost: new Date(frostDates.firstFallFrost.getTime()
        + extensionDays * 86400000
        - experienceBufferDays * 86400000),
      frostFreeDays: frostDates.frostFreeDays + (extensionDays * 2) - (experienceBufferDays * 2),
    };

    const dates: PlantingDate[] = [];
    const omitted: ReturnType<typeof getCropById>[] = [];

    selectedCrops.forEach(selectedCrop => {
      const crop = getCropById(selectedCrop.cropId);
      if (crop) {
        const variety = crop.varieties.find(v => v.id === selectedCrop.varietyId);
        if (variety) {
          const schedule = calculateCropSchedule(crop, variety, selectedCrop, adjustedFrost, lunarSync);
          if (schedule.length === 0) {
            omitted.push(crop);
          } else {
            dates.push(...schedule);
          }
        }
      }
    });

    return { plantingDates: dates, omittedCrops: omitted, adjustedFrostDates: adjustedFrost };
  }, [selectedCrops, frostDates, seasonExtension, lunarSync, experienceLevel]);

  // Persist crop selection to localStorage so caloric-security can import it
  useEffect(() => {
    if (selectedCrops.length > 0) {
      localStorage.setItem('hl_planting_selection', JSON.stringify({
        crops: selectedCrops,
        savedAt: Date.now(),
      }));
    }
  }, [selectedCrops]);

  // Auto-show email capture once per session after first schedule is generated
  useEffect(() => {
    if (plantingDates.length > 0 && !sessionStorage.getItem('planting_email_shown')) {
      const t = setTimeout(() => {
        setShowEmailCapture(true);
        sessionStorage.setItem('planting_email_shown', 'true');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [plantingDates.length]);

  const handleEmailSubmit = useCallback(async (email: string) => {
    setIsSubmitting(true);
    setIsEmailError(false);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "planting-reminders",
          metadata: {
            zip: frostDates?.zipCode,
            crops: selectedCrops
              .map(sc => getCropById(sc.cropId)?.name)
              .filter(Boolean)
              .slice(0, 5),
            frostDate: frostDates?.lastSpringFrost.toISOString().split('T')[0],
            experienceLevel,
          },
        }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setIsSuccess(true);
      setTimeout(() => {
        setShowEmailCapture(false);
        setIsSuccess(false);
      }, 3000);
    } catch {
      setIsEmailError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [frostDates, selectedCrops, experienceLevel]);

  const caloricSummary = useMemo(() => {
    if (!frostDates) return null;

    const crops = selectedCrops
      .map(sc => {
        const crop = getCropById(sc.cropId);
        if (!crop) return null;
        const quantity = sc.quantity ?? 1;
        const result = calculateCropYield(crop, quantity, 1.0);
        if (!result) return null;
        return {
          cropName: crop.name,
          icon: crop.icon,
          quantity,
          totalKcal: Math.round(result.totalKcal),
        };
      })
      .filter(Boolean) as { cropName: string; icon: string; quantity: number; totalKcal: number }[];

    const totalKcal = crops.reduce((sum, c) => sum + c.totalKcal, 0);
    const daysOfFood = Math.round(totalKcal / 2000);

    return { crops, totalKcal, daysOfFood };
  }, [selectedCrops, frostDates]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const fortnight = useMemo(
    () =>
      adjustedFrostDates && plantingDates.length > 0
        ? buildFortnight(plantingDates, selectedCrops, adjustedFrostDates, today)
        : null,
    [plantingDates, selectedCrops, adjustedFrostDates, today]
  );

  const ganttRows = useMemo(
    () =>
      adjustedFrostDates && plantingDates.length > 0
        ? buildGanttRows(plantingDates, selectedCrops, adjustedFrostDates.firstFallFrost).filter(
            (r) => !hiddenCrops.has(r.id)
          )
        : [],
    [plantingDates, selectedCrops, adjustedFrostDates, hiddenCrops]
  );

  const toggleHidden = (id: string) =>
    setHiddenCrops((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hasCalendarData = frostDates && selectedCrops.length > 0;

  // The worked example in §5: prefer a crop with an indoor start
  const mathExample = useMemo(() => {
    if (!adjustedFrostDates || selectedCrops.length === 0) return null;
    const pick =
      selectedCrops.map((sc) => getCropById(sc.cropId)).find((c) => c && c.startIndoors !== null) ??
      getCropById(selectedCrops[0].cropId);
    if (!pick) return null;
    const variety =
      pick.varieties.find((v) => v.id === selectedCrops.find((sc) => sc.cropId === pick.id)?.varietyId) ??
      pick.varieties[0];
    const lf = adjustedFrostDates.lastSpringFrost;
    const ff = adjustedFrostDates.firstFallFrost;
    const dtm = variety.daysToMaturity || pick.daysToMaturity;
    const plantOffset = pick.directSow ?? pick.transplant ?? 0;
    const plantDate = new Date(lf.getTime() + plantOffset * 86400000);
    return {
      crop: pick,
      dtm,
      plantOffset,
      plantDate,
      harvestDate: new Date(plantDate.getTime() + dtm * 86400000),
      lastSow: new Date(ff.getTime() - dtm * 86400000),
      indoorStart:
        pick.startIndoors !== null ? new Date(lf.getTime() - pick.startIndoors * 86400000) : null,
    };
  }, [adjustedFrostDates, selectedCrops]);

  return (
    <>
      {/* ── Header band ─────────────────────────────────────── */}
      <section className="bg-kraft grain border-b-2 border-ink relative print:hidden">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/tools/" className="hover:text-marker underline underline-offset-4">
              Workbench
            </Link>
            <span>/</span>
            <span>No. 02 · Planting Calendar</span>
            <span className="ml-auto">Frost data: NOAA · 50% probability</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
                Two frost dates. Everything else is arithmetic.
              </h1>
              <p className="mt-4 text-lg md:text-xl max-w-2xl leading-relaxed text-ink/85 italic">
                Most calendars say &quot;plant in May.&quot; This one works backward
                from <em>your</em> last frost, so every start, transplant, and
                harvest date is yours, not a seed packet&apos;s average.
              </p>
              <div className="mt-5">
                <LocationSetup
                  onLocationSet={() => {}}
                  loading={loading}
                  error={error}
                  onLookup={lookupFrostDates}
                  currentZip={frostDates?.zipCode}
                />
              </div>
            </div>

            {/* The anchors */}
            {frostDates && (
              <div className="card-paper grain px-5 py-4">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-ink/55 mb-2 relative z-[2]">
                  The anchors · ZIP {frostDates.zipCode}
                  {frostDates.growingZone ? ` · zone ${frostDates.growingZone}` : ""}
                </p>
                <div className="flex items-baseline gap-5 relative z-[2]">
                  <span>
                    <span className="font-display text-3xl">{fmt(frostDates.lastSpringFrost)}</span>
                    <span className="block font-mono text-[0.62rem] uppercase tracking-widest text-ink/55 mt-0.5">
                      last spring frost
                    </span>
                  </span>
                  <span className="font-display text-2xl text-ink/30">→</span>
                  <span>
                    <span className="font-display text-3xl">{fmt(frostDates.firstFallFrost)}</span>
                    <span className="block font-mono text-[0.62rem] uppercase tracking-widest text-ink/55 mt-0.5">
                      first fall frost
                    </span>
                  </span>
                  <span className="border-l-2 border-ink/30 pl-5">
                    <span className="font-display text-3xl text-moss">{frostDates.frostFreeDays}</span>
                    <span className="block font-mono text-[0.62rem] uppercase tracking-widest text-ink/55 mt-0.5">
                      growing days
                    </span>
                  </span>
                </div>
                <p className="mt-2.5 font-mono text-[0.62rem] text-ink/50 relative z-[2]">
                  50% probability. Frost lands later one year in two, so tender crops get a buffer.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── No ZIP yet ──────────────────────────────────────── */}
      {!frostDates && (
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-16">
          <div className="border-2 border-dashed border-ink/40 p-10 text-center">
            <p className="font-display uppercase text-xl mb-2">Anchor the season first</p>
            <p className="text-ink/70 max-w-md mx-auto">
              Enter your ZIP above. Two frost dates come back, and the whole
              calendar is arithmetic on those two numbers.
            </p>
          </div>
        </section>
      )}

      {frostDates && (
        <>
          {/* ── §1 The seed drawer ──────────────────────────── */}
          <section className="max-w-6xl mx-auto px-4 pt-12 print:hidden">
            <SectionHead
              no="§1"
              title="The Seed Drawer"
              right={`${selectedCrops.length} crop${selectedCrops.length === 1 ? "" : "s"} picked · 54 on file`}
            />
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
              <CropSelector
                selectedCrops={selectedCrops}
                onCropsChange={setSelectedCrops}
                frostDates={adjustedFrostDates ?? frostDates}
              />

              <div className="space-y-6">
                <SeasonExtensionSelector extension={seasonExtension} onChange={setSeasonExtension} />

                {/* Buffer control */}
                <div className="card-paper grain p-5">
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] mb-1 relative z-[2]">
                    Planting buffer
                  </p>
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/50 mb-3 relative z-[2]">
                    Nobody plants on the optimal day
                  </p>
                  <div className="grid grid-cols-3 gap-2 relative z-[2]">
                    {(
                      [
                        ["beginner", "+7d safe"],
                        ["intermediate", "+3d"],
                        ["advanced", "exact"],
                      ] as const
                    ).map(([level, label]) => (
                      <button
                        key={level}
                        onClick={() => setExperienceLevel(level)}
                        aria-pressed={experienceLevel === level}
                        className={`py-2 px-1 border-2 border-ink font-mono text-[0.66rem] font-bold uppercase tracking-wider transition-colors ${
                          experienceLevel === level ? "bg-ink text-paper" : "bg-paper hover:bg-kraft"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lunar toggle */}
                <div className="card-paper grain p-5 flex items-center justify-between gap-4">
                  <div className="relative z-[2]">
                    <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em]">
                      Lunar planting
                    </p>
                    <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/50 mt-0.5">
                      Flag sowings against the moon phase
                    </p>
                  </div>
                  <button
                    onClick={() => setLunarSync(!lunarSync)}
                    aria-pressed={lunarSync}
                    className={`px-3 py-1.5 border-2 border-ink font-mono text-[0.66rem] font-bold uppercase tracking-wider transition-colors relative z-[2] ${
                      lunarSync ? "bg-ink text-paper" : "bg-paper hover:bg-kraft"
                    }`}
                  >
                    {lunarSync ? "On" : "Off"}
                  </button>
                </div>

                {seasonExtension === "row-cover" && (
                  <ContextualRequisition
                    hardwareId="hoop-house-clips-v2"
                    hardwareName="Row-Cover Hoop Brackets"
                    reason="Season Extension Deployment"
                    zone={frostDates.growingZone || "Unknown"}
                    href="/tools/fabrication"
                  />
                )}
              </div>
            </div>
          </section>

          {!hasCalendarData && (
            <section className="max-w-6xl mx-auto px-4 pt-12 pb-16">
              <div className="border-2 border-dashed border-ink/40 p-10 text-center">
                <p className="font-display uppercase text-xl mb-2">Now pick what you&apos;re growing</p>
                <p className="text-ink/70 max-w-md mx-auto">
                  Open the drawer above and the season draws itself: verdicts for
                  this fortnight, the full chart, and a month-by-month ledger.
                </p>
              </div>
            </section>
          )}

          {hasCalendarData && (
            <>
              {/* ── §2 Do this fortnight ────────────────────── */}
              {fortnight && (
                <section className="max-w-6xl mx-auto px-4 pt-14 print:hidden">
                  <SectionHead
                    no="§2"
                    title="Do This Fortnight"
                    right={`${fmt(today)} – ${fmt(new Date(today.getTime() + 14 * 86400000))}`}
                  />
                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {fortnight.map((f) => (
                      <div
                        key={f.v}
                        className={`card-paper grain p-5 border-l-4 ${f.quiet ? "opacity-70" : ""}`}
                        style={{ borderLeftColor: f.hex }}
                      >
                        <p className={`font-display uppercase text-lg ${f.tone} relative z-[2]`}>{f.v}</p>
                        <p className="font-mono text-[0.72rem] uppercase tracking-wider mt-1 relative z-[2]">
                          {f.crop}
                        </p>
                        <p className="mt-3 text-[0.92rem] leading-snug text-ink/80 border-t border-dotted border-ink/40 pt-3 relative z-[2]">
                          {f.why}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── §3 The season, ruled ────────────────────── */}
              <section className="max-w-6xl mx-auto px-4 pt-16 print:hidden">
                <SectionHead
                  no="§3"
                  title="The Season, Ruled"
                  right="slate = indoors · green = in ground · orange = eating"
                />

                {omittedCrops.length > 0 && (
                  <div className="border-2 border-rust border-l-8 bg-paper px-4 py-3 mb-5">
                    <p className="font-mono text-[0.72rem] font-bold uppercase tracking-wider text-rust">
                      Season too short
                    </p>
                    <p className="text-[0.92rem] text-ink/80 mt-1 leading-snug">
                      {frostDates.frostFreeDays} growing days is not enough for{" "}
                      <strong className="font-bold">
                        {omittedCrops.map((c) => c?.name).filter(Boolean).join(", ")}
                      </strong>
                      . Left off the chart rather than lie to you.
                    </p>
                  </div>
                )}

                {/* Seed drawer chips: cross out to hide from the chart */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink/55 mr-1">
                    On the chart:
                  </span>
                  {selectedCrops.map((sc) => {
                    const crop = getCropById(sc.cropId);
                    if (!crop) return null;
                    const active = !hiddenCrops.has(crop.id);
                    return (
                      <button
                        key={crop.id}
                        onClick={() => toggleHidden(crop.id)}
                        aria-pressed={active}
                        className={`font-mono text-[0.68rem] uppercase tracking-wider px-2.5 py-1 border-2 border-ink transition-colors ${
                          active ? "bg-ink text-paper" : "bg-paper text-ink/45 line-through decoration-marker"
                        }`}
                      >
                        {crop.name}
                      </button>
                    );
                  })}
                </div>

                {ganttRows.length > 0 && adjustedFrostDates ? (
                  <SeasonGantt
                    rows={ganttRows}
                    lastFrost={adjustedFrostDates.lastSpringFrost}
                    firstFrost={adjustedFrostDates.firstFallFrost}
                    today={today}
                  />
                ) : (
                  <div className="border-2 border-dashed border-ink/40 p-8 text-center text-ink/60">
                    Everything is crossed out. Un-cross a crop to draw the chart.
                  </div>
                )}

                {/* the one handwritten note on the page */}
                <p className="font-hand font-semibold text-marker text-2xl mt-4 -rotate-1">
                  ✎ nobody remembers fall kale in july. everybody wishes they had in october.
                </p>
              </section>

              {/* ── §4 The ledger, by month ─────────────────── */}
              <section className="max-w-6xl mx-auto px-4 pt-14">
                <SectionHead no="§4" title="The Ledger, By Month" right="print it, nail it to the shed door" />
                <PlantingCalendar
                  dates={plantingDates}
                  frostDates={adjustedFrostDates || frostDates}
                  onEmailCapture={() => setShowEmailCapture(true)}
                  caloricSummary={caloricSummary}
                />
              </section>

              {/* ── §5 The math, shown ──────────────────────── */}
              {mathExample && adjustedFrostDates && (
                <section className="max-w-6xl mx-auto px-4 pt-14 print:hidden">
                  <SectionHead no="§5" title="The Math, Shown" right="no black boxes" />
                  <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
                    <div className="card-paper grain p-6 font-mono text-[0.8rem] leading-loose">
                      <div className="relative z-[2]">
                        <p>
                          <span className="text-ink/50">last spring frost ..............</span>{" "}
                          <strong>{fmt(adjustedFrostDates.lastSpringFrost)}</strong>{" "}
                          <span className="text-ink/45">(NOAA, adjusted)</span>
                        </p>
                        <p>
                          <span className="text-ink/50">first fall frost ...............</span>{" "}
                          <strong>{fmt(adjustedFrostDates.firstFallFrost)}</strong>
                        </p>
                        {mathExample.indoorStart && (
                          <p>
                            <span className="text-ink/50">
                              {mathExample.crop.name.toLowerCase()} start = LFD − {mathExample.crop.startIndoors} d ....
                            </span>{" "}
                            <strong>{fmt(mathExample.indoorStart)}</strong>
                          </p>
                        )}
                        <p>
                          <span className="text-ink/50">
                            {mathExample.crop.name.toLowerCase()} {mathExample.crop.directSow !== null ? "sow" : "out"} = LFD{" "}
                            {mathExample.plantOffset >= 0 ? "+" : "−"} {Math.abs(mathExample.plantOffset)} d ....
                          </span>{" "}
                          <strong>{fmt(mathExample.plantDate)}</strong>
                        </p>
                        <p>
                          <span className="text-ink/50">
                            harvest = plant + {mathExample.dtm} d .....
                          </span>{" "}
                          <strong>{fmt(mathExample.harvestDate)}</strong>
                        </p>
                        <p>
                          <span className="text-ink/50">
                            last sowing = FFD − {mathExample.dtm} d ...
                          </span>{" "}
                          <strong>{fmt(mathExample.lastSow)}</strong>{" "}
                          <span className="text-rust">← the door</span>
                        </p>
                        <p className="pt-2 mt-2 border-t border-dotted border-ink/40 text-ink/60 text-[0.72rem]">
                          Buffer{" "}
                          {experienceLevel === "advanced"
                            ? "OFF: optimal-day planting. Bold of you."
                            : `${experienceLevel === "beginner" ? "+7" : "+3"} days ON: every outdoor date slides, because nobody plants on the optimal day.`}
                        </p>
                        <div className="mt-4 flex gap-2 flex-wrap">
                          <Stamp color="text-moss">Export .ics above</Stamp>
                          <Stamp color="text-slateblue" rotate="1.5deg">
                            54 crops in the full ledger
                          </Stamp>
                        </div>
                      </div>
                    </div>

                    {/* the one tilted aside: no data, just the lesson */}
                    <div className="border-2 border-ink bg-kraft grain p-5 rotate-1">
                      <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2 relative z-[2]">
                        If you remember one thing
                      </p>
                      <p className="font-serif text-lg leading-snug relative z-[2]">
                        You can&apos;t negotiate with the two frost dates. Everything
                        else on this page is arithmetic, and{" "}
                        <span className="hl">arithmetic doesn&apos;t care</span> if you
                        were busy in May.
                      </p>
                      <div className="mt-4 relative z-[2]">
                        <Stamp color="text-rust">Anchored to ZIP {frostDates.zipCode}</Stamp>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* Email Capture Modal */}
      <PlantingEmailCapture
        isOpen={showEmailCapture}
        zipCode={frostDates?.zipCode || ""}
        cropCount={selectedCrops.length}
        onSubmit={handleEmailSubmit}
        onDismiss={() => setShowEmailCapture(false)}
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        isError={isEmailError}
      />

      {/* SEO anchor block: body copy + FAQ targeting the planting-calendar cluster */}
      <section className="max-w-6xl mx-auto px-4 pb-16 print:hidden">
        <div className="max-w-3xl mt-14 pt-8 border-t-2 border-ink">
          <h2 className="font-display uppercase text-xl md:text-2xl mb-4">
            How the Homesteader Labs planting calendar works
          </h2>
          <div className="space-y-4 text-[1.02rem] leading-relaxed text-ink/85">
            <p>
              Most planting calendars give you generic dates: <em>plant tomatoes in May</em>.
              That works if you live in the same climate as whoever wrote the seed packet.
              We built something different.
            </p>
            <p>
              The calendar is anchored to your <strong>last spring frost date</strong>,
              the single most predictive number for when seeds, transplants, and harvest
              windows should land. Enter your ZIP, pick what you want to grow, and the
              schedule recalculates from your real local frost date pulled from NOAA.
              Generic May dates become &quot;start tomatoes indoors March 19, transplant
              May 14, expect first ripe fruit August 1.&quot;
            </p>
            <p>
              It covers <strong>54 vegetables, herbs, and fruits</strong> with
              variety-level detail, supports succession planting at a configurable
              interval, and adjusts for your experience level, adding buffer days for
              beginners who can&apos;t always plant on the optimal day. Export the full
              season to .ics for any calendar app. No account, no email required.
            </p>
          </div>

          <h3 className="font-display uppercase text-base md:text-lg mt-10 mb-4">
            Frequently asked questions
          </h3>
          <FaqAccordion faqs={FAQS} prefix="FAQ" defaultOpen={0} />

          {/* FAQPage JSON-LD, eligible for Google rich results */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQS.map(({ q, a }) => ({
                  "@type": "Question",
                  name: q,
                  acceptedAnswer: { "@type": "Answer", text: a },
                })),
              }),
            }}
          />
        </div>
      </section>
    </>
  );
}
