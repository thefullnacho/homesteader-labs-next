import { MetadataRoute } from "next";

const SITE_URL = "https://homesteaderlabs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // The public reference endpoints are allowed on purpose. /api/ is still
      // closed by default, because the rest of it is checkout, webhooks, and
      // the mailing list. A more specific Allow wins over a broader Disallow.
      allow: ["/", "/api/zone/", "/api/frost/", "/api/pests/"],
      disallow: ["/api/", "/requisition/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
