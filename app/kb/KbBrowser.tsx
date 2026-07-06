"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sprout, ArrowRight } from "lucide-react";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
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
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crops by name, botanical name, or description..."
            aria-label="Search the crop knowledge base"
            className="w-full bg-background-secondary border-2 border-border-primary shadow-brutalist-sm pl-12 pr-4 py-4 font-mono text-sm md:text-base text-foreground-primary placeholder:opacity-40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="mt-2 text-xs font-mono uppercase tracking-tighter opacity-50">
          {results.length} / {crops.length} entries
        </div>
      </div>

      {/* Results grid */}
      {results.length === 0 ? (
        <BrutalistBlock variant="terminal">
          <p className="font-mono text-sm">
            No crops match &quot;{query}&quot;. Try a broader term.
          </p>
        </BrutalistBlock>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((crop) => (
            <Link
              key={crop.slug}
              href={`/kb/${crop.slug}/`}
              className="group block bg-background-secondary border-2 border-border-primary shadow-brutalist-sm hover:shadow-brutalist hover:-translate-y-0.5 transition-all p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold uppercase tracking-tight leading-tight truncate">
                    {crop.name}
                  </h3>
                  {crop.binomialName && (
                    <p className="text-xs font-mono italic opacity-50 mt-0.5 truncate">
                      {crop.binomialName}
                    </p>
                  )}
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                />
              </div>
              {crop.description && (
                <p className="text-xs opacity-60 leading-relaxed mt-3 line-clamp-3">
                  {crop.description}
                </p>
              )}
              {crop.calculatorCropId && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-tighter text-accent opacity-80">
                  <Sprout size={11} />
                  In planting calculator
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
