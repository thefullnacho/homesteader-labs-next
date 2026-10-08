import type { MarkdownDoc } from "./doc";
import { kbIndexMarkdown, kbMarkdown, kbMarkdownPaths } from "./kb";
import {
  archiveIndexMarkdown,
  buildsHubMarkdown,
  foragingHubMarkdown,
  homeMarkdown,
  postMarkdown,
  postMarkdownPaths,
} from "./posts";
import { stubMarkdown, stubPaths } from "./stubs";
import {
  stateIndexMarkdown,
  stateMarkdown,
  zoneIndexMarkdown,
  zoneMarkdown,
  zoneMarkdownPaths,
} from "./zones";

/** "/kb/garlic" and "kb/garlic/" both become "/kb/garlic/"; "" becomes "/". */
export function normalizePath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

const ZONE = "/tools/planting-calendar/zone/";
const STATE = "/tools/planting-calendar/state/";

/** One segment after a prefix, or null: "/kb/garlic/" under "/kb/" is "garlic". */
function child(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null;
  const rest = path.slice(prefix.length).replace(/\/$/, "");
  return rest && !rest.includes("/") ? rest : null;
}

/**
 * The markdown for a page path, or null when there is no such page. Pages with
 * a dedicated renderer come first; interactive tools and simple pages fall
 * back to a short stub, so a known page never answers "not found".
 */
export function renderMarkdown(rawPath: string, today: Date = new Date()): MarkdownDoc | null {
  const path = normalizePath(rawPath);

  if (path === "/") return homeMarkdown(today);
  if (path === "/archive/") return archiveIndexMarkdown();
  if (path === "/builds/") return buildsHubMarkdown();
  if (path === "/foraging/") return foragingHubMarkdown();
  if (path === "/kb/") return kbIndexMarkdown();
  if (path === ZONE) return zoneIndexMarkdown();
  if (path === STATE) return stateIndexMarkdown();

  const slug = child(path, "/archive/");
  if (slug) return postMarkdown(slug);
  const crop = child(path, "/kb/");
  if (crop) return kbMarkdown(crop);
  const zone = child(path, ZONE);
  if (zone) return zoneMarkdown(zone, today);
  const state = child(path, STATE);
  if (state) return stateMarkdown(state, today);

  return stubMarkdown(path);
}

/** Every path with a markdown version, for static generation and tests. */
export function markdownPaths(): string[] {
  return Array.from(
    new Set([...postMarkdownPaths(), ...kbMarkdownPaths(), ...zoneMarkdownPaths(), ...stubPaths()].map(normalizePath))
  );
}
