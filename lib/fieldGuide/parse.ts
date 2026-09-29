// MDX source → the markdown tree the field guide renders from.

import { createProcessor } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import type { Nodes, Root, RootContent } from "mdast";
import type { FieldGuideSpec } from "./guides";

/**
 * Parses with the same processor and remark plugins as next.config.mjs, so a
 * construct the site understands is one the guide understands. Parsing only;
 * nothing is compiled or evaluated.
 */
export function parseMdx(source: string): Root {
  return createProcessor({ remarkPlugins: [remarkFrontmatter, remarkGfm] }).parse(source) as Root;
}

/** The plain text of a node, the way a reader sees it. */
export function textOf(node: Nodes): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node) return node.children.map((c) => textOf(c as Nodes)).join("");
  return "";
}

/**
 * The tree minus the spec's omissions.
 *
 * A section runs from its ## heading to the next ## heading or --- rule, so
 * omitting the last section keeps the end matter after the rule (on the berry
 * guide, the disclaimer and the Poison Control number). Every target must
 * match exactly once: none means the note changed underneath the spec, two
 * means the spec is ambiguous, and both are errors rather than guesses.
 */
export function applyOmissions(tree: Root, spec: FieldGuideSpec): Root {
  const sections = spec.omitSections ?? [];
  const paragraphs = spec.omitParagraphs ?? [];
  const hits = new Map<string, number>([...sections, ...paragraphs].map((t) => [t, 0]));

  const kept: RootContent[] = [];
  let skipping = false;

  for (const node of tree.children) {
    if (node.type === "thematicBreak") skipping = false;
    if (node.type === "heading" && node.depth <= 2) {
      const text = textOf(node);
      skipping = sections.includes(text);
      if (skipping) hits.set(text, hits.get(text)! + 1);
    }
    if (skipping) continue;

    if (node.type === "paragraph") {
      const text = textOf(node);
      const target = paragraphs.find((p) => text.startsWith(p));
      if (target) {
        hits.set(target, hits.get(target)! + 1);
        continue;
      }
    }
    kept.push(node);
  }

  const bad = [...hits].filter(([, n]) => n !== 1);
  if (bad.length) {
    const detail = bad.map(([t, n]) => `"${t}" matched ${n} times`).join("; ");
    throw new Error(`[field-guide] ${spec.slug}: omission targets must match exactly once: ${detail}`);
  }

  return { ...tree, children: kept };
}
