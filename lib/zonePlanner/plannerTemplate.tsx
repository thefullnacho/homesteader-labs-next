import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PlannerData } from "./plannerData";

// Paper field-notebook palette, matching app/globals.css. The older survival
// plan PDF is on the retired dark palette; this one is light because it exists
// to be printed and carried outside, and nobody prints a solid black page.
const c = {
  paper: "#f5f0e2",
  kraft: "#e9ddc1",
  manila: "#efe5cc",
  ink: "#26221a",
  soil: "#5a4630",
  marker: "#e4571f",
  moss: "#5c6b3c",
  rust: "#a8442a",
  slate: "#3f5d6b",
};

// @react-pdf ships Helvetica, Courier and Times only, and no font files are
// vendored in this repo. Mapping the site's roles onto the built-ins avoids a
// font-loading failure mode in a serverless render for a cosmetic gain.
const DISPLAY = "Helvetica-Bold";
const MONO = "Courier";
const MONO_BOLD = "Courier-Bold";
const BODY = "Times-Roman";
const BODY_ITALIC = "Times-Italic";

// LETTER is 612pt wide, less 40pt page padding each side, less the wrapper's
// 2pt border each side, leaves 528pt. 22 columns of 24pt fills it exactly, so
// the frame lands flush with the text column above it.
const GRID_CELL = 24;
const GRID_COLS = 22;
const GRID_ROWS = 18;

const s = StyleSheet.create({
  page: { backgroundColor: c.paper, color: c.ink, padding: 40, paddingBottom: 56, fontFamily: BODY, fontSize: 10 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    borderBottomWidth: 2, borderBottomColor: c.ink, paddingBottom: 6, marginBottom: 18,
  },
  headerLeft: { fontFamily: MONO_BOLD, fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },
  headerRight: { fontFamily: MONO, fontSize: 7, color: c.soil, textTransform: "uppercase" },

  zoneMega: { fontFamily: DISPLAY, fontSize: 68, color: c.ink, letterSpacing: -2 },
  title: { fontFamily: DISPLAY, fontSize: 20, textTransform: "uppercase", marginTop: 4 },
  deck: { fontFamily: BODY_ITALIC, fontSize: 11, color: c.soil, marginTop: 6, lineHeight: 1.4 },

  h2: { fontFamily: DISPLAY, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  sectionNo: { fontFamily: MONO_BOLD, fontSize: 8, color: c.marker, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },

  statRow: { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 16 },
  stat: { flex: 1, borderWidth: 1, borderColor: c.ink, backgroundColor: c.manila, padding: 10 },
  statLabel: { fontFamily: MONO, fontSize: 6.5, color: c.soil, textTransform: "uppercase", letterSpacing: 0.6 },
  statValue: { fontFamily: MONO_BOLD, fontSize: 15, marginTop: 4 },
  statNote: { fontFamily: MONO, fontSize: 6.5, color: c.soil, marginTop: 2 },

  callout: { borderWidth: 2, borderColor: c.ink, backgroundColor: c.kraft, padding: 12, marginBottom: 14 },
  calloutHead: { fontFamily: DISPLAY, fontSize: 11, textTransform: "uppercase", marginBottom: 5 },
  calloutBody: { fontSize: 9.5, lineHeight: 1.5, color: c.ink },

  th: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: c.ink, paddingBottom: 4, marginBottom: 2 },
  thText: { fontFamily: MONO_BOLD, fontSize: 7, textTransform: "uppercase", letterSpacing: 0.6 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.kraft, paddingVertical: 5, alignItems: "center" },
  td: { fontFamily: MONO, fontSize: 8.5 },
  tdName: { fontFamily: MONO_BOLD, fontSize: 9 },

  colCrop: { flex: 2.2 },
  colDate: { flex: 1.3 },
  colNum: { flex: 1, textAlign: "right" },
  colWide: { flex: 2 },

  urgent: { color: c.rust, fontFamily: MONO_BOLD },

  note: { fontFamily: BODY_ITALIC, fontSize: 8.5, color: c.soil, marginTop: 8, lineHeight: 1.4 },

  checkRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 7, gap: 7 },
  checkBox: { width: 10, height: 10, borderWidth: 1, borderColor: c.ink, marginTop: 1 },
  checkText: { flex: 1, fontSize: 9.5, lineHeight: 1.4 },

  // alignSelf keeps the border hugging the cells. Left to stretch, the wrapper
  // fills the content width while the rows only fill GRID_COLS * cell width,
  // and the difference renders as an empty gutter inside the frame that reads
  // as a final column with no row lines.
  gridWrap: { borderWidth: 2, borderColor: c.ink, marginTop: 8, alignSelf: "flex-start" },
  gridRow: { flexDirection: "row" },
  gridCell: { width: GRID_CELL, height: GRID_CELL, borderWidth: 0.5, borderColor: c.soil },

  footer: {
    position: "absolute", bottom: 28, left: 40, right: 40,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: c.ink, paddingTop: 5,
  },
  footerText: { fontFamily: MONO, fontSize: 6.5, color: c.soil, textTransform: "uppercase", letterSpacing: 0.5 },
});

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PageFrame({ section, zone, children }: { section: string; zone: string; children: React.ReactNode }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.header}>
        <Text style={s.headerLeft}>{section}</Text>
        <Text style={s.headerRight}>Zone {zone} / Homesteader Labs</Text>
      </View>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>homesteaderlabs.com</Text>
        <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}

export function PlannerDocument({ data }: { data: PlannerData }) {
  const { zone, sowing, pests } = data;
  const seasonOver = sowing.length === 0;

  return (
    <Document title={`Zone ${zone} Fall Planting Planner`} author="Homesteader Labs">
      {/* ---------- 1. COVER ---------- */}
      <PageFrame section="Fall Planner" zone={zone}>
        <Text style={s.sectionNo}>§1 Where you stand</Text>
        <Text style={s.zoneMega}>{zone.toUpperCase()}</Text>
        <Text style={s.title}>Fall Planting Planner</Text>
        <Text style={s.deck}>
          Sowing deadlines counted back from your first frost, the pests worth watching for what
          is still going in, and a blank grid for the part only you can do.
        </Text>

        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statLabel}>First fall frost</Text>
            <Text style={s.statValue}>{fmt(data.firstFallFrost)}</Text>
            <Text style={s.statNote}>±{data.frostVarianceDays} days</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Frost-free days</Text>
            <Text style={s.statValue}>{data.frostFreeDays}</Text>
            <Text style={s.statNote}>per season</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Still sowable</Text>
            <Text style={s.statValue}>{sowing.length}</Text>
            <Text style={s.statNote}>
              {data.daysToNextDeadline !== null
                ? `next in ${data.daysToNextDeadline}d, last in ${data.daysToLastDeadline}d`
                : "season closed"}
            </Text>
          </View>
        </View>

        <View style={s.callout}>
          <Text style={s.calloutHead}>{data.constraintHeadline}</Text>
          <Text style={s.calloutBody}>{data.constraintBody}</Text>
        </View>

        <Text style={s.note}>
          Dates are computed from NOAA frost normals for zone {zone} and are averages, not
          promises. Your own ground, slope and shelter move them by a week in either direction, so
          treat the deadlines as the last sensible day rather than a target. Generated{" "}
          {data.generatedOn.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
        </Text>
      </PageFrame>

      {/* ---------- 2. SOWING SCHEDULE ---------- */}
      <PageFrame section="Sowing Deadlines" zone={zone}>
        <Text style={s.sectionNo}>§2 What still finishes</Text>
        <Text style={s.h2}>Sow by these dates</Text>

        {seasonOver ? (
          <View style={s.callout}>
            <Text style={s.calloutHead}>The window has closed</Text>
            <Text style={s.calloutBody}>
              Nothing on our list still finishes before your first frost. That is the honest answer
              rather than a reason to sow anyway. Turn to the planning grid, order garlic, and use
              the remaining weeks on beds and compost for next year.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.th}>
              <Text style={[s.thText, s.colCrop]}>Crop</Text>
              <Text style={[s.thText, s.colDate]}>Sow by</Text>
              <Text style={[s.thText, s.colNum]}>Days</Text>
              <Text style={[s.thText, s.colNum]}>Kcal/plant</Text>
              <Text style={[s.thText, s.colNum]}>Stores</Text>
            </View>
            {sowing.map((r) => {
              const days = Math.ceil((r.sowBy.getTime() - data.generatedOn.getTime()) / 86_400_000);
              return (
                <View key={r.cropId} style={s.tr} wrap={false}>
                  <Text style={[s.tdName, s.colCrop]}>{r.cropName}</Text>
                  <Text style={[s.td, s.colDate, days <= 14 ? s.urgent : {}]}>
                    {fmt(r.sowBy)}{days <= 14 ? ` (${days}d)` : ""}
                  </Text>
                  <Text style={[s.td, s.colNum]}>{r.adjustedDays}</Text>
                  <Text style={[s.td, s.colNum]}>{r.caloriesPerPlant ? Math.round(r.caloriesPerPlant) : "—"}</Text>
                  <Text style={[s.td, s.colNum]}>{r.storageLifeDays ? `${r.storageLifeDays}d` : "—"}</Text>
                </View>
              );
            })}
            <Text style={s.note}>
              Days shown include a {14}-day autumn allowance on top of the seed packet figure.
              Packet maturity numbers are measured in lengthening summer days; the same crop sown
              into shortening, cooling autumn days takes noticeably longer, and ignoring that is
              the single most common reason a fall sowing does not finish. Anything marked in red
              is inside a fortnight.
            </Text>
          </>
        )}
      </PageFrame>

      {/* ---------- 3. PEST WATCH ---------- */}
      <PageFrame section="Pest Watch" zone={zone}>
        <Text style={s.sectionNo}>§3 What will find it</Text>
        <Text style={s.h2}>Pests for what you are sowing</Text>

        {pests.length === 0 ? (
          <Text style={s.calloutBody}>
            No pest entries for the crops still sowable in your zone this late.
          </Text>
        ) : (
          <>
            <View style={s.th}>
              <Text style={[s.thText, s.colCrop]}>Crop</Text>
              <Text style={[s.thText, s.colDate]}>Pest</Text>
              <Text style={[s.thText, s.colWide]}>Companion</Text>
              <Text style={[s.thText, s.colDate]}>Placement</Text>
              <Text style={[s.thText, s.colNum]}>Evidence</Text>
            </View>
            {pests.map((p, i) => (
              <View key={`${p.cropName}-${p.pestName}-${i}`} style={s.tr} wrap={false}>
                <Text style={[s.tdName, s.colCrop]}>{p.cropName}</Text>
                <Text style={[s.td, s.colDate]}>{p.pestName}</Text>
                <Text style={[s.td, s.colWide]}>{p.companion}</Text>
                <Text style={[s.td, s.colDate]}>{p.placement}</Text>
                <Text style={[s.td, s.colNum]}>{p.evidenceLevel}</Text>
              </View>
            ))}
            <Text style={s.note}>
              Evidence is rated honestly: strong means consistent recommendation plus supporting
              study, anecdotal means gardeners repeat it and nobody has measured it. A trap crop
              only works if you pull it once it loads up, since one left in place becomes a
              breeding reservoir at the edge of the bed. If you are not willing to pull a
              healthy-looking plant on purpose, skip the technique rather than do half of it.
            </Text>
          </>
        )}
      </PageFrame>

      {/* ---------- 4. THE GRID ---------- */}
      <PageFrame section="Planning Grid" zone={zone}>
        <Text style={s.sectionNo}>§4 The part only you can do</Text>
        <Text style={s.h2}>Draw your beds</Text>
        <Text style={s.calloutBody}>
          We know the dates. You know where the shade falls, where the hose reaches and which bed
          floods. So this page is deliberately blank. One square is one foot.
        </Text>

        <View style={s.gridWrap}>
          {Array.from({ length: GRID_ROWS }).map((_, y) => (
            <View key={y} style={s.gridRow}>
              {Array.from({ length: GRID_COLS }).map((__, x) => (
                <View key={x} style={s.gridCell} />
              ))}
            </View>
          ))}
        </View>

        <Text style={[s.h2, { marginTop: 18 }]}>Before you sow</Text>
        {[
          "Work out which beds are free, and when. A deadline you cannot plant into is not a deadline.",
          "Order seed for anything inside a fortnight now. Shipping is part of the window.",
          "Put transplants in during the evening, or on an overcast day. Midday sun on a fresh transplant undoes a week.",
          "Water new sowings daily until they are up. Autumn soil dries faster than it looks.",
          "Note the date you actually sowed each row, next to our deadline. Next year that comparison is worth more than this sheet.",
        ].map((t, i) => (
          <View key={i} style={s.checkRow}>
            <View style={s.checkBox} />
            <Text style={s.checkText}>{t}</Text>
          </View>
        ))}
      </PageFrame>
    </Document>
  );
}
