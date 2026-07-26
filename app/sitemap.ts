import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { getAllPosts } from "@/lib/posts";
import { getAllKbCrops, isKbCropIndexable } from "@/lib/kb";
import { isSurvivalPlanPublic } from "@/lib/survivalPlan/visibility";
import { ZONE_PAGES } from "@/lib/tools/planting-calendar/zonePages";

const SITE_URL = "https://homesteaderlabs.com";

/**
 * lastmod is omitted wherever we have no real change signal.
 *
 * It used to be `new Date()` on every route, so each fetch of the sitemap claimed the whole
 * site had changed seconds ago. Crawlers detect that and stop trusting lastmod for the domain
 * entirely, which costs us the one field they actually read. An absent lastmod is treated as
 * "unknown" and is strictly better than one that is provably wrong.
 *
 * Where a genuine date exists we use it: a note's `updated` (falling back to its publish date),
 * and a KB crop's Wayback capture date.
 */

/** Wayback capture stamps are "YYYYMMDD"; anything else is treated as unknown. */
function parseCaptured(captured: string | null): Date | undefined {
  if (!captured || !/^\d{8}$/.test(captured)) return undefined;
  const date = new Date(
    `${captured.slice(0, 4)}-${captured.slice(4, 6)}-${captured.slice(6, 8)}T00:00:00Z`
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Frontmatter dates are author-written, so guard against typos reaching the sitemap. */
function parsePostDate(post: { updated?: string; date: string }): Date | undefined {
  const raw = post.updated || post.date;
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getAllProducts();
  const posts = getAllPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/shop/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/tools/planting-calendar/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/weather/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/caloric-security/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/caloric-security/roi/`, changeFrequency: "monthly", priority: 0.7 },
    // /tools/caloric-security/inventory/ is noindex — personal-data page; intentionally omitted.
    { url: `${SITE_URL}/tools/caloric-security/companions/`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/tools/fabrication/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/tools/forager-game/`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/kb/`, changeFrequency: "weekly", priority: 0.8 },
    // Survival Garden Plan landing — only listed when the funnel is public (NEXT_PUBLIC_SURVIVAL_PLAN_PUBLIC=true).
    // /survival-garden-plan/wizard/ and /success/[orderId]/ are noindex — gated pages, intentionally omitted.
    ...(isSurvivalPlanPublic()
      ? [{ url: `${SITE_URL}/survival-garden-plan/`, changeFrequency: "monthly" as const, priority: 0.9 }]
      : []),
    { url: `${SITE_URL}/archive/`, changeFrequency: "weekly", priority: 0.7 },
    // /requisition/ is the cart route — disallowed in robots.ts, so intentionally omitted here.
    { url: `${SITE_URL}/privacy/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/warranty/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms-of-fabrication/`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/shop/${p.id.toLowerCase()}/`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const archiveRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/archive/${p.slug}/`,
    lastModified: parsePostDate(p),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Thin/near-empty KB entries are noindex; keep them out of the sitemap too.
  const kbRoutes: MetadataRoute.Sitemap = getAllKbCrops()
    .filter(isKbCropIndexable)
    .map((crop) => ({
      url: `${SITE_URL}/kb/${crop.slug}/`,
      lastModified: parseCaptured(crop.source.captured),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  // Per-zone planting calendars. No lastmod: the schedule is derived from fixed
  // frost normals, so the page changes only when the crop data or the normals do.
  const zoneRoutes: MetadataRoute.Sitemap = ZONE_PAGES.map((zone) => ({
    url: `${SITE_URL}/tools/planting-calendar/zone/${zone}/`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...archiveRoutes, ...zoneRoutes, ...kbRoutes];
}
