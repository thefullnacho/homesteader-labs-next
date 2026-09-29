// The markdown tree → a printable @react-pdf document.
//
// The mapping is eager and strict. Every node type the notes use has a case,
// and anything else throws with its line number, because a guide that quietly
// drops a JSX component or a table is out of sync with its note in exactly the
// way this pipeline exists to prevent. The build fails; the fix is a new case
// here or an omission in guides.ts.

import { existsSync, readFileSync } from "fs";
import path from "path";
import { Document, Image, Link, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Image as MdImage, List, PhrasingContent, Root, RootContent } from "mdast";
import type { Post } from "@/lib/posts";
import { getImageSize } from "@/lib/imageSize";
import {
  paper as c,
  DISPLAY, DISPLAY_ITALIC, MONO, MONO_BOLD,
  BODY, BODY_BOLD, BODY_ITALIC, BODY_BOLD_ITALIC,
  PageFrame,
} from "@/lib/print/paper";
import type { FieldGuideSpec } from "./guides";

const SITE_URL = "https://homesteaderlabs.com";

// LETTER less the frame's 40pt page padding either side.
const CONTENT_WIDTH = 612 - 2 * 40;
// Tall enough to show an ID tell, short enough that a landscape photo and the
// paragraph explaining it share a page.
const PHOTO_MAX_HEIGHT = 250;
// A page less the frame's padding, header and a two-line caption.
const FULL_PAGE_MAX_HEIGHT = 590;

const s = StyleSheet.create({
  kicker: { fontFamily: MONO_BOLD, fontSize: 8, color: c.marker, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  title: { fontFamily: DISPLAY, fontSize: 24, textTransform: "uppercase", lineHeight: 1.05, letterSpacing: -0.5 },
  deck: { fontFamily: BODY_ITALIC, fontSize: 12, color: c.soil, marginTop: 8, lineHeight: 1.4 },
  stamp: {
    alignSelf: "flex-start", borderWidth: 1.5, borderColor: c.moss, color: c.moss,
    fontFamily: MONO_BOLD, fontSize: 8, textTransform: "uppercase", letterSpacing: 1,
    paddingVertical: 3, paddingHorizontal: 6, marginTop: 12,
  },
  specs: { marginTop: 12, borderWidth: 1, borderColor: c.ink },
  specRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: c.kraft },
  specLabel: { width: 84, fontFamily: MONO_BOLD, fontSize: 7, textTransform: "uppercase", letterSpacing: 0.6, color: c.soil, paddingTop: 1.5 },
  specValue: { flex: 1, fontSize: 9.5, lineHeight: 1.35 },
  provenance: { fontFamily: MONO, fontSize: 7, color: c.soil, marginTop: 8, marginBottom: 16, lineHeight: 1.4 },

  section: { marginTop: 16, marginBottom: 8, borderTopWidth: 2, borderTopColor: c.ink, paddingTop: 6 },
  sectionNo: { fontFamily: MONO_BOLD, fontSize: 8, color: c.marker, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  h2: { fontFamily: DISPLAY, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.3, lineHeight: 1.15 },
  h3: { fontFamily: DISPLAY, fontSize: 11, marginTop: 10, marginBottom: 4, lineHeight: 1.2 },
  p: { fontSize: 10.5, lineHeight: 1.45, marginBottom: 7 },
  link: { color: c.ink, textDecoration: "underline" },
  code: { fontFamily: MONO, fontSize: 9 },

  list: { marginBottom: 7 },
  li: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 14, fontSize: 10.5, lineHeight: 1.45 },
  liBody: { flex: 1 },

  figure: { alignItems: "center", marginTop: 4, marginBottom: 10 },
  frame: { borderWidth: 1, borderColor: c.ink },
  caption: { fontFamily: MONO, fontSize: 6.5, color: c.soil, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 4, lineHeight: 1.4, textAlign: "center" },

  rule: { borderBottomWidth: 1, borderBottomColor: c.ink, marginVertical: 12 },
  quote: { borderLeftWidth: 3, borderLeftColor: c.marker, paddingLeft: 10, marginBottom: 7 },
  pre: { borderWidth: 1, borderColor: c.ink, padding: 8, marginBottom: 7 },

  closing: { fontFamily: MONO, fontSize: 7, color: c.soil, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 14, lineHeight: 1.5 },
});

/** The four faces of a text role, so bold and italic nest inside any of them. */
interface Faces { regular: string; bold: string; italic: string; boldItalic: string }
const BODY_FACES: Faces = { regular: BODY, bold: BODY_BOLD, italic: BODY_ITALIC, boldItalic: BODY_BOLD_ITALIC };
const DISPLAY_FACES: Faces = { regular: DISPLAY, bold: DISPLAY, italic: DISPLAY_ITALIC, boldItalic: DISPLAY_ITALIC };

interface Ctx {
  spec: FieldGuideSpec;
  /** Running § number for ## sections. */
  section: number;
}

function unsupported(ctx: Ctx, node: { type: string; position?: { start: { line: number } } }): never {
  const line = node.position ? ` at line ${node.position.start.line}` : "";
  throw new Error(
    `[field-guide] ${ctx.spec.slug}: no print mapping for MDX node "${node.type}"${line}. ` +
      `Add a case in lib/fieldGuide/render.tsx, or omit its section in lib/fieldGuide/guides.ts.`,
  );
}

function face(faces: Faces, bold: boolean, italic: boolean): string {
  if (bold && italic) return faces.boldItalic;
  if (bold) return faces.bold;
  if (italic) return faces.italic;
  return faces.regular;
}

function absolute(url: string): string {
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}

function inline(ctx: Ctx, nodes: PhrasingContent[], faces: Faces, bold = false, italic = false): React.ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "strong":
        return (
          <Text key={i} style={{ fontFamily: face(faces, true, italic) }}>
            {inline(ctx, node.children, faces, true, italic)}
          </Text>
        );
      case "emphasis":
        return (
          <Text key={i} style={{ fontFamily: face(faces, bold, true) }}>
            {inline(ctx, node.children, faces, bold, true)}
          </Text>
        );
      case "inlineCode":
        return <Text key={i} style={s.code}>{node.value}</Text>;
      case "link":
        return (
          <Link key={i} src={absolute(node.url)} style={s.link}>
            {inline(ctx, node.children, faces, bold, italic)}
          </Link>
        );
      case "break":
        return "\n";
      default:
        return unsupported(ctx, node);
    }
  });
}

function figure(ctx: Ctx, img: MdImage, key: number): React.ReactNode {
  const { url, alt } = img;
  const file = path.join(process.cwd(), "public", url);
  const size = url.startsWith("/") && existsSync(file) ? getImageSize(url) : null;
  if (!size) {
    throw new Error(
      `[field-guide] ${ctx.spec.slug}: image ${url} must be a local JPEG or PNG under public/ ` +
        `(line ${img.position?.start.line ?? "?"}).`,
    );
  }

  const fullPage = ctx.spec.fullPageImages?.includes(url) ?? false;
  const maxHeight = fullPage ? FULL_PAGE_MAX_HEIGHT : PHOTO_MAX_HEIGHT;
  const scale = Math.min(CONTENT_WIDTH / size.width, maxHeight / size.height);
  const format = path.extname(url).toLowerCase() === ".png" ? "png" : "jpg";

  return (
    // wrap={false} keeps a photograph and its caption on the same page.
    <View key={key} style={s.figure} wrap={false} break={fullPage}>
      <View style={s.frame}>
        {/* A PDF image has no alt; the note's alt text prints as the caption below. */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image
          src={{ data: readFileSync(file), format }}
          style={{ width: size.width * scale, height: size.height * scale }}
        />
      </View>
      {alt ? <Text style={[s.caption, { maxWidth: Math.max(size.width * scale, 300) }]}>{alt}</Text> : null}
    </View>
  );
}

/** Markdown puts a standalone image in a paragraph of its own. */
function isFigureParagraph(children: PhrasingContent[]): boolean {
  const real = children.filter((n) => !(n.type === "text" && n.value.trim() === ""));
  return real.length > 0 && real.every((n) => n.type === "image");
}

function list(ctx: Ctx, node: List, key: number): React.ReactNode {
  const start = node.start ?? 1;
  return (
    <View key={key} style={s.list}>
      {node.children.map((item, i) => (
        <View key={i} style={s.li}>
          <Text style={s.bullet}>{node.ordered ? `${start + i}.` : "•"}</Text>
          <View style={s.liBody}>{blocks(ctx, item.children)}</View>
        </View>
      ))}
    </View>
  );
}

function blocks(ctx: Ctx, nodes: RootContent[]): React.ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "yaml":
        // Frontmatter; the cover reads it through lib/posts.
        return null;
      case "heading":
        if (node.depth <= 2) {
          ctx.section += 1;
          return (
            // minPresenceAhead keeps a heading from being stranded at the foot of a page.
            <View key={i} style={s.section} wrap={false} minPresenceAhead={80}>
              <Text style={s.sectionNo}>§{ctx.section}</Text>
              <Text style={s.h2}>{inline(ctx, node.children, DISPLAY_FACES)}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={s.h3} minPresenceAhead={60}>
            {inline(ctx, node.children, DISPLAY_FACES)}
          </Text>
        );
      case "paragraph":
        if (isFigureParagraph(node.children)) {
          return node.children
            .filter((n): n is MdImage => n.type === "image")
            .map((img, j) => figure(ctx, img, i * 100 + j));
        }
        return <Text key={i} style={s.p}>{inline(ctx, node.children, BODY_FACES)}</Text>;
      case "list":
        return list(ctx, node, i);
      case "thematicBreak":
        return <View key={i} style={s.rule} />;
      case "blockquote":
        return <View key={i} style={s.quote}>{blocks(ctx, node.children)}</View>;
      case "code":
        return (
          <View key={i} style={s.pre} wrap={false}>
            <Text style={s.code}>{node.value}</Text>
          </View>
        );
      default:
        return unsupported(ctx, node);
    }
  });
}

function formatDate(iso: string): string {
  // Frontmatter dates are calendar days. Read as UTC so a build machine west
  // of Greenwich does not print the day before.
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
}

/**
 * Builds the document element. Throws on anything it cannot print faithfully,
 * before any rendering starts.
 */
export function buildFieldGuideDocument({
  post,
  postNo,
  tree,
  spec,
}: {
  post: Post;
  postNo: string;
  tree: Root;
  spec: FieldGuideSpec;
}): React.ReactElement {
  const ctx: Ctx = { spec, section: 0 };
  const body = blocks(ctx, tree.children);

  const pageUrl = `homesteaderlabs.com/archive/${post.slug}/`;
  const asOf = formatDate(post.updated ?? post.date);
  const shortTitle = post.title.split(":")[0];

  const specRows: [string, string][] = [];
  if (post.season) specRows.push(["Season", post.season]);
  if (post.skill) specRows.push(["Skill", post.skill]);
  if (post.region) specRows.push(["Region", post.region]);
  if (post.gear) specRows.push(["You'll need", post.gear]);
  if (post.pairsWith) specRows.push(["Pairs with", post.pairsWith]);

  return (
    <Document title={post.title} author={post.author} subject={post.description} creator="Homesteader Labs">
      <PageFrame
        left={`Field Note No. ${postNo}`}
        right={`${shortTitle} / Homesteader Labs`}
        footerLeft={pageUrl}
        fixedHeader
        pageStyle={{ backgroundColor: "#ffffff" }}
      >
        <Text style={s.kicker}>Printable field guide</Text>
        <Text style={s.title}>{post.title}</Text>
        <Text style={s.deck}>{post.description}</Text>
        {post.stamp ? <Text style={s.stamp}>{post.stamp}</Text> : null}

        {specRows.length > 0 && (
          <View style={s.specs}>
            {specRows.map(([label, value]) => (
              <View key={label} style={s.specRow}>
                <Text style={s.specLabel}>{label}</Text>
                <Text style={s.specValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* A printed safety guide outlives its revisions, so it says which one it is. */}
        <Text style={s.provenance}>
          By {post.author}. This printout matches the note as updated {asOf}. The current version
          is always at {pageUrl}
        </Text>

        {body}

        <Text style={s.closing}>
          Printed from {pageUrl}, as updated {asOf}. If the page shows a later date, it has changed
          since this copy.
        </Text>
      </PageFrame>
    </Document>
  );
}
