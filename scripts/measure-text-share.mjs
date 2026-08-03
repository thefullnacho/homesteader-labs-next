#!/usr/bin/env node
// Measures per-page text share across a set of programmatic pages: the share
// of a page's visible tokens that are NOT common to every page in its set.
//
// This is spec §8.2 for the state pages, and the reason it exists as a script
// rather than a unit test is that it needs rendered HTML, which only exists
// after `npm run build`. The unit test in statePages.test.ts gates the data
// layer, which is the floor under this number; this measures the ceiling the
// pages actually deliver.
//
// Run:  npm run build && node scripts/measure-text-share.mjs
//
// CALIBRATION WARNING. STATE_PAGES_SPEC §8.2 sets a 35% floor and attributes
// 39-46% to the zone pages. That figure is not reproducible by this method or
// any close variant of it: the zone pages, live and indexed, measure 15-21%
// here, whether or not global chrome is included. Whatever produced 39-46%
// was not this. Until the discrepancy is resolved, read these numbers
// comparatively, the state pages against the zone pages that already work,
// rather than against an absolute floor nothing on the site clears.

import fs from "node:fs";
import path from "node:path";

const APP = ".next/server/app/tools/planting-calendar";

/** Visible tokens. Main content only, so global masthead and colophon do not
 *  inflate the shared half of every page on the site. */
function tokens(file) {
  let html = fs.readFileSync(file, "utf8");
  const main = html.match(/<main[^>]*id="main-content"[\s\S]*?<\/main>/i);
  html = main ? main[0] : html;
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .toLowerCase()
    .split(/[^a-z0-9%]+/)
    .filter(Boolean);
}

function measure(label, dir) {
  if (!fs.existsSync(dir)) {
    console.log(`${label}: no build output at ${dir}, run npm run build first`);
    return [];
  }
  const slugs = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.replace(/\.html$/, ""))
    .sort();

  const texts = slugs.map((s) => tokens(path.join(dir, `${s}.html`)));
  const common = texts.reduce(
    (acc, t) => new Set([...acc].filter((tok) => t.includes(tok))),
    new Set(texts[0])
  );

  console.log(`\n${label}  (${slugs.length} pages, ${common.size} tokens common to all)`);
  const shares = slugs.map((slug, i) => {
    const t = texts[i];
    const share = t.filter((tok) => !common.has(tok)).length / t.length;
    console.log(
      `  ${slug.padEnd(16)} ${String(t.length).padStart(5)} tok   ${(share * 100)
        .toFixed(1)
        .padStart(5)}%`
    );
    return share;
  });
  const lo = Math.min(...shares);
  const hi = Math.max(...shares);
  console.log(`  ${"range".padEnd(16)} ${(lo * 100).toFixed(1)}% to ${(hi * 100).toFixed(1)}%`);
  return shares;
}

const zone = measure("ZONE PAGES", path.join(APP, "zone"));
const state = measure("STATE PAGES", path.join(APP, "state"));

if (zone.length && state.length) {
  const worstZone = Math.min(...zone);
  const worstState = Math.min(...state);
  console.log(
    `\nWorst state page ${(worstState * 100).toFixed(1)}% against worst zone page ` +
      `${(worstZone * 100).toFixed(1)}%. ` +
      (worstState >= worstZone
        ? "State pages clear the bar the zone pages actually set."
        : "A state page is thinner than the thinnest live zone page. Fix before shipping.")
  );
  process.exit(worstState >= worstZone ? 0 : 1);
}
