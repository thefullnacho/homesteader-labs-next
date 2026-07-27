import { describe, it, expect } from "vitest";
import { buildPlannerData } from "./plannerData";
import { renderZonePlannerPdf } from "./generator";
import { ZONE_PAGES } from "@/lib/tools/planting-calendar/zonePages";

// Pinned so the deadlines under test do not move with the wall clock.
const AUGUST = new Date("2026-08-05T12:00:00Z");
const DECEMBER = new Date("2026-12-20T12:00:00Z");

describe("zone planner data", () => {
  it.each(ZONE_PAGES)("%s: builds without throwing", (zone) => {
    expect(() => buildPlannerData(zone, "fall", AUGUST)).not.toThrow();
  });

  it.each(ZONE_PAGES)("%s: sowing deadlines are all in the future", (zone) => {
    const d = buildPlannerData(zone, "fall", AUGUST);
    for (const row of d.sowing) {
      expect(row.sowBy.getTime(), `${zone} ${row.cropName}`).toBeGreaterThanOrEqual(AUGUST.getTime());
    }
  });

  it.each(ZONE_PAGES)("%s: autumn allowance is applied, never the bare packet figure", (zone) => {
    const d = buildPlannerData(zone, "fall", AUGUST);
    for (const row of d.sowing) {
      expect(row.adjustedDays, `${zone} ${row.cropName}`).toBeGreaterThan(row.daysToMaturity);
    }
  });

  // zonePages.ts documents this list as "latest-deadline first". It is not; it
  // is earliest first, and trusting the comment put the most urgent deadline on
  // the cover labelled as the last one. Pinned here so it cannot drift back.
  it("orders the sowing list earliest deadline first", () => {
    const d = buildPlannerData("6a", "fall", AUGUST);
    const times = d.sowing.map((r) => r.sowBy.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("reads next and last deadline off the right ends of the list", () => {
    const d = buildPlannerData("6a", "fall", AUGUST);
    expect(d.daysToNextDeadline).not.toBeNull();
    expect(d.daysToLastDeadline).toBeGreaterThan(d.daysToNextDeadline!);
  });

  it("reports a closed season honestly rather than inventing rows", () => {
    const d = buildPlannerData("5a", "fall", DECEMBER);
    expect(d.sowing).toHaveLength(0);
    expect(d.daysToNextDeadline).toBeNull();
    expect(d.daysToLastDeadline).toBeNull();
  });

  it("only lists pests for crops actually on the sowing list", () => {
    const d = buildPlannerData("7a", "fall", AUGUST);
    const names = new Set(d.sowing.map((r) => r.cropName));
    for (const p of d.pests) expect(names).toContain(p.cropName);
  });

  it("ranks pest companions best-evidence first", () => {
    const d = buildPlannerData("7a", "fall", AUGUST);
    const rank: Record<string, number> = { strong: 0, moderate: 1, anecdotal: 2 };
    const seen = d.pests.map((p) => rank[p.evidenceLevel] ?? 9);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });
});

describe("zone planner PDF", () => {
  it.each(ZONE_PAGES)("%s: renders a real PDF", async (zone) => {
    const buf = await renderZonePlannerPdf(zone, "fall", AUGUST);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  }, 30_000);

  it("renders the closed-season case without a table", async () => {
    const buf = await renderZonePlannerPdf("5a", "fall", DECEMBER);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  }, 30_000);
});
