import { readFileSync } from "fs";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { getPostBySlug, getPostNo } from "@/lib/posts";
import { getFieldGuide } from "./guides";
import { applyOmissions, parseMdx } from "./parse";
import { buildFieldGuideDocument } from "./render";

/**
 * The field guide for a note, as a document element. Reads the MDX file the
 * page itself is compiled from, so the two cannot disagree. Throws if the note
 * has no guide, or if anything in it cannot be printed faithfully.
 */
export function buildFieldGuide(slug: string): React.ReactElement {
  const spec = getFieldGuide(slug);
  const post = getPostBySlug(slug);
  if (!spec || !post) throw new Error(`[field-guide] no field guide for "${slug}"`);

  const source = readFileSync(path.join(process.cwd(), "content/archive", `${slug}.mdx`), "utf8");
  const tree = applyOmissions(parseMdx(source), spec);
  return buildFieldGuideDocument({ post, postNo: getPostNo(slug), tree, spec });
}

export async function renderFieldGuidePdf(slug: string): Promise<Buffer> {
  return renderToBuffer(
    // Same DocumentProps cast as lib/zonePlanner and lib/survivalPlan; the
    // element is a Document at runtime.
    buildFieldGuide(slug) as React.ReactElement<import("@react-pdf/renderer").DocumentProps>,
  );
}
