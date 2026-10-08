import { getAlmanacMonth } from "@/lib/almanac";
import { getBuildsHub, getForagingHub, getHubForPost, getLastMeasured, ON_THE_BENCH, seriesMonth } from "@/lib/hubs";
import { getAllPosts, getReadMinutes, type Post } from "@/lib/posts";
import { getAllProducts } from "@/lib/products";
import { abs, mdLink, mdTable, type MarkdownDoc } from "./doc";

/* Field notes, the hubs over them, and the homepage. The notes are already
   markdown; MDX adds only what the converter below handles. */

/**
 * A note's MDX body as plain markdown. The archive uses one component,
 * FieldVideo, which becomes a link to the file; any component added later is
 * dropped rather than leaking JSX, and the test that renders every note will
 * show it. Site-relative links and images become absolute, since an agent
 * reading this has no page URL to resolve them against.
 */
export function mdxToMarkdown(content: string): string {
  return content
    .replace(/<FieldVideo\s+([^>]*?)\/>/g, (_, attrs: string) => {
      const attr = (name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
      const src = attr("src");
      if (!src) return "";
      return `[Video${attr("caption") ? `: ${attr("caption")}` : ""}](${abs(src)})`;
    })
    .replace(/<[A-Z][A-Za-z]*\b[^>]*\/>/g, "")
    .replace(/\]\(\//g, `](${abs("/")}`)
    .trim();
}

const AT_A_GLANCE: Array<[keyof Post, string]> = [
  ["season", "Season"],
  ["skill", "Skill"],
  ["region", "Region"],
  ["gear", "Gear"],
  ["pairsWith", "Pairs with"],
];

export function postMarkdown(slug: string): MarkdownDoc | null {
  const post = getAllPosts().find((p) => p.slug === slug);
  if (!post) return null;

  const glance = AT_A_GLANCE.filter(([key]) => post[key]).map(
    ([key, label]) => `- **${label}:** ${post[key] as string}`
  );

  return {
    path: `/archive/${post.slug}/`,
    title: post.title,
    body: [
      `# ${post.title}`,
      "",
      `> ${post.description}`,
      "",
      `By ${post.author} · ${post.date}${post.updated ? ` (updated ${post.updated})` : ""} · ${getReadMinutes(post.content)} min read`,
      ...(glance.length ? ["", "At a glance:", "", ...glance] : []),
      "",
      mdxToMarkdown(post.content),
    ].join("\n"),
  };
}

function postLine(post: Post, extra?: string): string {
  const summary = post.excerpt || post.description;
  return `- ${mdLink(post.title, `/archive/${post.slug}/`)} (${post.date}${extra ? `, ${extra}` : ""}): ${summary}`;
}

export function archiveIndexMarkdown(): MarkdownDoc {
  const posts = getAllPosts();
  return {
    path: "/archive/",
    title: "Field Notes",
    body: [
      "# Field Notes",
      "",
      `Every field note on Homesteader Labs, newest first. ${posts.length} on file: build logs, foraging guides, planting guides and first-person notes from one half-acre yard.`,
      "",
      ...posts.map((p) => postLine(p, p.category || undefined)),
    ].join("\n"),
  };
}

export function buildsHubMarkdown(): MarkdownDoc {
  const builds = getBuildsHub();
  return {
    path: "/builds/",
    title: "Build Logs: Tools, Models and Homestead Systems",
    body: [
      "# Build Logs: Tools, Models and Homestead Systems",
      "",
      "Every build log in order, oldest first, with what actually came out of each one.",
      "",
      ...builds.flatMap(({ post, outcome }) => [
        `## ${post.title}`,
        "",
        `${post.date}${outcome ? ` · ${outcome.status}` : ""} · ${mdLink("Read the log", `/archive/${post.slug}/`)}`,
        "",
        outcome?.line ?? post.description,
        ...(outcome?.tool ? ["", `Use it: ${mdLink(outcome.tool.label, outcome.tool.href)}`] : []),
        "",
      ]),
    ].join("\n"),
  };
}

export function foragingHubMarkdown(): MarkdownDoc {
  const { startHere, series, identification } = getForagingHub();
  return {
    path: "/foraging/",
    title: "Foraging Guides: Wild Berries, Mushrooms, What's in Season",
    body: [
      "# Foraging Guides: Wild Berries, Mushrooms, What's in Season",
      "",
      "Every foraging guide in reading order. Learn the poisonous lookalikes before the meals.",
      ...(startHere ? ["", "## Start here", "", postLine(startHere)] : []),
      ...(series.length
        ? ["", "## What to forage, month by month", "", ...series.map((p) => postLine(p, seriesMonth(p.slug)))]
        : []),
      ...(identification.length ? ["", "## Identification and safety", "", ...identification.map((p) => postLine(p))] : []),
    ].join("\n"),
  };
}

/** The homepage, in the order the page tells it. */
export function homeMarkdown(today: Date = new Date()): MarkdownDoc {
  const posts = getAllPosts();
  const builds = getBuildsHub();
  const measured = getLastMeasured();
  const almanac = getAlmanacMonth(today);
  const flagship = getAllProducts()[0];
  const title = "One half acre. Every build measured.";

  return {
    path: "/",
    title,
    body: [
      `# ${title}`,
      "",
      "Homesteader Labs is the logbook of a working yard: what I built, what it cost, what the numbers said, and the parts you can print to build it yourself. Free tools, no accounts, no client-side analytics.",
      ...(almanac
        ? ["", `**${almanac.month}:** ${almanac.jobs.map((j) => mdLink(j.label, j.href)).join(", ")}`]
        : []),
      "",
      "## Last measured",
      "",
      mdTable(
        ["Number", "What was measured", "Build log"],
        measured.map((m) => [m.value, m.what, mdLink(m.post.title, `/archive/${m.post.slug}/`)])
      ),
      ...(ON_THE_BENCH.length
        ? ["", "## On the bench", "", ...ON_THE_BENCH.map((b) => `- **${b.title}** (${b.status}): ${b.line}`)]
        : []),
      "",
      "## What can you still plant this week?",
      "",
      `The ${mdLink("planting calendar", "/tools/planting-calendar/")} counts every date from your own frost dates. Give it a ZIP and it returns the next two weeks: what to start inside, what to sow now, what comes ready, and which planting windows close before your frost. Zone-level dates are also published per zone (${mdLink("zone pages", "/tools/planting-calendar/zone/")}) and as JSON (${mdLink("frost normals", "/api/frost/6b/")}, ${mdLink("ZIP to zone", "/api/zone/06385/")}).`,
      "",
      `Also free: the ${mdLink("weather station", "/tools/weather/")} and the ${mdLink("resilience dashboard", "/tools/caloric-security/")}.`,
      "",
      "## Latest entries",
      "",
      ...posts.slice(0, 5).map((p) => {
        const label = getHubForPost(p)?.id === "builds" ? "build log" : p.category || "note";
        return postLine(p, label);
      }),
      "",
      `All ${posts.length} notes: ${abs("/archive/")} · All ${builds.length} build logs: ${abs("/builds/")} · Foraging guides: ${abs("/foraging/")}`,
      "",
      "## From the workshop",
      "",
      `- ${mdLink("The parts bin", "/tools/fabrication/")}: open designs from the builds, with the print settings that worked.`,
      ...(flagship
        ? [`- ${mdLink(flagship.name, `/shop/${flagship.id.toLowerCase()}/`)}: the handheld, made here and shipped from here.`]
        : []),
      "",
      "## The dispatch",
      "",
      `A monthly email with every new build from the half acre, what it measured, and what to do outside before the next one. The signup form is on ${abs("/")}.`,
    ].join("\n"),
  };
}

/** Every path this module renders, for static generation. */
export function postMarkdownPaths(): string[] {
  return ["/", "/archive/", "/builds/", "/foraging/", ...getAllPosts().map((p) => `/archive/${p.slug}/`)];
}
