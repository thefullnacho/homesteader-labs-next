// The paper field-notebook system, for @react-pdf/renderer.
//
// Shared by every printed document the site makes (the zone planner, the
// field guides) so they read as one family and a palette change lands in one
// place. The web equivalents are the CSS vars in app/globals.css and the hex
// literals in tailwind.config.ts; react-pdf can read neither.

import { Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export const paper = {
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
export const DISPLAY = "Helvetica-Bold";
export const DISPLAY_ITALIC = "Helvetica-BoldOblique";
export const MONO = "Courier";
export const MONO_BOLD = "Courier-Bold";
export const BODY = "Times-Roman";
export const BODY_BOLD = "Times-Bold";
export const BODY_ITALIC = "Times-Italic";
export const BODY_BOLD_ITALIC = "Times-BoldItalic";

const frame = StyleSheet.create({
  page: { backgroundColor: paper.paper, color: paper.ink, padding: 40, paddingBottom: 56, fontFamily: BODY, fontSize: 10 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    borderBottomWidth: 2, borderBottomColor: paper.ink, paddingBottom: 6, marginBottom: 18,
  },
  headerLeft: { fontFamily: MONO_BOLD, fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },
  headerRight: { fontFamily: MONO, fontSize: 7, color: paper.soil, textTransform: "uppercase" },

  footer: {
    position: "absolute", bottom: 28, left: 40, right: 40,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: paper.ink, paddingTop: 5,
  },
  footerText: { fontFamily: MONO, fontSize: 6.5, color: paper.soil, textTransform: "uppercase", letterSpacing: 0.5 },
});

/**
 * A LETTER page with the mono header rule and the page-numbered footer.
 *
 * `fixed` repeats the header on every page a long section wraps onto, which a
 * document of flowing prose needs and a one-page-per-section sheet does not
 * notice. `pageStyle` overrides the page itself, e.g. a white ground.
 */
export function PageFrame({
  left,
  right,
  footerLeft = "homesteaderlabs.com",
  fixedHeader = false,
  pageStyle,
  children,
}: {
  left: string;
  right: string;
  footerLeft?: string;
  fixedHeader?: boolean;
  pageStyle?: React.ComponentProps<typeof Page>["style"];
  children: React.ReactNode;
}) {
  return (
    <Page size="LETTER" style={pageStyle ? [frame.page, ...[pageStyle].flat()] : frame.page}>
      <View style={frame.header} fixed={fixedHeader}>
        <Text style={frame.headerLeft}>{left}</Text>
        <Text style={frame.headerRight}>{right}</Text>
      </View>
      {children}
      <View style={frame.footer} fixed>
        <Text style={frame.footerText}>{footerLeft}</Text>
        <Text style={frame.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}
