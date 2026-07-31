/**
 * Shared JSON-LD nodes.
 *
 * The Organization and WebSite are emitted once, sitewide, from the root layout,
 * and every page-level node points at them by `@id` instead of restating them.
 * Repeating a publisher block on each route is how the copies drift, and a graph
 * that describes the same organisation three slightly different ways is worse
 * than one that describes it once.
 *
 * Nothing in here is aspirational. There is no `sameAs`, because no social
 * profile is actually maintained, and no `SearchAction`, because the KB search
 * runs client-side over a static list and has no crawlable query URL. Declaring
 * either would be inventing a fact about the site.
 */

export const SITE_URL = "https://homesteaderlabs.com";

/** Stable node ids so page-level graphs can reference rather than repeat. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const LOGO_URL = `${SITE_URL}/images/homesteaderlabs_logo_flask_seedlingv2.jpeg`;

/** Reference form: use inside a page-level node's `publisher` / `isPartOf`. */
export const orgRef = { "@id": ORG_ID };
export const siteRef = { "@id": WEBSITE_ID };

/** The sitewide graph. Emitted once from the root layout, nowhere else. */
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "Homesteader Labs",
        url: SITE_URL,
        description:
          "Off-grid planning tools and field-tested hardware for self-reliant homesteaders.",
        logo: {
          "@type": "ImageObject",
          url: LOGO_URL,
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Homesteader Labs",
        url: SITE_URL,
        inLanguage: "en",
        publisher: orgRef,
      },
    ],
  };
}

export interface Crumb {
  name: string;
  /** Path relative to the site root, with the trailing slash the site enforces. */
  path: string;
}

/**
 * BreadcrumbList node.
 *
 * This is the piece search engines actually render in a result, so it is worth
 * having on every page that sits below the root.
 */
export function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/** Wraps page-level nodes into a document, with the shared context applied once. */
export function pageGraph(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
