import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { getAllPosts } from "@/lib/posts";

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
    { url: `${SITE_URL}/tools/caloric-security/inventory/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/tools/caloric-security/companions/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/tools/fabrication/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
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

  return [...staticRoutes, ...productRoutes, ...archiveRoutes];
}
