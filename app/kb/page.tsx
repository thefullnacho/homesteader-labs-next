import type { Metadata } from "next";
import Link from "next/link";
import { Stamp } from "@/components/field/kit";
import { getAllKbCrops } from "@/lib/kb";
import KbBrowser from "./KbBrowser";

export const metadata: Metadata = {
  title: "Crop Knowledge Base: Growing Guides for 350+ Plants",
  description:
    "An open, searchable reference for growing vegetables, herbs, fruits, and more. Botanical names, sun and spacing needs, and sowing methods for over 350 crops. Free and public domain.",
  openGraph: {
    title: "Crop Knowledge Base: Homesteader Labs",
    description:
      "Open, searchable growing reference for 350+ crops. Botanical names, sun, spacing, and sowing methods. Public domain.",
    type: "website",
  },
};

export default function KnowledgeBasePage() {
  const crops = getAllKbCrops();

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link
              href="/tools/"
              className="hover:text-marker underline underline-offset-4"
            >
              Tools
            </Link>
            <span>/</span>
            <span>Knowledge Base</span>
            <span className="ml-auto">{crops.length} crops on file</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Public domain · CC0</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">
              Open dataset
            </Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            The crop files, rescued from a dead website.
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Botanical names, sun and spacing needs, and sowing methods for{" "}
            {crops.length} crops, the broad reference layer beneath the
            planting tools.
          </p>
          <p className="mt-3 font-hand font-semibold text-marker text-xl rotate-[-1deg]">
            recovered from OpenFarm.cc, 2011–2025
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        <KbBrowser crops={crops} />

        {/* Attribution + station footer */}
        <p className="mt-12 text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          Seed data: OpenFarm.cc · CC0 · via the Internet Archive · Corrections
          welcome
        </p>
      </section>
    </>
  );
}
