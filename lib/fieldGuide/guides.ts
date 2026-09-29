// Which notes get a printable field guide, and what print leaves out.
//
// The PDF is generated from the note's MDX at build time, so the text can only
// differ from the web page where it says so here. Every omission names its
// target exactly and a test fails if the target stops matching, so renaming a
// heading cannot silently put a web-only section back into print, or drop a
// real one.

export interface FieldGuideSpec {
  slug: string;
  /** Top-level sections (## headings) left out of print, by exact heading text. */
  omitSections?: string[];
  /** Paragraphs left out of print, by their opening words. */
  omitParagraphs?: string[];
  /**
   * Images that get a page to themselves, by src. For printable charts, which
   * are unreadable at the height a photograph gets.
   */
  fullPageImages?: string[];
}

export const FIELD_GUIDES: FieldGuideSpec[] = [
  {
    slug: "wild-berry-guide",
    // Addressed to someone reading on a screen: a plug for an in-browser tool,
    // a request for comments, and a note on the page's revision history.
    omitSections: ["A second opinion that knows when to shut up"],
    omitParagraphs: ["Housekeeping before we start"],
    fullPageImages: ["/images/wild-berry-field-chart.png"],
  },
];

export function getFieldGuide(slug: string): FieldGuideSpec | undefined {
  return FIELD_GUIDES.find((g) => g.slug === slug);
}

/** The public filename, which is also the route segment. */
export function fieldGuideFile(slug: string): string {
  return `${slug}.pdf`;
}
