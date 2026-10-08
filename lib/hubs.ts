import { getAllPosts, type Post } from './posts';

/**
 * The two topic hubs, /foraging/ and /builds/, and which notes belong to each.
 *
 * Membership is a rule over frontmatter rather than a hand-kept list, so a new
 * monthly foraging post or a new build log lands in its hub the day it merges.
 * The one hand-kept part is the build outcome line, which has to be written by
 * someone who read the post; buildHubs.test.ts fails when a build log has none.
 *
 * A note belongs to at most one hub. Notes in neither (the planting and
 * de-cloudify pieces) have no hub page yet and link only to /archive/.
 */

export type HubId = 'foraging' | 'builds';

export interface Hub {
  id: HubId;
  /** Short name, used in breadcrumbs and link text. */
  name: string;
  path: string;
}

export const HUBS: Record<HubId, Hub> = {
  foraging: { id: 'foraging', name: 'Foraging', path: '/foraging/' },
  builds: { id: 'builds', name: 'Builds', path: '/builds/' },
};

/** The start-here note on the foraging hub: learn the poisonous ones first. */
export const FORAGING_START_SLUG = 'wild-berry-guide';

/** Year-free slugs, one per month, refreshed annually. See the series memory. */
export const isForagingSeriesPost = (post: Pick<Post, 'slug'>) =>
  post.slug.startsWith('what-to-forage-');

/** "what-to-forage-september" → "September". */
export function seriesMonth(slug: string): string {
  const month = slug.replace('what-to-forage-', '');
  return month.charAt(0).toUpperCase() + month.slice(1);
}

const isForagingPost = (post: Post) =>
  post.category === 'foraging' || post.tags.includes('identification') || isForagingSeriesPost(post);

const isBuildPost = (post: Post) =>
  post.category === 'build-log' || post.tags.includes('build-log');

export function getHubForPost(post: Post): Hub | null {
  if (isForagingPost(post)) return HUBS.foraging;
  if (isBuildPost(post)) return HUBS.builds;
  return null;
}

const byDateAsc = (a: Post, b: Post) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/**
 * The monthly series in publish order, oldest first. Publish order is the
 * reading order: the series started with August 2026 and runs a month at a time.
 */
export function getForagingSeries(): Post[] {
  return getAllPosts().filter(isForagingSeriesPost).sort(byDateAsc);
}

export interface ForagingHub {
  startHere: Post | null;
  series: Post[];
  /** Everything else in the hub: the ID guides and mushroom safety. */
  identification: Post[];
}

export function getForagingHub(): ForagingHub {
  const posts = getAllPosts().filter((p) => getHubForPost(p)?.id === 'foraging');
  return {
    startHere: posts.find((p) => p.slug === FORAGING_START_SLUG) ?? null,
    series: getForagingSeries(),
    identification: posts
      .filter((p) => p.slug !== FORAGING_START_SLUG && !isForagingSeriesPost(p))
      .sort(byDateAsc),
  };
}

export interface BuildEntry {
  post: Post;
  outcome: BuildOutcome | null;
}

export interface BuildOutcome {
  /** One word for the stamp: where the build ended up. */
  status: string;
  /** One line: what came out of it, not what the post is about. */
  line: string;
  /** The live thing the build produced on this site, if there is one. */
  tool?: { href: string; label: string };
  /**
   * The measured numbers the homepage ledger shows, biggest claim first. Each
   * one has to appear in the post itself; a build that measured nothing gets
   * none rather than a made-up count.
   */
  figures?: BuildFigure[];
}

export interface BuildFigure {
  /** Short enough to set in display type: "$539", "6×", "40M". */
  value: string;
  /** One sentence on what was measured. */
  what: string;
}

/**
 * One line per build log on what actually came out of it. Read the post before
 * writing one; these are claims about results, and the result has to be in the
 * post. No em dashes, US spelling.
 */
export const BUILD_OUTCOMES: Record<string, BuildOutcome> = {
  'build-log-survival-index': {
    status: 'Shipped',
    line: 'Fire, livestock, solar and water scores from free Open-Meteo data, computed in the browser with no account.',
    tool: { href: '/tools/weather/', label: 'Weather dashboard' },
  },
  'build-log-planting-calendar-algorithm': {
    status: 'Shipped',
    line: 'Every date counts from your own frost dates, and a planting that cannot finish before frost is never shown.',
    tool: { href: '/tools/planting-calendar/', label: 'Planting calendar' },
  },
  'forager-field-station-hackathon': {
    status: 'Shipped',
    line: 'Four small models, about 40 million parameters, that name wild food from a photo and refuse when unsure. Open weights.',
    figures: [
      { value: '40M', what: 'Parameters across four models that name wild food and refuse when unsure.' },
    ],
  },
  'build-small-hackathon-results': {
    status: 'Lost',
    line: 'Won nothing. The forager is still live, the models are still open, and refuse-by-default stays the house rule.',
    figures: [{ value: '0', what: 'Prizes at Build Small. The forager is still live.' }],
  },
  'hestia-house-brain-build-log': {
    status: 'Running',
    line: 'One local model on hardware in the house, and anything with a right answer runs on a timer or a threshold instead.',
  },
  'diy-drip-irrigation-raised-beds': {
    status: 'Working',
    line: 'Seven beds on one timer zone for $539. They needed an hour every morning, about six times the inch-a-week rule.',
    figures: [
      { value: '$539', what: 'Drip for seven raised beds, timer included.' },
      { value: '6×', what: 'The inch-a-week rule. The beds wanted an hour every morning.' },
    ],
  },
};

export interface MeasuredFigure extends BuildFigure {
  post: Post;
}

/** The homepage ledger: measured numbers from the newest builds first. */
export function getLastMeasured(limit = 4): MeasuredFigure[] {
  return getBuildsHub()
    .reverse()
    .flatMap(({ post, outcome }) => (outcome?.figures ?? []).map((f) => ({ ...f, post })))
    .slice(0, limit);
}

export interface BenchItem {
  title: string;
  /** One word for the stamp: what the build is doing right now. */
  status: string;
  /** The test or the number it is chasing, written before the result exists. */
  line: string;
}

/**
 * Builds started but not yet logged. Hand-kept: add one when a build starts,
 * delete it the day its log ships, and the homepage shows nothing when empty.
 */
export const ON_THE_BENCH: BenchItem[] = [
  {
    title: 'Greenhouse door board',
    status: 'Testing',
    line: 'The test: the first cold night with the heater on, and how long the door can stand open.',
  },
  {
    title: 'Rain barrel, part one',
    status: 'Measuring',
    line: 'What a roof actually catches, measured before the hard freeze.',
  },
];

/** Every build log, oldest first, with its outcome line. */
export function getBuildsHub(): BuildEntry[] {
  return getAllPosts()
    .filter((p) => getHubForPost(p)?.id === 'builds')
    .sort(byDateAsc)
    .map((post) => ({ post, outcome: BUILD_OUTCOMES[post.slug] ?? null }));
}
