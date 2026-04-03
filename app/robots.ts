import { MetadataRoute } from "next";

const SITE_URL = "https://homesteaderlabs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/requisition/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
