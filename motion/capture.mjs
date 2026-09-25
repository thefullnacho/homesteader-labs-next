#!/usr/bin/env node
// Captures the real site screens the promo cuts to, and the counts it quotes.
//
//   npm run capture -- --base https://homesteaderlabs.com
//   npm run capture -- --base https://localhost:3000      (a local `npm run dev`)
//   npm run capture -- --base ... --only game-round,game-reveal
//
// Writes assets/screens/<shot>.jpg at 2x, plus screens.json: each shot's size,
// the boxes the marker strokes are drawn around, and the facts. Counts are read
// off the pages rather than typed into the storyboard, so a render can never
// state a number the site no longer shows.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'assets', 'screens');
const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 2;

const args = parseArgs(process.argv.slice(2));
const BASE = String(args.base ?? 'https://localhost:3000').replace(/\/$/, '');
const ONLY = args.only ? String(args.only).split(',') : null;

// The Amanita round the game shot is built around. Rounds are shuffled with
// Math.random, so the page gets a seeded one and we walk seeds until it deals
// this round first.
const GAME_ROUND = { image: '663574575', answer: 'Amanita Muscaria' };

const SHOTS = [
  {
    name: 'schedule',
    route: '/tools/planting-calendar/zone/6b/',
    anchor: { text: 'The spring schedule', offset: -48 },
    height: 1500,
    marks: [{ id: 'tomatoes', text: 'Tomatoes', exact: true, closest: 'tr' }],
  },
  {
    name: 'kb',
    route: '/kb/',
    height: 1400,
    marks: [{ id: 'headline', text: 'from a dead website', range: true }],
  },
  {
    name: 'zone',
    route: '/tools/planting-calendar/zone/6b/',
    height: 1100,
    marks: [
      { id: 'last', text: 'Last spring frost', closest: '.card-paper' },
      { id: 'first', text: 'First fall frost', closest: '.card-paper' },
    ],
  },
  {
    name: 'game-round',
    route: '/tools/forager-game/play/?mode=mushroom_mycologist',
    game: true,
    marks: [{ id: 'pick', text: GAME_ROUND.answer, exact: true, closest: 'button' }],
  },
  {
    name: 'game-reveal',
    route: '/tools/forager-game/play/?mode=mushroom_mycologist',
    game: true,
    answer: true,
    marks: [
      { id: 'answer', text: 'Correct answer', closest: 'div.border-2' },
      { id: 'ai', text: 'ms on device', closest: 'div.border-2' },
    ],
  },
  {
    name: 'notes',
    route: '/archive/',
    height: 1200,
    marks: [{ id: 'stamp', text: 'Tested on a real homestead', closest: '.stamp' }],
  },
  {
    name: 'drip',
    route: '/archive/diy-drip-irrigation-raised-beds/',
    height: 1300,
    marks: [{ id: 'works', text: 'It works anyway.', range: true }],
  },
];

const FACTS = [
  { id: 'kbCrops', route: '/kb/', pattern: /(\d+)\s+crops on file/i },
  { id: 'notes', route: '/archive/', pattern: /(\d+)\s+notes on file/i },
  { id: 'gameRounds', route: '/tools/forager-game/', pattern: /(\d+)\s+curated rounds/i },
  { id: 'gameDomains', route: '/tools/forager-game/', pattern: /(\d+)\s+domains/i },
];

const browser = await chromium.launch();
// A local `npm run dev` serves a self-signed certificate; nothing else does.
const loopback = /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE);
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: SCALE,
  reducedMotion: 'reduce',
  colorScheme: 'light',
  ignoreHTTPSErrors: loopback,
});

const MANIFEST = path.join(OUT, 'screens.json');
const manifest = {
  ...(ONLY && fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { shots: {}, facts: {} }),
  capturedAt: new Date().toISOString().slice(0, 10),
  viewport: { ...VIEWPORT, deviceScaleFactor: SCALE },
};

fs.mkdirSync(OUT, { recursive: true });

for (const shot of SHOTS.filter((s) => !ONLY || ONLY.includes(s.name))) {
  const page = shot.game ? await dealGameRound(shot) : await open(shot.route);
  if (shot.answer) {
    await page.getByRole('button', { name: GAME_ROUND.answer, exact: true }).click();
    await page.getByText('Correct answer').waitFor();
  }
  await settle(page);

  const doc = await page.evaluate(() => document.documentElement.scrollHeight);
  let clip = { x: 0, y: 0, width: VIEWPORT.width, height: shot.height ?? VIEWPORT.height };
  if (shot.anchor) clip.y = Math.max(0, (await find(page, shot.anchor)).y + shot.anchor.offset);
  if (shot.game) {
    // The game is one narrow column; frame it rather than the empty paper beside
    // it, and stop above the site footer.
    const photo = await page.locator('img[src*="forager-game"]').first().boundingBox();
    clip = { x: photo.x - 44, y: 64, width: photo.width + 88, height: 826 };
  }
  clip.height = Math.min(clip.height, doc - clip.y);
  clip = roundBox(clip);

  const marks = {};
  for (const spec of shot.marks) {
    const hit = await find(page, spec);
    marks[spec.id] = roundBox({ x: hit.x - clip.x, y: hit.y - clip.y, width: hit.width, height: hit.height });
  }

  const file = `${shot.name}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 90, clip, fullPage: true });
  manifest.shots[shot.name] = { file, route: shot.route, width: clip.width, height: clip.height, marks };
  console.log(`${shot.name.padEnd(12)} ${clip.width}x${clip.height}  ${Object.keys(marks).join(', ')}`);
  await page.close();
}

for (const fact of FACTS) {
  const page = await open(fact.route);
  const match = (await page.evaluate(() => document.body.innerText)).match(fact.pattern);
  if (!match) throw new Error(`fact ${fact.id}: ${fact.pattern} not found on ${fact.route}`);
  manifest.facts[fact.id] = Number(match[1]);
  await page.close();
}
console.log('facts', manifest.facts);

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
await browser.close();

async function open(route, seed) {
  const page = await context.newPage();
  if (seed != null) await page.addInitScript(seedRandom, seed);
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  return page;
}

async function dealGameRound(shot) {
  for (let seed = 1; seed <= 120; seed++) {
    const page = await open(shot.route, seed);
    await page.locator('img[src*="forager-game"]').first().waitFor();
    if (await page.locator(`img[src*="${GAME_ROUND.image}"]`).count()) return page;
    await page.close();
  }
  throw new Error(`no seed deals round ${GAME_ROUND.image} first; pick another GAME_ROUND`);
}

async function settle(page) {
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) => img.complete || new Promise((done) => (img.onload = img.onerror = done))),
    );
  });
  await page.waitForTimeout(300);
}

async function find(page, spec) {
  const hit = await page.evaluate(locate, spec);
  if (!hit) throw new Error(`"${spec.text}" not found on ${page.url()}`);
  return hit;
}

// Runs in the page. Finds text case-insensitively (the site uppercases with
// CSS, not in the markup) and returns the box of the text itself (`range`) or
// of an enclosing element (`closest`), in page coordinates. When the text
// appears more than once, the largest type wins: that is the one on screen.
function locate(spec) {
  const needle = spec.text.toLowerCase();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue;
    const at = value.toLowerCase().indexOf(needle);
    if (at < 0 || (spec.exact && value.trim().toLowerCase() !== needle)) continue;
    const el = node.parentElement;
    if (!el.checkVisibility()) continue;
    let rect;
    if (spec.range) {
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + spec.text.length);
      rect = range.getBoundingClientRect();
    } else {
      rect = (spec.closest ? el.closest(spec.closest) ?? el : el).getBoundingClientRect();
    }
    hits.push({
      x: rect.left + scrollX,
      y: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
      size: parseFloat(getComputedStyle(el).fontSize),
    });
  }
  return hits.sort((a, b) => b.size - a.size)[0] ?? null;
}

function seedRandom(seed) {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundBox({ x, y, width, height }) {
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const next = argv[i + 1];
    out[m[1]] = m[2] ?? (next !== undefined && !next.startsWith('--') ? argv[++i] : true);
  }
  return out;
}
