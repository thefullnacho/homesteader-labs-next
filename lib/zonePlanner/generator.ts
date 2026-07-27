import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { buildPlannerData, type PlannerSeason } from "./plannerData";
import { PlannerDocument } from "./plannerTemplate";
import type { PageZone } from "@/lib/tools/planting-calendar/zonePages";

/**
 * Renders the free zone planner. `from` is injectable so tests can pin a date;
 * every deadline on the sheet is relative to it.
 */
export async function renderZonePlannerPdf(
  zone: PageZone,
  season: PlannerSeason = "fall",
  from: Date = new Date(),
): Promise<Buffer> {
  const data = buildPlannerData(zone, season, from);
  return renderToBuffer(
    // @react-pdf/renderer's DocumentProps inference is overly strict here; the
    // element returns a Document at runtime. Same cast as lib/survivalPlan.
    React.createElement(PlannerDocument, { data }) as React.ReactElement<
      import("@react-pdf/renderer").DocumentProps
    >,
  );
}
