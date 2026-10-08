import { describe, it, expect } from "vitest";
import { kbIndexMarkdown, kbMarkdown, kbMarkdownPaths } from "./kb";
import { getKbSlugs, isKbCropIndexable, getAllKbCrops, KB_RETIRED } from "@/lib/kb";
import { abs } from "./doc";

describe("KB Markdown Renderers", () => {
  describe("kbIndexMarkdown", () => {
    it("returns a doc with path /kb/", () => {
      const doc = kbIndexMarkdown();
      expect(doc.path).toBe("/kb/");
    });

    it("starts body with the title", () => {
      const doc = kbIndexMarkdown();
      expect(doc.body).toMatch(/^# Crop Knowledge Base/);
    });

    it("lists every crop, as the index page does", () => {
      const doc = kbIndexMarkdown();
      getAllKbCrops().forEach((crop) => {
        expect(doc.body).toContain(crop.name);
      });
    });

    it("mentions CC0 and OpenFarm", () => {
      const doc = kbIndexMarkdown();
      expect(doc.body).toContain("CC0");
      expect(doc.body).toContain("OpenFarm");
    });

    it("uses absolute URLs for links", () => {
      const doc = kbIndexMarkdown();
      const absUrl = abs("/kb/");
      expect(doc.body).toContain(absUrl);
    });

    it("has no em dashes", () => {
      const doc = kbIndexMarkdown();
      expect(doc.body).not.toContain("—");
    });
  });

  describe("kbMarkdown", () => {
    it("returns null for an unknown slug", () => {
      const doc = kbMarkdown("not-a-crop");
      expect(doc).toBeNull();
    });

    it("returns null for a retired slug", () => {
      const retiredSlug = Array.from(KB_RETIRED.keys())[0];
      const doc = kbMarkdown(retiredSlug);
      expect(doc).toBeNull();
    });

    it("renders thin crops too, since their pages exist (noindex, not missing)", () => {
      const thinCrop = getAllKbCrops().find((c) => !isKbCropIndexable(c));
      expect(thinCrop).toBeDefined();
      expect(kbMarkdown(thinCrop!.slug)?.path).toBe(`/kb/${thinCrop!.slug}/`);
    });

    it("renders an indexable crop with title and description", () => {
      const indexable = getAllKbCrops().find(isKbCropIndexable);
      if (!indexable) {
        // Skip if no indexable crops exist
        expect(true).toBe(true);
        return;
      }

      const doc = kbMarkdown(indexable.slug);
      expect(doc).not.toBeNull();
      expect(doc!.path).toBe(`/kb/${indexable.slug}/`);
      expect(doc!.body).toMatch(/^# /);
      expect(doc!.body).toContain(indexable.name);
    });

    it("includes specs table when specs exist", () => {
      const withSpecs = getAllKbCrops().find(
        (c) => isKbCropIndexable(c) && (c.sun || c.sowingMethod)
      );
      if (!withSpecs) return;

      const doc = kbMarkdown(withSpecs.slug);
      expect(doc).not.toBeNull();
      if (withSpecs.sun) {
        expect(doc!.body).toContain(withSpecs.sun);
      }
    });

    it("includes companion links as markdown links", () => {
      const withCompanions = getAllKbCrops().find(
        (c) =>
          isKbCropIndexable(c) &&
          c.companions &&
          c.companions.length > 0
      );
      if (!withCompanions) return;

      const doc = kbMarkdown(withCompanions.slug);
      expect(doc).not.toBeNull();
      // Should have a "Companion Crops" section with links
      expect(doc!.body).toContain("Companion");
    });

    it("includes calculator link when calculatorCropId is set", () => {
      const withCalc = getAllKbCrops().find(
        (c) =>
          isKbCropIndexable(c) && c.calculatorCropId
      );
      if (!withCalc) return;

      const doc = kbMarkdown(withCalc.slug);
      expect(doc).not.toBeNull();
      expect(doc!.body).toContain("planting calendar");
      expect(doc!.body).toContain(abs("/tools/planting-calendar/"));
    });

    it("includes source and license footer", () => {
      const indexable = getAllKbCrops().find(isKbCropIndexable);
      if (!indexable) return;

      const doc = kbMarkdown(indexable.slug);
      expect(doc).not.toBeNull();
      expect(doc!.body).toContain("Source");
      expect(doc!.body).toContain(indexable.source.license);
      expect(doc!.body).toContain(indexable.source.origin);
    });

    it("uses only absolute URLs", () => {
      const indexable = getAllKbCrops().find(isKbCropIndexable);
      if (!indexable) return;

      const doc = kbMarkdown(indexable.slug);
      expect(doc).not.toBeNull();
      // All markdown links should be absolute
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(doc!.body)) !== null) {
        const url = match[2];
        expect(url).toMatch(/^https?:\/\//);
      }
    });

    it("has no em dashes", () => {
      const indexable = getAllKbCrops().find(isKbCropIndexable);
      if (!indexable) return;

      const doc = kbMarkdown(indexable.slug);
      expect(doc).not.toBeNull();
      expect(doc!.body).not.toContain("—");
    });
  });

  describe("kbMarkdownPaths", () => {
    it("starts with /kb/", () => {
      const paths = kbMarkdownPaths();
      expect(paths[0]).toBe("/kb/");
    });

    it("includes every crop the page route generates", () => {
      const paths = new Set(kbMarkdownPaths());
      for (const slug of getKbSlugs()) expect(paths.has(`/kb/${slug}/`), slug).toBe(true);
    });

    it("matches the paths returned by kbMarkdown that render non-null", () => {
      const paths = kbMarkdownPaths();
      for (const path of paths) {
        if (path === "/kb/") {
          const doc = kbIndexMarkdown();
          expect(doc.path).toBe(path);
        } else {
          const slug = path.slice(4, -1); // Remove /kb/ and trailing /
          const doc = kbMarkdown(slug);
          expect(doc).not.toBeNull();
          expect(doc!.path).toBe(path);
        }
      }
    });
  });
});
