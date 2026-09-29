import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/archive');

// Simple memoization to avoid re-reading files when getAllTags/getAllCategories call getAllPosts
let cachedPosts: Post[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5000; // 5 second TTL for dev, effectively permanent during SSG

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Set only when a published note is materially revised; drives sitemap lastmod. */
  updated?: string;
  author: string;
  tags: string[];
  category: string;
  excerpt: string;
  content: string;
  // Optional at-a-glance card fields (the SpecBox on the note page)
  season?: string;
  skill?: string;
  region?: string;
  gear?: string;
  pairsWith?: string;
  stamp?: string;
  /** Step-by-step builds only; rendered as HowTo JSON-LD. See parseHowTo. */
  howTo?: PostHowTo;
}

export interface PostHowTo {
  name: string;
  estimatedCost?: { currency: string; value: number };
  supply?: string[];
  tool?: string[];
  steps: { name: string; text: string }[];
}

/**
 * A note's `howTo` frontmatter, or undefined when it is missing or malformed.
 *
 * HowTo markup has to describe steps a reader can see on the page, so it goes
 * only on notes that are genuinely a sequence of steps (a build, a setup), and
 * each step restates a section of the prose rather than adding to it. A
 * narrative build log gets Article only. Malformed blocks are dropped rather
 * than half-rendered, since a HowTo with an empty step is worse than none.
 */
function parseHowTo(raw: unknown): PostHowTo | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const h = raw as Record<string, unknown>;
  const steps = Array.isArray(h.steps) ? h.steps : [];
  const validSteps = steps.filter(
    (st): st is { name: string; text: string } =>
      !!st && typeof st.name === 'string' && st.name !== '' && typeof st.text === 'string' && st.text !== ''
  );
  if (typeof h.name !== 'string' || validSteps.length < 2 || validSteps.length !== steps.length) {
    return undefined;
  }
  return {
    name: h.name,
    estimatedCost: h.estimatedCost as PostHowTo['estimatedCost'],
    supply: h.supply as string[] | undefined,
    tool: h.tool as string[] | undefined,
    steps: validSteps,
  };
}

/* Rough read time from word count; shown as "N min" on cards/spec boxes */
export function getReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/* Notes are numbered oldest-first: the oldest post is No. 001 */
export function getPostNo(slug: string): string {
  const posts = getAllPosts(); // sorted newest-first
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return "000";
  return String(posts.length - index).padStart(3, "0");
}

export interface PostImage {
  /** Site-root-relative path, e.g. /images/pokeweed-stem.jpg */
  src: string;
  /** Markdown alt text. Doubles as the caption the note renders. */
  alt: string;
}

/**
 * Every local image a note renders, in document order.
 *
 * The identification guides are the reason this exists. Their queries resolve
 * to image-first result pages, so the photographs are the part of the note
 * with a real chance of being found, and they need to reach the sitemap and
 * the structured data rather than only the rendered page.
 *
 * Only `/images/...` paths are collected. Remote images are not ours to list
 * in our own sitemap, and Google reads an image sitemap as a claim of
 * ownership.
 */
export function getPostImages(content: string): PostImage[] {
  const pattern = /!\[([^\]]*)\]\((\/images\/[^)\s]+)\)/g;
  const images: PostImage[] = [];
  const seen = new Set<string>();

  for (const match of content.matchAll(pattern)) {
    const [, alt, src] = match;
    // A note may show the same photograph twice; the sitemap wants it once.
    if (seen.has(src)) continue;
    seen.add(src);
    images.push({ src, alt: alt.trim() });
  }

  return images;
}

/**
 * The image a note's share card shows: its first photograph, else the poster
 * frame of its first video, else undefined and the caller uses the site card.
 *
 * A first-party photo beats a generic card in a feed, and the poster is the
 * only still some build logs have (the drip post is a video with no photos).
 */
export function getPostShareImage(content: string): PostImage | undefined {
  const [first] = getPostImages(content);
  if (first) return first;
  const poster = content.match(/<FieldVideo\b[^>]*\bposter="(\/images\/[^"]+)"/);
  return poster ? { src: poster[1], alt: '' } : undefined;
}

/* The "Season · Skill · N min" line on archive cards */
export function getSpecsLine(post: Post): string {
  return [post.season, post.skill, `${getReadMinutes(post.content)} min`]
    .filter(Boolean)
    .join(" · ");
}

export function getAllPosts(): Post[] {
  // Return cached result if still fresh
  const now = Date.now();
  if (cachedPosts && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedPosts;
  }

  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      // Remove ".mdx" from file name to get slug
      const slug = fileName.replace(/\.mdx$/, '');

      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the post metadata section
      const { data, content } = matter(fileContents);

      // Combine the data with the slug
      return {
        slug,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        updated: data.updated,
        author: data.author || '',
        tags: data.tags || [],
        category: data.category || '',
        excerpt: data.excerpt || '',
        content,
        season: data.season,
        skill: data.skill,
        region: data.region,
        gear: data.gear,
        pairsWith: data.pairsWith,
        stamp: data.stamp,
        howTo: parseHowTo(data.howTo),
      };
    });

  // Sort posts by date
  const sorted = allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });

  // Cache for subsequent calls (getAllTags, getAllCategories)
  cachedPosts = sorted;
  cacheTimestamp = Date.now();

  return sorted;
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      updated: data.updated,
      author: data.author || '',
      tags: data.tags || [],
      category: data.category || '',
      excerpt: data.excerpt || '',
      content,
      season: data.season,
      skill: data.skill,
      region: data.region,
      gear: data.gear,
      pairsWith: data.pairsWith,
      stamp: data.stamp,
      howTo: parseHowTo(data.howTo),
    };
  } catch {
    return null;
  }
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => fileName.replace(/\.mdx$/, ''));
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  
  posts.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });
  
  return Array.from(tags).sort();
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set<string>();
  
  posts.forEach((post) => {
    if (post.category) {
      categories.add(post.category);
    }
  });
  
  return Array.from(categories).sort();
}
