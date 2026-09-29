import createMDX from '@next/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import { readFileSync } from 'node:fs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack (via --webpack in scripts) until the MDX pipeline is Turbopack-ready:
  // @next/mdx remark plugins are JS functions, which Turbopack can't serialize.
  outputFileTracingRoot: import.meta.dirname,
  // Dev binds 0.0.0.0; allow the browser to reach dev resources via 127.0.0.1
  // (Next blocks cross-origin /_next requests by default since 15.2).
  allowedDevOrigins: ['127.0.0.1'],
  trailingSlash: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  async redirects() {
    // State pages canonicalise on the full name, since the demand is "what to
    // plant in august in texas" rather than "in tx" (spec §3). The abbreviated
    // form is a real minority query, so it gets a permanent redirect to the
    // canonical rather than a page of its own or a 404.
    //
    // Only the ten states that have pages. Redirecting /state/wy/ to a URL
    // that 404s trades one dead end for a slower one.
    const STATE_ABBRS = {
      tx: 'texas', ca: 'california', ny: 'new-york', pa: 'pennsylvania',
      fl: 'florida', mi: 'michigan', oh: 'ohio', nc: 'north-carolina',
      ga: 'georgia', ky: 'kentucky',
    };
    const stateRedirects = Object.entries(STATE_ABBRS).map(([abbr, slug]) => ({
      source: `/tools/planting-calendar/state/${abbr}`,
      destination: `/tools/planting-calendar/state/${slug}/`,
      permanent: true,
    }));

    // Apex is the canonical host. The live www -> apex 308 is set in Vercel's
    // domain settings and fires before this app runs, so this rule is a
    // fallback: if that setting is ever lost or flipped, as it was until
    // 2026-07-24 when it silently kept the whole site out of the index, www
    // still redirects permanently instead of serving duplicate pages.
    // `(.*)` rather than `:path*` so the trailing slash is carried across;
    // `:path*` drops it and costs a second hop on the apex.
    const wwwRedirect = {
      source: '/:path(.*)',
      has: [{ type: 'host', value: 'www.homesteaderlabs.com' }],
      destination: 'https://homesteaderlabs.com/:path',
      permanent: true,
    };

    // Duplicate KB slugs retired in favor of one survivor (see KB_RETIRED in
    // lib/kb.ts, which reads the same file). 301 rather than `permanent` (308)
    // because that is what the consolidation spec checks for; Google treats
    // the two identically.
    const retiredKb = JSON.parse(
      readFileSync(new URL('./content/kb/retired.json', import.meta.url), 'utf8')
    );
    const kbRedirects = Object.entries(retiredKb).map(([retired, survivor]) => ({
      source: `/kb/${retired}`,
      destination: `/kb/${survivor}/`,
      statusCode: 301,
    }));

    return [wwwRedirect, ...stateRedirects, ...kbRedirects];
  },
  async headers() {
    return [
      {
        source: '/((?!keystatic).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/keystatic/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // remark-frontmatter keeps the YAML block (read separately by gray-matter
    // in lib/posts.ts) from rendering as page text.
    remarkPlugins: [remarkFrontmatter, remarkGfm],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
