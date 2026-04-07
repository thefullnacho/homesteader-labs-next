"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, Lock } from "lucide-react";
import type { Product } from "@/lib/products";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface WalkingManDetailProps {
  product: Product;
}

const CARTRIDGES = [
  {
    id: "MYCO_V1",
    name: "Mycologist",
    desc: "15 species + deadly lookalikes. Amanita, Galerina, Gyromitra convergence training.",
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
    num: "01",
    label: "Photograph",
    desc: "Press shutter. RPi Camera Module 3 captures subject at full resolution.",
  },
  {
    num: "02",
    label: "Convergence",
    desc: "Hailo 8L NPU runs all loaded cartridges in parallel. Models vote on identification.",
  },
  {
    num: "03",
    label: "Field ID",
    desc: "E-ink display shows consensus ID, confidence score, and contextual field notes.",
  },
];

const HW_SPECS = [
  { label: "Compute", value: "Raspberry Pi 5 — 8GB RAM" },
  { label: "NPU", value: "Hailo 8L — 8 TOPS dedicated inference" },
  { label: "Display", value: "Waveshare 4.2\" e-ink — readable in full sun" },
  { label: "Optics", value: "RPi Camera Module 3 — autofocus, HDR" },
  { label: "Sensors", value: "4× BLE coin sensors (upcoming)" },
  { label: "Connectivity", value: "Offline-first — no cloud, no subscription, no signal required" },
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
    <FieldStationLayout stationId="HL_WLK_MN_PRO">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Breadcrumb */}
        <div>
          <Link href="/shop/" className="inline-flex items-center text-xs font-bold uppercase tracking-tighter hover:text-accent transition-colors">
            <ChevronLeft size={14} className="mr-1" /> HARDWARE_INDEX
          </Link>
        </div>

        {/* ── Section 1: Hero ── */}
        <BrutalistBlock variant="default" className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row gap-10">

            {/* Left: identity + CTA */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="solid">HARDWARE</Badge>
                <Badge variant="outline" pulse>PRE-ORDER</Badge>
              </div>

              <div>
                <Typography variant="h1" className="leading-none tracking-tighter text-4xl md:text-5xl">
                  WALKING MAN
                </Typography>
                <Typography variant="h2" className="text-accent tracking-widest text-sm md:text-base mt-1">
                  {"// FIELD RESEARCH INSTRUMENT"}
                </Typography>
              </div>

              <Typography variant="body" className="opacity-70 text-sm max-w-md">
                Offline plant, mushroom, and berry identification. No cloud. No signal required.
                Three specialist models running in parallel on dedicated edge hardware.
              </Typography>

              {/* Key stats */}
              <div className="flex gap-6">
                <div>
                  <div className="font-mono text-4xl font-black text-accent">95.4%</div>
                  <div className="text-xs font-mono uppercase opacity-50 mt-1">Field ID Accuracy</div>
                </div>
                <div className="w-px bg-border-primary/30" />
                <div>
                  <div className="font-mono text-4xl font-black">OFFLINE</div>
                  <div className="text-xs font-mono uppercase opacity-50 mt-1">First Architecture</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Join_Waitlist <ArrowRight size={16} className="ml-2" />
                </Button>
                <Button href="/shop/" variant="secondary" size="lg">
                  ← Back to Shop
                </Button>
              </div>
            </div>

            {/* Right: hardware manifest terminal block */}
            <div className="flex-1 min-w-0">
              <BrutalistBlock variant="terminal" className="p-5 font-mono text-xs leading-relaxed">
                <div className="text-accent/50 mb-3 text-[10px] tracking-widest">HARDWARE_MANIFEST // WLK-MN-PRO</div>
                {HW_SPECS.map((s) => (
                  <div key={s.label} className="flex gap-2 py-1 border-b border-accent/10 last:border-0">
                    <span className="text-accent/60 w-24 shrink-0 uppercase">{s.label}:</span>
                    <span className="text-accent">{s.value}</span>
                  </div>
                ))}
                <div className="mt-4 text-accent/40 text-[10px]">$ price: ${product.price} {"// STATUS: PRE-ORDER"}</div>
              </BrutalistBlock>
            </div>

          </div>
        </BrutalistBlock>

        {/* ── Section 2: Accuracy Claim ── */}
        <BrutalistBlock variant="default" className="p-6 md:p-10" refTag="ACCURACY_CLAIM">
          <Typography variant="h3" className="text-xs opacity-40 uppercase tracking-widest mb-6">
            Identification Accuracy
          </Typography>

          {/* Stat comparison */}
          <div className="flex flex-wrap gap-8 mb-8">
            <div className="text-center">
              <div className="font-mono font-black text-6xl md:text-7xl text-accent">95–96%</div>
              <div className="text-xs font-mono uppercase opacity-60 mt-2">Walking Man Pro</div>
            </div>
            <div className="flex items-center text-2xl font-black opacity-20">vs</div>
            <div className="text-center">
              <div className="font-mono font-black text-6xl md:text-7xl opacity-30">~76%</div>
              <div className="text-xs font-mono uppercase opacity-40 mt-2">Industry Baseline</div>
            </div>
          </div>

          <Typography variant="body" className="opacity-70 mb-4">
            Trained on 15 species and their deadly lookalikes. Convergence from three specialist
            models — not one generalist — produces a higher-confidence result with an auditable vote record.
          </Typography>

          {/* Safety callout */}
          <div className="border-2 border-accent p-4 bg-accent/5 mt-6">
            <div className="text-xs font-mono font-bold text-accent uppercase tracking-widest mb-2">
              ⚠ Safety Statement
            </div>
            <Typography variant="body" className="text-sm opacity-80">
              The Walking Man Pro is a research instrument and field guide assistant — <strong>not a guarantee</strong>.
              Always verify identifications against multiple sources before consuming any wild-foraged material.
              Deadly lookalike species exist across every cartridge domain. Treat AI confidence scores as
              a starting point, not a final answer.
            </Typography>
          </div>
        </BrutalistBlock>

        {/* ── Section 3: How It Works ── */}
        <div>
          <Typography variant="h3" className="text-xs opacity-40 uppercase tracking-widest mb-4">
            How It Works
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <BrutalistBlock key={step.num} variant="default" className="p-6">
                <div className="font-mono text-5xl font-black text-accent/20 mb-3">{step.num}</div>
                <Typography variant="h4" className="uppercase tracking-tight mb-2">{step.label}</Typography>
                <Typography variant="body" className="text-sm opacity-70">{step.desc}</Typography>
              </BrutalistBlock>
            ))}
          </div>
        </div>

        {/* ── Section 4: Cartridge System ── */}
        <div>
          <div className="mb-4">
            <Typography variant="h3" className="text-xs opacity-40 uppercase tracking-widest">
              EXPERTISE_CARTRIDGES // Loadable Model Packs
            </Typography>
            <Typography variant="body" className="text-sm opacity-60 mt-1">
              Load all three — the device cross-references across cartridges in parallel.
            </Typography>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CARTRIDGES.map((c) => {
              const available = c.status === "available";
              return (
                <BrutalistBlock
                  key={c.id}
                  variant="default"
                  className={`p-5 ${!available ? "opacity-40" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={available ? "solid" : "outline"}>
                      {available ? c.id : "LOCKED"}
                    </Badge>
                    {!available && <Lock size={14} className="opacity-40 mt-1" />}
                  </div>
                  <Typography variant="h4" className="uppercase tracking-tight mb-2">{c.name}</Typography>
                  <Typography variant="body" className="text-xs opacity-70">{c.desc}</Typography>
                  {!available && (
                    <div className="mt-3 text-[10px] font-mono text-accent/50 uppercase tracking-widest">Coming Soon</div>
                  )}
                </BrutalistBlock>
              );
            })}
          </div>
        </div>

        {/* ── Section 5: Hardware Manifest (full) ── */}
        <BrutalistBlock variant="default" className="p-6 md:p-10" refTag="HW_MANIFEST">
          <Typography variant="h3" className="text-xs opacity-40 uppercase tracking-widest mb-6">
            Hardware Manifest
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HW_SPECS.map((s) => (
              <div key={s.label} className="flex flex-col p-3 border border-border-primary/30 bg-background-primary/20">
                <span className="text-[10px] font-mono uppercase opacity-40 tracking-widest">{s.label}</span>
                <span className="font-mono text-sm font-bold mt-0.5">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 border-l-2 border-accent pl-4">
            <Badge variant="solid">OFFLINE_FIRST</Badge>
            <Typography variant="small" className="opacity-60 text-xs">
              No cloud. No subscription. No signal required.
            </Typography>
          </div>
        </BrutalistBlock>

        {/* ── Section 6: Sensor Integration ── */}
        <BrutalistBlock variant="terminal" className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Typography variant="h3" className="text-xs text-accent uppercase tracking-widest">
              BLE Sensor Suite // Contextual Intelligence
            </Typography>
            <Badge variant="outline" className="border-accent text-accent text-[10px]">
              STATUS: DEVELOPMENT
            </Badge>
          </div>
          <Typography variant="body" className="text-sm text-accent/70 mb-4">
            Four BLE coin sensors pair with the Walking Man Pro to provide environmental context
            that informs and cross-checks field identifications:
          </Typography>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-accent/60">
            {["Humidity", "Water Levels", "Air Quality", "Radiation"].map((s) => (
              <div key={s} className="border border-accent/20 p-3 text-center uppercase tracking-wider">
                {s}
              </div>
            ))}
          </div>
          <div className="mt-4 text-[10px] font-mono text-accent/30 uppercase">
            $ sensor_integration: pending // cartridge cross-reference: enabled_when_available
          </div>
        </BrutalistBlock>

        {/* ── Section 7: Waitlist Capture ── */}
        <div id="waitlist">
        <BrutalistBlock variant="accent" className="p-6 md:p-10">
          <Typography variant="h3" className="uppercase tracking-tight text-white mb-2">
            Join the Waitlist
          </Typography>
          <Typography variant="body" className="text-white/80 text-sm mb-6">
            Be first when we ship. No spam. One email when the device is ready.
          </Typography>

          {submitted ? (
            <div className="border-2 border-white/40 p-4 bg-white/10 text-white font-mono text-sm uppercase tracking-wider">
              ✓ Logged. We&apos;ll reach out at {email} when the Walking Man ships.
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="field_operator@domain.com"
                className="flex-1 bg-white/10 border-2 border-white/40 text-white placeholder:text-white/30 font-mono text-sm px-4 py-3 outline-none focus:border-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center font-bold uppercase px-8 py-3 text-sm bg-white text-accent border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:brightness-95 active:shadow-none transition-all disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit →"}
              </button>
              {submitError && (
                <p className="text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
              )}
            </form>
          )}
        </BrutalistBlock>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <Typography variant="small" className="opacity-20 font-mono uppercase tracking-[0.2em]">
            Field Research Instrument • Homesteader Labs Fabrication Division
          </Typography>
        </div>

      </div>
    </FieldStationLayout>
  );
}
