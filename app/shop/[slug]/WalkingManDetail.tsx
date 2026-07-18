"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";
import { SectionHead, SpecBox, Stamp, Tape } from "@/components/field/kit";

interface WalkingManDetailProps {
  product: Product;
}

const CARTRIDGES = [
  {
    id: "MYCO_V1",
    name: "Mycologist",
    desc: "15 species plus deadly lookalikes. Amanita, Galerina, Gyromitra convergence training.",
    status: "available",
  },
  {
    id: "BERRY_V1",
    name: "Berry Expert",
    desc: "Edible vs toxic berries across temperate North America. Pokeweed, nightshade, elderberry disambiguation.",
    status: "available",
  },
  {
    id: "HERB_V1",
    name: "Herbalist",
    desc: "Medicinal and edible plants. Carrot family deadly lookalike detection included.",
    status: "available",
  },
  {
    id: "INVASIVE_V1",
    name: "Invasive Species",
    desc: "Identification of invasive flora for land management and foraging opportunity.",
    status: "coming_soon",
  },
  {
    id: "PEST_V1",
    name: "Garden Pests",
    desc: "Insect and disease ID for integrated pest management.",
    status: "coming_soon",
  },
];

const STEPS = [
  {
    no: "01",
    label: "Photograph",
    desc: "Press the shutter. The camera module captures the subject at full resolution.",
  },
  {
    no: "02",
    label: "Convergence",
    desc: "The NPU runs every loaded cartridge in parallel. The models vote on the identification.",
  },
  {
    no: "03",
    label: "Field ID",
    desc: "The e-ink display shows the consensus ID, a confidence score, and contextual field notes.",
  },
];

const HW_SPECS: [string, React.ReactNode][] = [
  ["Compute", "Raspberry Pi 5, 8GB RAM"],
  ["NPU", "Hailo 8L, 8 TOPS dedicated inference"],
  ["Display", 'Waveshare 4.2" e-ink, readable in full sun'],
  ["Optics", "RPi Camera Module 3, autofocus, HDR"],
  ["Sensors", "4× BLE coin sensors (upcoming)"],
  ["Cloud", "None. No subscription, no signal required."],
];

export default function WalkingManDetail({ product }: WalkingManDetailProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "waitlist" }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/shop/" className="hover:text-marker transition-colors">
              The Catalog
            </Link>
            <span>/</span>
            <span>Walking Man Pro</span>
            <span className="ml-auto">Ref: {product.id}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-rust">Pre-order</Stamp>
            <Stamp color="text-moss" rotate="1.6deg">Offline-first</Stamp>
            <Stamp color="text-slateblue" rotate="-2.2deg">No subscription</Stamp>
          </div>
          <h1 className="font-display uppercase text-4xl sm:text-6xl leading-[0.95] text-balance">
            Walking Man Pro
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            A field identification instrument. Plants, mushrooms, and berries
            named on the spot, by three specialist models on dedicated edge
            hardware. No cloud, no signal required.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="font-display text-3xl">${product.price}</span>
            <button
              onClick={() =>
                document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
            >
              Join the waitlist →
            </button>
            <Link
              href="/tools/forager-game/"
              className="px-5 py-3 border-2 border-ink bg-paper font-mono text-[0.78rem] uppercase tracking-wider hover:bg-kraft transition-colors"
            >
              Play the game first
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pt-12 pb-12">
        {/* §1 The instrument */}
        <SectionHead no="§1" title="The Instrument" right="One device · Three experts" />
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 items-start mb-10">
          <div>
            <figure className="relative rotate-slight card-paper p-2">
              <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[-3deg] z-[3]" />
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src="/images/WalkingMan_hero_shot.jpg"
                  alt="WALKING MAN PRO field research instrument with e-ink display and camera module"
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                  priority
                />
              </div>
              <figcaption className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 pt-2 px-1">
                Field unit · Production prototype
              </figcaption>
            </figure>
            <p className="font-hand font-semibold text-marker text-xl mt-4 rotate-[-1deg] max-w-sm">
              the screen is e-ink. reads in full sun, sips power.
            </p>
          </div>
          <SpecBox title="Hardware manifest" rows={HW_SPECS} />
        </div>

        <figure className="card-paper p-2 mb-14">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src="/images/WalkingMan_dutch_angle.jpg"
              alt="WALKING MAN PRO in the field"
              fill
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-cover"
            />
          </div>
          <figcaption className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 pt-2 px-1">
            In the field · {product.id}
          </figcaption>
        </figure>

        {/* §2 The accuracy claim */}
        <SectionHead no="§2" title="The Accuracy Claim" right="15 species and their lookalikes" />
        <div className="flex flex-wrap items-end gap-x-10 gap-y-6 mb-8">
          <div>
            <div className="font-display text-6xl md:text-7xl text-marker leading-none">
              95–96%
            </div>
            <div className="font-mono text-[0.68rem] uppercase tracking-widest text-ink/60 mt-2">
              Walking Man Pro, field ID accuracy
            </div>
          </div>
          <div className="font-display text-2xl text-ink/30 pb-8">vs</div>
          <div>
            <div className="font-display text-6xl md:text-7xl text-ink/30 leading-none">
              ~76%
            </div>
            <div className="font-mono text-[0.68rem] uppercase tracking-widest text-ink/50 mt-2">
              Typical ID apps
            </div>
          </div>
        </div>
        <p className="max-w-2xl text-[1.02rem] leading-relaxed text-ink/85 mb-8">
          Trained on 15 species and the deadly lookalikes that get people hurt.
          Three specialist models vote on every photo, a mycologist, a berry
          expert, and an herbalist, and the device shows you the vote record,
          not just the verdict.
        </p>

        <div className="border-2 border-rust bg-rust/10 p-5 mb-10">
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-widest text-rust mb-2">
            ⚠ Read this before you eat anything
          </p>
          <p className="text-[0.98rem] leading-snug text-ink/90">
            The Walking Man Pro is a research instrument and a field-guide
            assistant, <strong>not a guarantee</strong>. Verify every
            identification against multiple sources before consuming any
            wild-foraged material. Deadly lookalike species exist in every
            cartridge domain. Treat a confidence score as a starting point,
            never a final answer.
          </p>
        </div>

        {/* Game funnel */}
        <div className="border-2 border-ink bg-kraft grain p-6 md:p-8 relative mb-14">
          <div className="relative z-[2] flex items-center justify-between flex-wrap gap-6">
            <div className="max-w-lg">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2">
                Interactive · The Forager Game
              </p>
              <h3 className="font-display uppercase text-xl leading-tight mb-2">
                Don&apos;t take the 95% on faith
              </h3>
              <p className="text-[0.98rem] text-ink/85 leading-snug">
                Play ten rounds against the exact model that ships on the
                device. Same photos, same four options. See where it wins, and
                where the deadly lookalikes fool the model, and you.
              </p>
            </div>
            <Link
              href="/tools/forager-game/"
              className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors shrink-0"
            >
              Play the game →
            </Link>
          </div>
        </div>

        {/* §3 How it works */}
        <SectionHead no="§3" title="How It Works" right="Shutter to verdict in seconds" />
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {STEPS.map((step) => (
            <div key={step.no} className="card-paper grain p-5">
              <div className="relative z-[2]">
                <span className="font-mono text-[0.7rem] font-bold text-marker">
                  No. {step.no}
                </span>
                <h3 className="font-display uppercase text-lg mt-2 leading-tight">
                  {step.label}
                </h3>
                <p className="text-[0.95rem] text-ink/80 mt-1 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* §4 Cartridges */}
        <SectionHead no="§4" title="Expertise Cartridges" right="3 live · 2 in training" />
        <p className="max-w-2xl text-[1.02rem] leading-relaxed text-ink/85 mb-8">
          Loadable model packs. Run all three at once and the device
          cross-references their votes on every identification.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {CARTRIDGES.map((c) =>
            c.status === "available" ? (
              <div key={c.id} className="card-paper grain p-5">
                <div className="relative z-[2]">
                  <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 bg-kraft px-1.5 py-0.5 border border-ink/40">
                    {c.id}
                  </span>
                  <h3 className="font-display uppercase text-lg mt-3 leading-tight">
                    {c.name}
                  </h3>
                  <p className="text-[0.92rem] text-ink/80 mt-1 leading-snug">{c.desc}</p>
                </div>
              </div>
            ) : (
              <div
                key={c.id}
                className="border-2 border-dashed border-ink/40 p-5 text-ink/50"
              >
                <span className="font-mono text-[0.64rem] uppercase tracking-widest">
                  In training
                </span>
                <h3 className="font-display uppercase text-lg mt-3 leading-tight">
                  {c.name}
                </h3>
                <p className="text-[0.92rem] mt-1 leading-snug">{c.desc}</p>
              </div>
            )
          )}
        </div>

        {/* §5 Sensor suite */}
        <div className="border-2 border-dashed border-ink/40 p-6 mb-14">
          <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/60 block mb-2">
            In development
          </span>
          <h2 className="font-display uppercase text-lg leading-tight mb-2">
            BLE sensor coins
          </h2>
          <p className="text-[0.95rem] text-ink/70 leading-snug max-w-2xl mb-4">
            Four coin-sized BLE sensors pair with the unit to add environmental
            context to every identification. Cross-referencing lands when the
            hardware does.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["Humidity", "Water levels", "Air quality", "Radiation"].map((s) => (
              <span
                key={s}
                className="font-mono text-[0.64rem] uppercase tracking-wide text-ink/60 bg-kraft px-1.5 py-0.5 border border-ink/40"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* §6 Waitlist */}
        <section id="waitlist" className="border-2 border-ink bg-ink text-paper p-6 md:p-10 mb-10">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/60 mb-2">
            The ledger
          </p>
          <h2 className="font-display uppercase text-2xl leading-tight mb-2">
            Join the waitlist
          </h2>
          <p className="text-[0.98rem] text-paper/80 leading-snug mb-6 max-w-md">
            One email when the device is ready to ship. Nothing else.
          </p>

          {submitted ? (
            <p className="font-hand font-semibold text-2xl text-paper" aria-live="polite">
              ✓ logged. we&apos;ll write to {email} when it ships.
            </p>
          ) : (
            <form onSubmit={handleWaitlist} className="max-w-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-paper border-2 border-paper text-ink placeholder:text-ink/40 font-mono text-sm px-4 py-3 outline-none focus:border-marker"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-marker text-paper px-6 py-3 border-2 border-marker font-mono text-[0.78rem] uppercase tracking-wider hover:bg-paper hover:border-paper hover:text-ink transition-colors disabled:opacity-60"
                >
                  {submitting ? "Logging..." : "Sign me up →"}
                </button>
              </div>
              {submitError && (
                <p className="font-mono text-[0.72rem] uppercase tracking-wider text-marker mt-3">
                  Something went wrong. Try again.
                </p>
              )}
            </form>
          )}
        </section>

        {/* Station footer */}
        <p className="text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          Field research instrument · Homesteader Labs fabrication division
        </p>
      </div>
    </>
  );
}
