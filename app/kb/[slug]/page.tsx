import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sprout, Sun, Ruler, Sprout as Seedling, ExternalLink } from "lucide-react";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
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

function SpecRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-primary/40 last:border-0">
      <span className="text-accent mt-0.5 shrink-0">{icon}</span>
      <span className="text-xs font-mono uppercase tracking-tighter opacity-50 w-32 shrink-0">
        {label}
      </span>
      <span className="text-sm leading-relaxed">{value}</span>
    </div>
  );
}

export default async function KbCropPage(props: PageProps) {
  const params = await props.params;
  const crop = getKbCrop(params.slug);
  if (!crop) notFound();

  const companions = getKbCompanions(crop.slug);
  const cm = (v?: number) => (v != null ? `${v} cm` : null);

  return (
    <FieldStationLayout
      stationId={`HL_KB_${crop.slug.toUpperCase().replace(/-/g, "_")}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/kb/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-tighter hover:text-accent transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Back_to_Knowledge_Base</span>
          </Link>
        </div>

        <BrutalistBlock
          className="p-0 overflow-hidden"
          refTag={`KB_${crop.slug.toUpperCase().replace(/-/g, "_")}`}
        >
          {/* Header */}
          <div className="border-b-2 border-border-primary p-6 md:p-10 bg-background-primary/30">
            <Typography variant="h1" className="text-3xl md:text-5xl leading-tight mb-2">
              {crop.name}
            </Typography>
            {crop.binomialName && (
              <p className="text-base md:text-lg font-mono italic opacity-60">
                {crop.binomialName}
                {crop.taxon ? (
                  <span className="not-italic opacity-60"> · {crop.taxon}</span>
                ) : null}
              </p>
            )}
            {crop.tags && crop.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {crop.tags.map((tag) => (
                  <Badge key={tag} variant="status" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {crop.description && (
            <div className="p-6 md:p-10 border-b-2 border-border-primary">
              <Typography variant="body" className="leading-relaxed opacity-90">
                {crop.description}
              </Typography>
            </div>
          )}

          {/* Specs */}
          <div className="p-6 md:p-10">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] opacity-50 mb-4">
              Growing_Data
            </h2>
            <div>
              {crop.sun && (
                <SpecRow icon={<Sun size={16} />} label="Sun" value={crop.sun} />
              )}
              {crop.sowingMethod && (
                <SpecRow
                  icon={<Seedling size={16} />}
                  label="Sowing"
                  value={crop.sowingMethod}
                />
              )}
              {crop.growingDegreeDays != null && (
                <SpecRow
                  icon={<Sprout size={16} />}
                  label="Growing degree days"
                  value={`${crop.growingDegreeDays} days`}
                />
              )}
              {cm(crop.spreadCm) && (
                <SpecRow
                  icon={<Ruler size={16} />}
                  label="Spread"
                  value={cm(crop.spreadCm)}
                />
              )}
              {cm(crop.rowSpacingCm) && (
                <SpecRow
                  icon={<Ruler size={16} />}
                  label="Row spacing"
                  value={cm(crop.rowSpacingCm)}
                />
              )}
              {cm(crop.heightCm) && (
                <SpecRow
                  icon={<Ruler size={16} />}
                  label="Height"
                  value={cm(crop.heightCm)}
                />
              )}
              {!crop.sun &&
                !crop.sowingMethod &&
                crop.growingDegreeDays == null &&
                crop.spreadCm == null &&
                crop.rowSpacingCm == null &&
                crop.heightCm == null && (
                  <p className="text-sm opacity-50 italic">
                    No structured growing data recovered for this crop yet.
                  </p>
                )}
            </div>
          </div>

          {/* Calculator cross-link */}
          {crop.calculatorCropId && (
            <div className="px-6 md:px-10 pb-6 md:pb-10">
              <Link
                href="/tools/planting-calendar/"
                className="flex items-center justify-between gap-4 bg-accent border-2 border-foreground-primary text-white shadow-[4px_4px_0px_0px_var(--text-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--text-primary)] transition-all p-5"
              >
                <div className="flex items-center gap-3">
                  <Sprout size={20} />
                  <div>
                    <p className="font-bold uppercase tracking-tight text-sm">
                      Plan {crop.name} plantings
                    </p>
                    <p className="text-xs opacity-90">
                      Frost-relative sowing dates in the planting calculator
                    </p>
                  </div>
                </div>
                <ChevronLeft size={18} className="rotate-180 shrink-0" />
              </Link>
            </div>
          )}

          {/* Companions */}
          {companions.length > 0 && (
            <div className="px-6 md:px-10 pb-6 md:pb-10">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] opacity-50 mb-4">
                Companion_Crops
              </h2>
              <div className="flex flex-wrap gap-2">
                {companions.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/kb/${c.slug}/`}
                    className="inline-flex items-center gap-1.5 bg-background-secondary border-2 border-border-primary shadow-brutalist-sm hover:border-accent transition-colors px-3 py-1.5 text-xs font-bold uppercase tracking-tight"
                  >
                    <Sprout size={12} className="text-accent" />
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Attribution footer */}
          <div className="border-t-2 border-border-primary p-6 md:p-10 bg-background-secondary/50">
            <div className="text-xs font-mono opacity-50 leading-relaxed space-y-1">
              <p>
                SOURCE: {crop.source.origin} · LICENSE: {crop.source.license}
              </p>
              {crop.source.waybackUrl && (
                <p>
                  <a
                    href={crop.source.waybackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:brightness-110"
                  >
                    Archived capture
                    {crop.source.captured
                      ? ` (${crop.source.captured})`
                      : ""}
                    <ExternalLink size={10} />
                  </a>
                </p>
              )}
              <p className="opacity-70">
                Public-domain data recovered from the Internet Archive. Spotted an
                error? This is an open dataset in progress.
              </p>
            </div>
          </div>
        </BrutalistBlock>
      </div>
    </FieldStationLayout>
  );
}
