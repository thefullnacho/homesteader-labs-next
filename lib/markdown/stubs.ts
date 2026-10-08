import { getAllProducts } from "@/lib/products";
import { MarkdownDoc, abs, mdLink } from "./doc";

/**
 * Stub markdown for pages that are interactive tools or simple pages
 * without dedicated markdown renderers.
 *
 * An agent asking for markdown gets a truthful summary that names what the
 * page does, whether it requires interaction, and any public endpoints it uses.
 */

interface StubPageInfo {
  title: string;
  summary: string;
  extra?: string;
}

// Built from app/sitemap.ts and metadata exports. The homepage, the hubs, the
// notes, the KB and the zone and state pages have their own renderers.
export const STUB_PAGES: Record<string, StubPageInfo> = {

  "/shop/": {
    title: "Hardware Catalog: Off-Grid Survival & Mesh Networking Equipment",
    summary:
      "Authorized hardware for self-reliant homesteaders. Off-grid electronics, mesh networking gear, and custom-fabricated survival equipment.",
  },

  "/tools/planting-calendar/": {
    title: "Free Planting Calendar by ZIP Code & Frost Date",
    summary:
      "Frost-date-anchored planting schedules for 54 crops. Know exactly when to start seeds, transplant, and harvest based on your last frost date and growing zone.",
    extra:
      `Interactive tool: runs in the browser with no account required. The zone and frost data behind it is also published as JSON: ${mdLink("ZIP to zone", "/api/zone/06385/")} and ${mdLink("frost normals by zone", "/api/frost/6b/")}. Zone-level schedules are readable without the tool at ${abs("/tools/planting-calendar/zone/")}.`,
  },

  "/tools/weather/": {
    title: "Growing Degree Days Calculator + Rainwater Catchment",
    summary:
      "Free growing degree days calculator, rainwater catchment estimator, soil temperature tracker, and fire risk index for off-grid homesteaders. Real-time data from Open-Meteo, no signup.",
    extra:
      "Interactive tool: runs in the browser with no account required. Live weather comes from Open-Meteo.",
  },

  "/tools/caloric-security/": {
    title: "Survival Garden Calculator: Food, Water & Energy Autonomy",
    summary:
      "Survival garden calculator and food self-sufficiency tracker. Know how many days your household can survive on stored food, projected harvests, water catchment, and solar energy, all in one dashboard. No account required.",
    extra: "Interactive tool: runs in the browser with no account. Data is stored locally in your browser.",
  },

  "/tools/caloric-security/roi/": {
    title: "Crop ROI: Calories Per Square Foot",
    summary:
      "Ranks every crop in the database by kcal per square foot of garden space. Compare the caloric return on your growing space.",
    extra: "Interactive tool: runs in the browser. Part of the survival garden calculator.",
  },

  "/tools/caloric-security/companions/": {
    title: "Companion Planting Advisor",
    summary:
      "Pest-aware companion plant alerts and conflict detection. See which crops support each other and which ones antagonize.",
    extra:
      `Interactive tool: runs in the browser. The pest emergence thresholds and evidence-rated companions are also published as JSON: ${mdLink("pest index", "/api/pests/")}.`,
  },

  "/tools/fabrication/": {
    title: "The Workshop: Printable Homestead Parts",
    summary:
      "3D-printable parts for the homestead: plant tags, hose guides, hooks, and row cover clips. Free field-tested models with honest print settings, plus a curated fabrication kit.",
    extra: "Interactive tool: runs in the browser with model previews and specification details.",
  },

  "/tools/forager-game/": {
    title: "Can You Beat the AI? Wild Plant ID Game",
    summary:
      "A wild plant and mushroom identification game pitting you against the trained vision model that powers WALKING MAN PRO. 10 rounds, real species, real lookalikes.",
    extra:
      "Interactive game: runs in the browser with no account. Images are from iNaturalist under CC-BY and CC-0 licenses.",
  },

  "/survival-garden-plan/": {
    title: "Survival Garden Plan: Personalized for Your Zone",
    summary:
      "A personalized, zone-specific survival garden plan: crop selection, layout, sowing schedule, and caloric projection. Generated for your exact ZIP code, household, and goals.",
    extra: "Interactive tool: runs in the browser. Generates a PDF plan tailored to your location and household.",
  },

  "/data/": {
    title: "Field Data: Zone, Frost and Pest Endpoints",
    summary:
      "Three JSON endpoints any tool or assistant can call: ZIP to USDA zone, frost normals by zone, and phenology-aware pest emergence thresholds. No key, no account, no rate limit.",
    extra:
      `Endpoints: ${mdLink("/api/zone/{zip}/", "/api/zone/06385/")}, ${mdLink("/api/frost/{zone}/", "/api/frost/6b/")}, ${mdLink("/api/pests/", "/api/pests/")} and /api/pests/{cropId}/. Responses carry license and attribution fields. OpenAPI spec: ${abs("/openapi.json")}.`,
  },

  "/privacy/": {
    title: "Privacy Hash",
    summary: "Privacy protocol: we do not track you. The network does.",
  },

  "/warranty/": {
    title: "Warranty (Void)",
    summary:
      "Warranty status void. All warranties voided the moment you decided to take production into your own hands.",
  },

  "/terms-of-fabrication/": {
    title: "Terms of Fabrication",
    summary:
      "Agreement protocol: risk acknowledgment, modification encouragement, and liability statement for building with Homesteader Labs designs.",
  },
};

// Product pages: dynamically built from the product catalog
function buildProductStubs(): Record<string, StubPageInfo> {
  const products = getAllProducts();
  const stubs: Record<string, StubPageInfo> = {};

  for (const product of products) {
    const path = `/shop/${product.id.toLowerCase()}/`;
    stubs[path] = {
      title: product.name,
      summary: product.description,
    };
  }

  return stubs;
}

const productStubs = buildProductStubs();

export function stubMarkdown(path: string): MarkdownDoc | null {
  // Merge static and dynamic stubs
  const allStubs = { ...STUB_PAGES, ...productStubs };
  const info = allStubs[path];

  if (!info) return null;

  const sections: string[] = [];

  sections.push(`# ${info.title}`);
  sections.push("");
  sections.push(info.summary);
  sections.push("");

  if (info.extra) {
    sections.push(info.extra);
    sections.push("");
  }

  sections.push(`Open it: ${abs(path)}`);
  sections.push("");

  // Link back to catalog for product pages
  if (path.startsWith("/shop/") && path !== "/shop/") {
    sections.push(mdLink("Back to catalog", "/shop/"));
  }

  return {
    path,
    title: info.title,
    body: sections.join("\n"),
  };
}

export function stubPaths(): string[] {
  // Merge static and dynamic stubs
  const allStubs = { ...STUB_PAGES, ...productStubs };
  return Object.keys(allStubs).sort();
}
