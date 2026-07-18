"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionHead, Stamp } from "@/components/field/kit";

const parts = [
  {
    name: "Plant tags",
    job: "Readable after a season of sun. Write on them in pencil, reuse them every year.",
    material: "PETG",
    status: "On the bench",
  },
  {
    name: "Hose guides",
    job: "Keep a charged hose out of the beds without staking a fight at every corner.",
    material: "PETG",
    status: "On the bench",
  },
  {
    name: "Hooks",
    job: "Hang tools, feeders, and fence gear where you actually need them.",
    material: "PETG",
    status: "On the bench",
  },
  {
    name: "Row cover clips",
    job: "Pin fabric to hoops through wind it has no business surviving.",
    material: "PETG",
    status: "On the bench",
  },
  {
    name: "Drip emitters",
    job: "Field-repair spares for when a line fails mid-summer. Backup, not primary infrastructure.",
    material: "PETG",
    status: "In design",
  },
];

const lanes = [
  {
    no: "01",
    name: "Free models",
    desc: "Individual parts published free on MakerWorld, with documentation worth keeping. Print them, modify them, improve them.",
    tag: "First out",
  },
  {
    no: "02",
    name: "The fabrication kit",
    desc: "The curated bundle: every part, tested print settings per material, and honest notes on what each one survived. Digital, yours forever.",
    tag: "Paid · digital",
  },
  {
    no: "03",
    name: "Field packs",
    desc: "No printer? Occasional printed batches, listed when they exist and gone when they sell. Small drops, not print-on-demand.",
    tag: "Limited drops",
  },
];

export default function FabricationPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "fabrication" }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <span>Homesteader Labs</span>
            <span>/</span>
            <span>The Workshop</span>
            <span className="ml-auto">Print it yourself</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Open designs</Stamp>
            <Stamp color="text-slateblue" rotate="1.8deg">PETG outdoors</Stamp>
            <Stamp color="text-rust" rotate="-2.2deg">No plastic junk</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            The workshop
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Printable parts for the homestead, designed to be made, not
            purchased. Every model earns its file the same way hardware earns a
            catalog page: by surviving outside first.
          </p>
          <p className="font-hand font-semibold text-marker text-xl mt-4 rotate-[-1deg]">
            designed on the A1, tested in the dirt.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        {/* The parts bin */}
        <SectionHead no="§1" title="The Parts Bin" right="5 parts in fabrication · 0 released" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {parts.map((part) => (
            <div
              key={part.name}
              className="border-2 border-dashed border-ink/40 p-5 flex flex-col text-ink/70"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="font-mono text-[0.64rem] uppercase tracking-widest">
                  {part.status}
                </span>
                <span className="font-mono text-[0.64rem] uppercase tracking-wide bg-kraft px-1.5 py-0.5 border border-ink/40">
                  {part.material}
                </span>
              </div>
              <h2 className="font-display uppercase text-lg leading-tight text-ink/85">
                {part.name}
              </h2>
              <p className="text-[0.95rem] leading-snug mt-1">{part.job}</p>
            </div>
          ))}
        </div>

        {/* How it ships */}
        <SectionHead no="§2" title="How It Ships" right="Free first · Kit later · Drops maybe" />
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {lanes.map((lane) => (
            <div key={lane.no} className="card-paper grain p-5">
              <div className="relative z-[2]">
                <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
                  <span className="font-mono text-[0.7rem] font-bold text-marker">
                    No. {lane.no}
                  </span>
                  <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
                    {lane.tag}
                  </span>
                </div>
                <h2 className="font-display uppercase text-lg mt-3 leading-tight">
                  {lane.name}
                </h2>
                <p className="text-[0.95rem] text-ink/80 mt-1 leading-snug">{lane.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bench list */}
        <div className="border-2 border-ink bg-kraft grain p-6 md:p-8 relative mb-10">
          <div className="relative z-[2] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-lg">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2">
                The bench list
              </p>
              <h2 className="font-display uppercase text-xl leading-tight mb-2">
                Know when the first models drop
              </h2>
              <p className="text-[0.98rem] text-ink/85 leading-snug">
                One email when the free models go up, one when the kit is
                ready. Nothing else.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 w-full md:w-auto">
              <div className="flex gap-2">
                <label htmlFor="fabrication-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="fabrication-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-grow md:w-64 px-3 py-2 bg-paper border-2 border-ink text-ink placeholder:text-ink/40 focus:outline-none focus:border-marker font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-ink text-paper px-4 py-2 border-2 border-ink font-mono text-xs uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60"
                >
                  {submitting ? "..." : "Join"}
                </button>
              </div>
              <div aria-live="polite" aria-atomic="true">
                {status === "success" && (
                  <p className="font-hand font-semibold text-moss text-lg mt-2">
                    ✓ you&apos;re on the bench list
                  </p>
                )}
                {status === "error" && (
                  <p className="font-hand font-semibold text-marker text-lg mt-2">
                    ✎ that didn&apos;t go through, try again
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Station footer */}
        <p className="text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          Open designs · Modify everything ·{" "}
          <Link href="/terms-of-fabrication/" className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker">
            Read the terms of fabrication
          </Link>
        </p>
      </div>
    </>
  );
}
