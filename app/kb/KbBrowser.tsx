"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PaperClip, SectionHead } from "@/components/field/kit";
import type { KbCrop } from "@/lib/kb";

interface KbBrowserProps {
  crops: KbCrop[];
}

export default function KbBrowser({ crops }: KbBrowserProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return crops;
    return crops.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.binomialName?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [crops, query]);

  return (
    <div>
      <SectionHead no="§1" title="Crops on file" right={`${crops.length} entries`} />

      {/* Search */}
      <div className="mb-10">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, botanical name, or description..."
            aria-label="Search the crop knowledge base"
            className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono text-sm md:text-base placeholder:text-ink/40 focus:outline-none focus:border-marker transition-colors"
          />
        </div>
        <div className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/50">
          {results.length} / {crops.length} entries
        </div>
      </div>

      {/* Results wall: browsing surface, tilts allowed */}
      {results.length === 0 ? (
        <div className="border-2 border-dashed border-ink/40 p-10 text-center">
          <p className="text-ink/60 italic">
            No crops match &quot;{query}&quot;. Try a broader term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((crop, i) => (
            <Link
              key={crop.slug}
              href={`/kb/${crop.slug}/`}
              className={`relative card-paper grain p-5 pt-6 block hover:-translate-y-1 hover:rotate-0 transition-transform group ${
                i % 3 === 0 ? "rotate-slight" : i % 3 === 1 ? "" : "rotate-slight-r"
              }`}
            >
              <PaperClip className="absolute -top-4 right-8 w-5 h-12 -rotate-6" />
              <div className="flex items-center justify-between font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 mb-3 relative z-[2]">
                <span className="bg-kraft px-1.5 py-0.5 border border-ink/40">
                  {crop.taxon || "crop"}
                </span>
                {crop.calculatorCropId && (
                  <span className="text-moss">In calculator</span>
                )}
              </div>
              <h2 className="font-display uppercase text-lg leading-tight group-hover:text-marker transition-colors relative z-[2]">
                {crop.name}
              </h2>
              {crop.binomialName && (
                <p className="mt-0.5 font-mono text-[0.72rem] italic text-ink/55 truncate relative z-[2]">
                  {crop.binomialName}
                </p>
              )}
              {crop.description && (
                <p className="mt-2 text-[0.95rem] text-ink/80 leading-snug line-clamp-3 relative z-[2]">
                  {crop.description}
                </p>
              )}
              <p className="mt-4 pt-3 border-t border-dotted border-ink/40 font-mono text-[0.68rem] uppercase tracking-wider text-ink/60 relative z-[2]">
                Open entry →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
