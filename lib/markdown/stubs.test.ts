import { describe, it, expect } from "vitest";
import { STUB_PAGES, stubMarkdown, stubPaths } from "./stubs";
import sitemap from "@/app/sitemap";
import { getAllProducts } from "@/lib/products";

describe("Stub Page Renderers", () => {
  describe("STUB_PAGES", () => {
    it("has title and summary for every page", () => {
      for (const info of Object.values(STUB_PAGES)) {
        expect(info.title).toBeDefined();
        expect(info.title.length).toBeGreaterThan(0);
        expect(info.summary).toBeDefined();
        expect(info.summary.length).toBeGreaterThan(0);
      }
    });

    it("has no em dashes in any title or summary", () => {
      for (const [path, info] of Object.entries(STUB_PAGES)) {
        expect(info.title, `${path} title`).not.toContain("—");
        expect(info.summary, `${path} summary`).not.toContain("—");
        if (info.extra) {
          expect(info.extra, `${path} extra`).not.toContain("—");
        }
      }
    });
  });

  describe("stubMarkdown", () => {
    it("returns null for unknown paths", () => {
      const doc = stubMarkdown("/this/does/not/exist/");
      expect(doc).toBeNull();
    });

    it("renders a non-null doc for every stub page", () => {
      for (const path of Object.keys(STUB_PAGES)) {
        const doc = stubMarkdown(path);
        expect(doc, `Path ${path}`).not.toBeNull();
        expect(doc!.path).toBe(path);
        expect(doc!.title).toBeTruthy();
        expect(doc!.body).toMatch(/^# /);
      }
    });

    it("renders product pages dynamically", () => {
      const products = getAllProducts();
      for (const product of products) {
        const path = `/shop/${product.id.toLowerCase()}/`;
        const doc = stubMarkdown(path);
        expect(doc, `Product ${product.id}`).not.toBeNull();
        expect(doc!.path).toBe(path);
        expect(doc!.title).toBe(product.name);
        expect(doc!.body).toContain(product.description);
      }
    });

    it("starts body with a title heading", () => {
      for (const path of Object.keys(STUB_PAGES)) {
        const doc = stubMarkdown(path);
        expect(doc!.body).toMatch(/^# /);
      }
    });

    it("uses only absolute URLs", () => {
      for (const path of Object.keys(STUB_PAGES)) {
        const doc = stubMarkdown(path);
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = linkRegex.exec(doc!.body)) !== null) {
          const url = match[2];
          expect(url, `Link in ${path}: ${match[1]}`).toMatch(/^https?:\/\//);
        }
      }
    });

    it("has no em dashes in any rendered body", () => {
      for (const path of Object.keys(STUB_PAGES)) {
        const doc = stubMarkdown(path);
        expect(doc!.body, `Body of ${path}`).not.toContain("—");
      }
    });
  });

  describe("stubPaths", () => {
    it("returns all stub page paths", () => {
      const paths = stubPaths();
      for (const path of Object.keys(STUB_PAGES)) {
        expect(paths).toContain(path);
      }
    });

    it("returns all product paths", () => {
      const paths = stubPaths();
      const products = getAllProducts();
      for (const product of products) {
        const path = `/shop/${product.id.toLowerCase()}/`;
        expect(paths).toContain(path);
      }
    });

    it("is sorted", () => {
      const paths = stubPaths();
      expect(paths).toEqual([...paths].sort());
    });
  });

  describe("stub coverage per sitemap", () => {
    it("has a stub for every sitemap URL except KB, archive, zone, state", () => {
      const sitemapUrls = sitemap();
      const SITE_URL = "https://homesteaderlabs.com";

      // Paths that should NOT have stubs (dedicated renderers in lib/markdown)
      const excludedPrefixes = [
        "/kb/",
        "/archive/",
        "/tools/planting-calendar/zone/",
        "/tools/planting-calendar/state/",
      ];
      const excludedExact = ["/", "/builds/", "/foraging/"];

      const isExcluded = (path: string) => {
        return excludedExact.includes(path) || excludedPrefixes.some((prefix) => path.startsWith(prefix));
      };

      const paths = stubPaths();

      for (const entry of sitemapUrls) {
        const fullPath = entry.url;
        if (!fullPath.startsWith(SITE_URL)) continue;

        const path = fullPath.slice(SITE_URL.length) || "/";
        if (isExcluded(path)) continue;

        // Every other sitemap URL should have a stub
        expect(paths, `Missing stub for sitemap URL: ${path}`).toContain(path);
      }
    });
  });
});
