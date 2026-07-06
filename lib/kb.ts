import kbData from '@/content/kb/crops.json';

/**
 * Knowledge Base crop entries.
 *
 * Data recovered from OpenFarm.cc (shut down April 2025), whose database was
 * released into the public domain (CC0). Recovered from the Internet Archive's
 * captures of the crop pages, normalized, and attributed per-entry via `source`.
 *
 * The KB is the broad, open reference layer. A subset of entries also exist in
 * the planting calculator (`lib/tools/planting-calendar`) with full sowing-timing
 * data; those carry `calculatorCropId` so the two layers can cross-link.
 */

export interface KbSource {
  origin: string;
  license: string;
  waybackUrl: string | null;
  captured: string | null;
}

export interface KbCrop {
  slug: string;
  name: string;
  binomialName?: string;
  taxon?: string;
  description?: string;
  /** Sun requirement as free text, e.g. "Full Sun". */
  sun?: string;
  /** Sowing method as free text. */
  sowingMethod?: string;
  growingDegreeDays?: number;
  spreadCm?: number;
  rowSpacingCm?: number;
  heightCm?: number;
  tags?: string[];
  /** Companion crop slugs (raw OpenFarm slugs; not all are KB entries). */
  companions?: string[];
  /** When set, this crop also exists in the planting calculator under this id. */
  calculatorCropId?: string;
  source: KbSource;
}

const crops: KbCrop[] = (kbData as KbCrop[])
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name));

const bySlug = new Map(crops.map((c) => [c.slug, c]));

export function getAllKbCrops(): KbCrop[] {
  return crops;
}

export function getKbCrop(slug: string): KbCrop | undefined {
  return bySlug.get(slug);
}

export function getKbSlugs(): string[] {
  return crops.map((c) => c.slug);
}

/** Companions that are themselves KB entries, resolved to their crop objects. */
export function getKbCompanions(slug: string): KbCrop[] {
  const crop = bySlug.get(slug);
  if (!crop?.companions) return [];
  return crop.companions
    .map((s) => bySlug.get(s))
    .filter((c): c is KbCrop => c !== undefined && c.slug !== slug);
}

/**
 * Whether a KB page has enough substance to be worth indexing.
 *
 * Recovered entries vary wildly in completeness. Thin, near-empty pages (a name
 * and little else) read as scaled/thin content to search engines, so we keep
 * them live for browsing and internal linking but mark them `noindex` and omit
 * them from the sitemap until they gain real content. A crop qualifies with
 * either a substantive description or a solid set of structured growing specs.
 */
export function isKbCropIndexable(crop: KbCrop): boolean {
  const hasDescription = !!crop.description && crop.description.length >= 80;
  const specCount = [
    crop.sun,
    crop.sowingMethod,
    crop.growingDegreeDays,
    crop.spreadCm,
    crop.rowSpacingCm,
    crop.heightCm,
  ].filter((v) => v != null && v !== "").length;
  return hasDescription || specCount >= 4;
}

/** Case-insensitive search across name, binomial name, and description. */
export function searchKbCrops(query: string): KbCrop[] {
  const q = query.trim().toLowerCase();
  if (!q) return crops;
  return crops.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.binomialName?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q)
  );
}
