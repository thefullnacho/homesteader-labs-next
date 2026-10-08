import {
  getAllKbCrops,
  getKbCrop,
  getKbSlugs,
  getKbCompanions,
  getKbTitle,
  getKbDescription,
  getKbSchemaSpecs,
  KB_RETIRED,
} from "@/lib/kb";
import { type MarkdownDoc, mdLink, mdTable } from "./doc";

/**
 * The crop knowledge base as markdown for agents.
 *
 * Index page lists every crop (searchable); crop pages mirror the HTML rendering
 * with specs, companions, and source info. Thin entries are noindex as HTML but
 * still exist, so they get markdown too: the X-Robots-Tag on every markdown
 * response already keeps these copies out of search.
 */

/** Wayback stamps are "YYYYMMDD"; show them as dates. */
function capturedDate(captured: string): string {
  return /^\d{8}$/.test(captured)
    ? `${captured.slice(0, 4)}-${captured.slice(4, 6)}-${captured.slice(6, 8)}`
    : captured;
}

export function kbIndexMarkdown(): MarkdownDoc {
  const cropList = getAllKbCrops()
    .map((crop) => {
      const name = crop.binomialName ? `${crop.name} (${crop.binomialName})` : crop.name;
      return `- ${mdLink(name, `/kb/${crop.slug}/`)}`;
    })
    .join("\n");

  return {
    path: "/kb/",
    title: "Crop Knowledge Base: Growing Guides for 350+ Plants",
    body: [
      "# Crop Knowledge Base: Growing Guides for 350+ Plants",
      "",
      "An open, searchable reference for growing vegetables, herbs, fruits, and more. Botanical names, sun and spacing needs, and sowing methods for over 350 crops.",
      "",
      "This data is public domain (CC0), recovered from OpenFarm.cc via the Internet Archive.",
      "",
      "## Every crop",
      "",
      cropList,
      "",
      "---",
      "",
      "Source data: OpenFarm.cc · CC0 · via the Internet Archive",
    ].join("\n"),
  };
}

export function kbMarkdown(slug: string): MarkdownDoc | null {
  // Check if it's a retired slug that should 301
  if (KB_RETIRED.has(slug)) {
    return null;
  }

  const crop = getKbCrop(slug);
  if (!crop) return null;

  const title = getKbTitle(crop);
  // The page shows the whole description; getKbDescription is the 300-character meta version.
  const description = crop.description ?? getKbDescription(crop);
  const specs = getKbSchemaSpecs(crop);
  const companions = getKbCompanions(slug);

  const sections: string[] = [];

  // Title
  sections.push(`# ${title}`);
  sections.push("");

  // Description
  if (description) {
    sections.push(description);
    sections.push("");
  }

  // Growing specs table
  if (specs.length > 0) {
    sections.push("## Growing Data");
    sections.push("");

    const specRows = specs.map((spec) => {
      const value = spec.unitText ? `${spec.value} ${spec.unitText}` : String(spec.value);
      return [spec.name, value];
    });

    sections.push(mdTable(["Spec", "Value"], specRows));
    sections.push("");
  }

  // Companions
  if (companions.length > 0) {
    sections.push("## Companion Crops");
    sections.push("");

    const companionLinks = companions.map((c) => mdLink(c.name, `/kb/${c.slug}/`)).join(", ");
    sections.push(companionLinks);
    sections.push("");
  }

  // Calculator link
  if (crop.calculatorCropId) {
    sections.push("## Planting Calendar");
    sections.push("");
    sections.push(
      `Find sowing dates and succession schedules for ${crop.name} in the ${mdLink("planting calendar", "/tools/planting-calendar/")}.`
    );
    sections.push("");
  }

  // Source and license
  sections.push("---");
  sections.push("");
  sections.push("## Source");
  sections.push("");
  sections.push(`**Origin:** ${crop.source.origin}`);
  sections.push(`**License:** ${crop.source.license}`);

  if (crop.source.waybackUrl) {
    sections.push(`**Archived capture:** ${mdLink(crop.source.waybackUrl, crop.source.waybackUrl)}`);
    if (crop.source.captured) {
      sections.push(`**Captured:** ${capturedDate(crop.source.captured)}`);
    }
  }

  sections.push("");
  sections.push("Public-domain data recovered from the Internet Archive. Corrections welcome.");

  return {
    path: `/kb/${slug}/`,
    title,
    body: sections.join("\n"),
  };
}

export function kbMarkdownPaths(): string[] {
  // Every crop the page route generates, thin entries included.
  return ["/kb/", ...getKbSlugs().map((slug) => `/kb/${slug}/`)];
}
