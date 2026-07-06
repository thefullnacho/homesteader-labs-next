import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Database } from "lucide-react";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import { getAllKbCrops } from "@/lib/kb";
import KbBrowser from "./KbBrowser";

export const metadata: Metadata = {
  title: "Crop Knowledge Base — Growing Guides for 350+ Plants",
  description:
    "An open, searchable reference for growing vegetables, herbs, fruits, and more. Botanical names, sun and spacing needs, and sowing methods for over 350 crops. Free and public domain.",
  openGraph: {
    title: "Crop Knowledge Base — Homesteader Labs",
    description:
      "Open, searchable growing reference for 350+ crops. Botanical names, sun, spacing, and sowing methods. Public domain.",
    type: "website",
  },
};

export default function KnowledgeBasePage() {
  const crops = getAllKbCrops();

  return (
    <FieldStationLayout stationId="HL_KB_INDEX">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/tools/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-tighter hover:text-accent transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Back_to_Tools</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database size={24} className="text-accent" />
            <Typography variant="h1" className="text-3xl md:text-5xl leading-tight">
              Crop Knowledge Base
            </Typography>
          </div>
          <Typography
            variant="body"
            className="opacity-70 text-lg leading-relaxed border-l-2 border-accent pl-4 max-w-3xl"
          >
            An open, searchable reference for {crops.length} crops — botanical
            names, sun and spacing needs, and sowing methods. The broad reference
            layer beneath our planting tools; crops marked{" "}
            <span className="text-accent font-mono">In planting calculator</span>{" "}
            have full frost-relative scheduling.
          </Typography>
        </div>

        <KbBrowser crops={crops} />

        {/* Attribution */}
        <BrutalistBlock
          variant="default"
          className="mt-10"
          refTag="SRC_CC0"
        >
          <p className="text-xs font-mono opacity-60 leading-relaxed">
            Seed data recovered from{" "}
            <span className="text-accent">OpenFarm.cc</span> (2011–2025), released
            into the public domain (CC0) and preserved via the Internet Archive.
            We&apos;re rebuilding it as an open dataset — corrections and additions
            welcome.
          </p>
        </BrutalistBlock>
      </div>
    </FieldStationLayout>
  );
}
