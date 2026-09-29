// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { FIELD_GUIDES } from "./guides";
import { applyOmissions, parseMdx, textOf } from "./parse";
import { buildFieldGuide, renderFieldGuidePdf } from "./generator";
import { buildFieldGuideDocument } from "./render";
import { getPostBySlug } from "@/lib/posts";

const source = (slug: string) =>
  readFileSync(path.join(process.cwd(), "content/archive", `${slug}.mdx`), "utf8");

describe("field guides", () => {
  describe.each(FIELD_GUIDES)("$slug", (spec) => {
    it("has a note behind it", () => {
      expect(getPostBySlug(spec.slug)).not.toBeNull();
    });

    // A renamed heading or reworded paragraph must fail here, not quietly
    // print a web-only section or drop a real one.
    it("resolves every omission to exactly one target", () => {
      expect(() => applyOmissions(parseMdx(source(spec.slug)), spec)).not.toThrow();
    });

    it("lists only full-page images the note actually shows", () => {
      const srcs = [...source(spec.slug).matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);
      for (const img of spec.fullPageImages ?? []) expect(srcs).toContain(img);
    });

    // Build-time coverage: every node in the note has a print mapping.
    it("maps every node in the note", () => {
      expect(() => buildFieldGuide(spec.slug)).not.toThrow();
    });
  });

  it("renders the berry guide to a PDF", async () => {
    const pdf = await renderFieldGuidePdf("wild-berry-guide");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500_000); // the photographs are embedded, not linked
  }, 30_000);
});

describe("applyOmissions", () => {
  const mdx = [
    "Intro. Housekeeping first.",
    "",
    "Keep this intro.",
    "",
    "## Keep",
    "",
    "Kept body.",
    "",
    "## Plug",
    "",
    "Plug body.",
    "",
    "---",
    "",
    "Disclaimer.",
  ].join("\n");
  const texts = (spec: Parameters<typeof applyOmissions>[1]) =>
    applyOmissions(parseMdx(mdx), spec).children.map((n) => textOf(n));

  it("drops a section up to the next rule, keeping the end matter after it", () => {
    expect(texts({ slug: "t", omitSections: ["Plug"] })).toEqual([
      "Intro. Housekeeping first.",
      "Keep this intro.",
      "Keep",
      "Kept body.",
      "",
      "Disclaimer.",
    ]);
  });

  it("drops a paragraph by its opening words", () => {
    expect(texts({ slug: "t", omitParagraphs: ["Intro."] })).not.toContain("Intro. Housekeeping first.");
  });

  it("throws when a target no longer matches", () => {
    expect(() => texts({ slug: "t", omitSections: ["Renamed"] })).toThrow(/"Renamed" matched 0 times/);
  });
});

describe("render", () => {
  const post = getPostBySlug("wild-berry-guide")!;
  const build = (mdx: string) =>
    buildFieldGuideDocument({ post, postNo: "000", tree: parseMdx(mdx), spec: { slug: "t" } });

  it("refuses MDX it has no print mapping for, naming the node and line", () => {
    expect(() => build("Text.\n\n<FieldVideo src=\"/v.mp4\" />")).toThrow(
      /no print mapping for MDX node "mdxJsxFlowElement" at line 3/,
    );
    expect(() => build("| a |\n| - |\n| b |")).toThrow(/"table"/);
  });

  it("refuses an image it cannot embed", () => {
    expect(() => build("![missing](/images/does-not-exist.jpg)")).toThrow(/must be a local JPEG or PNG/);
  });

  it("renders inline styles, links and lists", async () => {
    const doc = build("## Head\n\n### Sub *Latin*\n\nA **bold** *it* `code` [link](/archive/x/).\n\n1. one\n2. two\n\n- a\n");
    const pdf = await renderToBuffer(doc as React.ReactElement<import("@react-pdf/renderer").DocumentProps>);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
