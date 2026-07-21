import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { SectionHead, SpecBox, Stamp } from "@/components/field/kit";
import { getKbCrop, getKbSlugs, getKbCompanions, isKbCropIndexable } from "@/lib/kb";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getKbSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const crop = getKbCrop(params.slug);
  if (!crop) return { title: "Crop Not Found" };

  const desc =
    crop.description ??
    `Growing reference for ${crop.name}${crop.binomialName ? ` (${crop.binomialName})` : ""}.`;
  const title = `How to Grow ${crop.name}${crop.binomialName ? ` (${crop.binomialName})` : ""}`;

  return {
    title,
    description: desc.slice(0, 300),
    openGraph: { title, description: desc.slice(0, 300), type: "article" },
    // Thin, near-empty entries stay live for browsing but out of the index
    // until they gain real content (avoids scaled/thin-content signals).
    robots: isKbCropIndexable(crop) ? undefined : { index: false, follow: true },
  };
}

export default async function KbCropPage(props: PageProps) {
  const params = await props.params;
  const crop = getKbCrop(params.slug);
  if (!crop) notFound();

  const companions = getKbCompanions(crop.slug);
  const entryRef = crop.slug.toUpperCase().replace(/-/g, "_");

  const specs: [string, ReactNode][] = [];
  if (crop.sun) specs.push(["Sun", crop.sun]);
  if (crop.sowingMethod) specs.push(["Sowing", crop.sowingMethod]);
  if (crop.growingDegreeDays != null)
    specs.push(["GDD", `${crop.growingDegreeDays} days`]);
  if (crop.spreadCm != null) specs.push(["Spread", `${crop.spreadCm} cm`]);
  if (crop.rowSpacingCm != null)
    specs.push(["Rows", `${crop.rowSpacingCm} cm`]);
  if (crop.heightCm != null) specs.push(["Height", `${crop.heightCm} cm`]);

  return (
    <article>
      {/* Entry header band */}
      <section className="bg-kraft grain border-b-2 border-ink torn-top relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link
              href="/kb/"
              className="hover:text-marker underline underline-offset-4"
            >
              Knowledge Base
            </Link>
            <span>/</span>
            <span>{crop.name}</span>
            <span className="ml-auto">Ref: KB_{entryRef}</span>
          </div>
          {crop.tags && crop.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {crop.tags.slice(0, 3).map((tag, i) => (
                <Stamp
                  key={tag}
                  color={
                    i === 0 ? "text-moss" : i === 1 ? "text-slateblue" : "text-rust"
                  }
                  rotate={i === 1 ? "1.8deg" : i === 2 ? "-2.2deg" : undefined}
                >
                  {tag}
                </Stamp>
              ))}
            </div>
          )}
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            {crop.name}
          </h1>
          {crop.binomialName && (
            <p className="mt-4 text-xl md:text-2xl leading-relaxed max-w-2xl text-ink/85 italic">
              {crop.binomialName}
              {crop.taxon ? (
                <span className="not-italic text-ink/60"> · {crop.taxon}</span>
              ) : null}
            </p>
          )}
        </div>
      </section>

      {/* Body: working surface, zero degrees */}
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-16">
        {crop.description && (
          <p className="text-lg leading-relaxed text-ink/90">
            {crop.description}
          </p>
        )}

        {/* Growing data */}
        <div className="mt-10">
          <SectionHead no="§1" title="Growing data" />
          {specs.length > 0 ? (
            <SpecBox rows={specs} title="Field specs" />
          ) : (
            <p className="text-ink/50 italic">
              No structured growing data recovered for this crop yet.
            </p>
          )}
        </div>

        {/* Calculator cross-link */}
        {crop.calculatorCropId && (
          <div className="mt-10 no-print">
            <Link
              href="/tools/planting-calendar/"
              className="flex items-center justify-between gap-4 bg-ink text-paper border-2 border-ink px-5 py-4 hover:bg-marker hover:border-marker transition-colors group"
            >
              <span>
                <span className="block font-mono text-[0.78rem] uppercase tracking-wider">
                  Plan {crop.name} plantings
                </span>
                <span className="block mt-1 text-[0.85rem] text-paper/70">
                  Frost-relative sowing dates in the planting calendar
                </span>
              </span>
              <ArrowRight size={18} className="shrink-0" />
            </Link>
          </div>
        )}

        {/* Companions */}
        {companions.length > 0 && (
          <div className="mt-10">
            <SectionHead no="§2" title="Companion crops" />
            <div className="flex flex-wrap gap-2">
              {companions.map((c) => (
                <Link
                  key={c.slug}
                  href={`/kb/${c.slug}/`}
                  className="px-3 py-1.5 border-2 border-ink bg-paper hover:bg-kraft transition-colors font-mono text-[0.72rem] uppercase tracking-wider"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Document footer */}
        <div className="mt-12 border-t-2 border-ink pt-4 flex flex-col sm:flex-row justify-between gap-4 font-mono text-[0.68rem] uppercase tracking-wider text-ink/60">
          <div>
            <p>Entry: {entryRef}</p>
            <p>
              Source: {crop.source.origin} · License: {crop.source.license}
            </p>
            {crop.source.waybackUrl && (
              <p>
                <a
                  href={crop.source.waybackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                >
                  Archived capture
                  {crop.source.captured ? ` (${crop.source.captured})` : ""}
                  <ExternalLink size={10} />
                </a>
              </p>
            )}
          </div>
          <p className="text-ink/50 max-w-xs sm:text-right">
            Public-domain data recovered from the Internet Archive. Spotted an
            error? Corrections welcome.
          </p>
        </div>
      </section>
    </article>
  );
}
