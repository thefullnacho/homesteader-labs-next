"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stamp } from "@/components/field/kit";
import { useFieldStation } from "@/app/context/FieldStationContext";

/* The four verdicts the planting calendar hands back for the next fortnight.
   Described here, not computed: the zone normals roll to next year's season
   from October, so a live verdict on this page needs its own year handling. */
const verdicts = [
  { v: "Start inside", tone: "text-slateblue", what: "Tray sowings due, with dates." },
  { v: "Sow now", tone: "text-moss", what: "What goes in the ground outside." },
  { v: "Harvest", tone: "text-marker", what: "What comes ready." },
  { v: "Last call", tone: "text-rust", what: "The doors closing before your frost." },
];

/** The planting calendar's front door on the homepage. Anchoring the ZIP here
 *  sets the same frost dates the calendar reads, so it opens already set. */
export default function PlantBanner() {
  const inputId = useId();
  const router = useRouter();
  const { frostDates, frostLoading, frostError, lookupFrostDates } = useFieldStation();
  const [zip, setZip] = useState("");
  const [invalid, setInvalid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = zip.trim() || frostDates?.zipCode || "";
    if (!/^\d{5}$/.test(value)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    const result = await lookupFrostDates(value);
    if (result) router.push("/tools/planting-calendar/");
  };

  const message = invalid ? "That needs to be a 5-digit ZIP code." : frostError;

  return (
    <section className="bg-ink text-paper grain border-y-2 border-ink" aria-labelledby="plant-banner-heading">
      <div className="relative z-[2] max-w-6xl mx-auto px-4 py-12 md:py-14 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div className="min-w-0">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-marker">
            Before you go outside
          </p>
          <h2
            id="plant-banner-heading"
            className="font-display uppercase text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-tight mt-3 text-balance"
          >
            What can you still plant this week?
          </h2>
          <form onSubmit={handleSubmit} className="mt-7 flex max-w-md" noValidate>
            <label htmlFor={inputId} className="sr-only">ZIP code</label>
            <input
              id={inputId}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder={frostDates?.zipCode ?? "ZIP code"}
              aria-describedby={`${inputId}-note`}
              aria-invalid={invalid || undefined}
              className="min-w-0 flex-1 bg-paper text-ink font-display text-2xl tracking-wider px-4 py-2.5 border-2 border-paper placeholder:text-ink/35 focus:outline-none focus:border-marker"
            />
            <button
              type="submit"
              disabled={frostLoading}
              className="bg-marker text-ink border-2 border-marker px-4 font-mono text-[0.74rem] font-semibold uppercase tracking-wider hover:bg-paper hover:border-paper transition-colors disabled:opacity-70"
            >
              {frostLoading ? "Looking…" : "Check my dates"}
            </button>
          </form>
          <p id={`${inputId}-note`} className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-paper/60" aria-live="polite">
            {message ?? "Free · no account · your frost dates, not a national average"}
          </p>
        </div>

        <div className="min-w-0 bg-manila text-ink border border-ink/70 shadow-[5px_5px_0_#e4571f]">
          <div className="flex justify-between gap-3 px-4 py-2.5 border-b-2 border-ink font-mono text-[0.64rem] uppercase tracking-[0.14em]">
            <span>What you get back</span>
            <span className="text-ink/60">Your next two weeks</span>
          </div>
          {verdicts.map(({ v, tone, what }, i) => (
            <div
              key={v}
              className="grid grid-cols-[8.5rem_1fr] items-center gap-3 px-4 py-3 border-b border-dotted border-ink/30"
            >
              <Stamp color={tone} rotate={i % 2 ? "1.2deg" : "-1.5deg"} className="justify-self-start">
                {v}
              </Stamp>
              <span className="text-[1.02rem] leading-snug">{what}</span>
            </div>
          ))}
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-2.5 font-mono text-[0.66rem] uppercase tracking-wider">
            <span className="text-ink/60">Also free:</span>
            <span className="flex gap-4">
              <Link href="/tools/weather/" className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker">
                Weather
              </Link>
              <Link href="/tools/caloric-security/" className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker">
                Resilience
              </Link>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
