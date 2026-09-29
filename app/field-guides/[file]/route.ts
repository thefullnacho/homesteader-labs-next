import { FIELD_GUIDES, fieldGuideFile } from "@/lib/fieldGuide/guides";
import { renderFieldGuidePdf } from "@/lib/fieldGuide/generator";

// Printable field guides, e.g. /field-guides/wild-berry-guide.pdf.
//
// Rendered once per build from the note's MDX and served as a static file, so
// every deploy that changes a note reprints its guide and no request ever
// renders one. A note that cannot be printed faithfully fails the build rather
// than shipping a guide that disagrees with the page (see lib/fieldGuide).

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return FIELD_GUIDES.map((g) => ({ file: fieldGuideFile(g.slug) }));
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ file: string }> }
) {
  const { file } = await ctx.params;
  const guide = FIELD_GUIDES.find((g) => fieldGuideFile(g.slug) === file)!;
  const buffer = await renderFieldGuidePdf(guide.slug);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${guide.slug}-field-guide.pdf"`,
      // The note is the page that should rank. The guide is the same text, and
      // once the download is gated it should not be reachable from search.
      "X-Robots-Tag": "noindex",
    },
  });
}
