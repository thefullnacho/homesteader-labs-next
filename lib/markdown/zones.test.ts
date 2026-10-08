import { describe, it, expect } from "vitest";
import {
  zoneIndexMarkdown,
  zoneMarkdown,
  stateIndexMarkdown,
  stateMarkdown,
  zoneMarkdownPaths,
} from "./zones";
import { ZONE_PAGES } from "@/lib/tools/planting-calendar/zonePages";
import { STATE_PAGES } from "@/lib/tools/planting-calendar/statePages";

describe("zone markdown renderers", () => {
  describe("zoneIndexMarkdown", () => {
    const doc = zoneIndexMarkdown();

    it("renders at the correct path", () => {
      expect(doc.path).toBe("/tools/planting-calendar/zone/");
    });

    it("starts with the title", () => {
      expect(doc.body.startsWith("# Planting Calendar by Zone")).toBe(true);
    });

    it("has no em dashes", () => {
      expect(doc.body).not.toContain("—");
    });

    it("has only absolute links", () => {
      const linkMatches = doc.body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      for (const match of linkMatches) {
        const url = match.match(/\]\(([^)]+)\)/)?.[1];
        if (url && !url.startsWith("http")) {
          expect(url, `relative URL found: ${url}`).toMatch(/^https:\/\/homesteaderlabs\.com/);
        }
      }
    });
  });

  describe("zoneMarkdown", () => {
    it("returns null for non-page zones", () => {
      expect(zoneMarkdown("nope")).toBeNull();
      expect(zoneMarkdown("11a")).toBeNull();
    });

    it("renders a valid doc for all page zones", () => {
      for (const zone of ZONE_PAGES) {
        const doc = zoneMarkdown(zone);
        expect(doc).not.toBeNull();
        expect(doc!.path).toBe(`/tools/planting-calendar/zone/${zone}/`);
        expect(doc!.body.startsWith(`# Zone ${zone} Planting Calendar`)).toBe(true);
      }
    });

    it("shows the season has closed in zone 5a on Oct 7, 2026", () => {
      const doc = zoneMarkdown("5a", new Date(2026, 9, 7));
      expect(doc).not.toBeNull();
      expect(doc!.body).toContain(
        "Nothing. Every cool-season crop in the database now needs more days than zone 5a"
      );
      expect(doc!.body).not.toContain("| Sow by");
    });

    it("shows sowable crops in zone 9b on Oct 7, 2026 with October or November dates", () => {
      const doc = zoneMarkdown("9b", new Date(2026, 9, 7));
      expect(doc).not.toBeNull();
      expect(doc!.body).toContain("| Sow by");

      const lines = doc!.body.split("\n");
      const tableStartIdx = lines.findIndex((l) => l.includes("| Sow by"));
      const tableEndIdx = lines.findIndex((l, i) => i > tableStartIdx && l.trim() === "");

      if (tableEndIdx > tableStartIdx) {
        const tableLines = lines.slice(tableStartIdx + 2, tableEndIdx);
        for (const line of tableLines) {
          if (line.includes("|") && !line.startsWith("|---")) {
            expect(line).toMatch(/(October|November)/);
          }
        }
      }
    });

    it("has no em dashes", () => {
      for (const zone of ZONE_PAGES) {
        const doc = zoneMarkdown(zone);
        expect(doc!.body).not.toContain("—");
      }
    });

    it("has only absolute links", () => {
      for (const zone of ZONE_PAGES) {
        const doc = zoneMarkdown(zone);
        const linkMatches = doc!.body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        for (const match of linkMatches) {
          const url = match.match(/\]\(([^)]+)\)/)?.[1];
          if (url && !url.startsWith("http")) {
            expect(url).toMatch(/^https:\/\/homesteaderlabs\.com/);
          }
        }
      }
    });
  });

  describe("stateIndexMarkdown", () => {
    const doc = stateIndexMarkdown();

    it("renders at the correct path", () => {
      expect(doc.path).toBe("/tools/planting-calendar/state/");
    });

    it("starts with the title", () => {
      expect(doc.body.startsWith("# Planting Calendar by State")).toBe(true);
    });

    it("has no em dashes", () => {
      expect(doc.body).not.toContain("—");
    });

    it("has only absolute links", () => {
      const linkMatches = doc.body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      for (const match of linkMatches) {
        const url = match.match(/\]\(([^)]+)\)/)?.[1];
        if (url && !url.startsWith("http")) {
          expect(url).toMatch(/^https:\/\/homesteaderlabs\.com/);
        }
      }
    });
  });

  describe("stateMarkdown", () => {
    it("returns null for non-page states", () => {
      expect(stateMarkdown("atlantis")).toBeNull();
      expect(stateMarkdown("idaho")).toBeNull();
    });

    it("renders a valid doc for all page states", () => {
      for (const state of STATE_PAGES) {
        const doc = stateMarkdown(state);
        expect(doc).not.toBeNull();
        expect(doc!.path).toBe(`/tools/planting-calendar/state/${state}/`);
        expect(doc!.body.startsWith("# ")).toBe(true);
      }
    });

    it("has no em dashes", () => {
      for (const state of STATE_PAGES) {
        const doc = stateMarkdown(state);
        expect(doc!.body).not.toContain("—");
      }
    });

    it("has only absolute links", () => {
      for (const state of STATE_PAGES) {
        const doc = stateMarkdown(state);
        const linkMatches = doc!.body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        for (const match of linkMatches) {
          const url = match.match(/\]\(([^)]+)\)/)?.[1];
          if (url && !url.startsWith("http")) {
            expect(url).toMatch(/^https:\/\/homesteaderlabs\.com/);
          }
        }
      }
    });
  });

  describe("zoneMarkdownPaths", () => {
    const paths = zoneMarkdownPaths();

    it("includes the two index paths", () => {
      expect(paths).toContain("/tools/planting-calendar/zone/");
      expect(paths).toContain("/tools/planting-calendar/state/");
    });

    it("includes all zone pages", () => {
      for (const zone of ZONE_PAGES) {
        expect(paths).toContain(`/tools/planting-calendar/zone/${zone}/`);
      }
    });

    it("includes all state pages", () => {
      for (const state of STATE_PAGES) {
        expect(paths).toContain(`/tools/planting-calendar/state/${state}/`);
      }
    });

    it("has the correct count", () => {
      const expectedCount = 2 + ZONE_PAGES.length + STATE_PAGES.length;
      expect(paths.length).toBe(expectedCount);
    });
  });

  describe("rendered docs", () => {
    it("every path in zoneMarkdownPaths renders a non-null doc", () => {
      const paths = zoneMarkdownPaths();
      for (const path of paths) {
        if (path.includes("/zone/") && path !== "/tools/planting-calendar/zone/") {
          const zone = path.split("/").filter(Boolean).pop();
          const doc = zoneMarkdown(zone || "");
          expect(doc, `path ${path}`).not.toBeNull();
          expect(doc!.path).toBe(path);
        } else if (path.includes("/state/") && path !== "/tools/planting-calendar/state/") {
          const state = path.split("/").filter(Boolean).pop();
          const doc = stateMarkdown(state || "");
          expect(doc, `path ${path}`).not.toBeNull();
          expect(doc!.path).toBe(path);
        }
      }
    });

    it("index pages start with #", () => {
      const zoneIndex = zoneIndexMarkdown();
      const stateIndex = stateIndexMarkdown();
      expect(zoneIndex.body.startsWith("# ")).toBe(true);
      expect(stateIndex.body.startsWith("# ")).toBe(true);
    });
  });
});
