import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { getAllPosts } from "@/lib/posts";
import { getAllKbCrops, isKbCropIndexable } from "@/lib/kb";
import { isSurvivalPlanPublic } from "@/lib/survivalPlan/visibility";

const SITE_URL = "https://homesteaderlabs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getAllProducts();
  const posts = getAllPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/shop/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/tools/planting-calendar/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/weather/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/caloric-security/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/caloric-security/roi/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    // /tools/caloric-security/inventory/ is noindex — personal-data page; intentionally omitted.
    { url: `${SITE_URL}/tools/caloric-security/companions/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/tools/fabrication/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/tools/forager-game/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/kb/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    // Survival Garden Plan landing — only listed when the funnel is public (NEXT_PUBLIC_SURVIVAL_PLAN_PUBLIC=true).
    // /survival-garden-plan/wizard/ and /success/[orderId]/ are noindex — gated pages, intentionally omitted.
    ...(isSurvivalPlanPublic()
      ? [{ url: `${SITE_URL}/survival-garden-plan/`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 }]
      : []),
    { url: `${SITE_URL}/archive/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    // /requisition/ is the cart route — disallowed in robots.ts, so intentionally omitted here.
    { url: `${SITE_URL}/privacy/`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/warranty/`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms-of-fabrication/`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/shop/${p.id.toLowerCase()}/`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const archiveRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/archive/${p.slug}/`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Thin/near-empty KB entries are noindex; keep them out of the sitemap too.
  const kbRoutes: MetadataRoute.Sitemap = getAllKbCrops()
    .filter(isKbCropIndexable)
    .map((crop) => ({
      url: `${SITE_URL}/kb/${crop.slug}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [...staticRoutes, ...productRoutes, ...archiveRoutes, ...kbRoutes];
}
