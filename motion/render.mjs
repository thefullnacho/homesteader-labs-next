#!/usr/bin/env node
// Renders promo/ to video. Headless Chromium steps the timeline one frame at a
// time and ffmpeg encodes the frames, so the output is the same on every
// machine at any speed; a faster machine only finishes sooner.
//
//   npm run render                          1080p30 H.264       -> out/promo.mp4
//   npm run render -- --scale 2 --fps 60    4K at 60 fps
//   npm run render -- --audio track.mp3     lay a track under it, faded out at the end
//   npm run render -- --audio track.mp3 --audio-start 12.4
//                                           start the track 12.4s in, on the downbeat
//                                           you want the video to open on
//   npm run render -- --prores              ProRes 422 HQ       -> out/promo.mov, for an editor
//   npm run render -- --from 8 --to 14      one slice, to check a scene
//   npm run render -- --still 12.5          one frame           -> out/still-12.5.png
//   npm run preview                         every half second   -> out/sheet.png
//
// Needs ffmpeg on PATH (or FFMPEG=/path/to/ffmpeg) and Playwright's Chromium
// (npx playwright install chromium).

import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_PUBLIC = path.join(ROOT, '..', 'public');
const OUT_DIR = path.join(ROOT, 'out');
const ORIGIN = 'http://promo.local';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

const args = parseArgs(process.argv.slice(2));
const fps = Number(args.fps ?? 30);
const scale = Number(args.scale ?? 1);
const workers = Number(args.workers ?? Math.max(1, Math.min(4, os.cpus().length - 1)));
const prores = Boolean(args.prores);

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

if (args.still === undefined) requireFfmpeg();
fs.mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
try {
  if (args.still !== undefined) await still(Number(args.still));
  else if (args.sheet) await sheet(Number(args.every ?? 0.5));
  else await video();
} finally {
  await browser.close();
}

async function video() {
  const probe = await openStage();
  const duration = probe.info.duration / 1000;
  await probe.context.close();

  const from = Number(args.from ?? 0);
  const to = Math.min(duration, Number(args.to ?? duration));
  const first = Math.round(from * fps);
  const last = Math.round(to * fps);
  const total = last - first;
  const ext = prores ? 'mov' : 'mp4';
  const out = args.out
    ? path.resolve(String(args.out))
    : path.join(OUT_DIR, args.from || args.to ? `promo-${from}-${to}.${ext}` : `promo.${ext}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-'));
  const started = Date.now();

  // Each worker renders a contiguous run of frames into its own segment; the
  // segments are then joined without re-encoding.
  const parts = Math.max(1, Math.min(workers, Math.ceil(total / (fps * 2))));
  const size = Math.ceil(total / parts);
  let done = 0;
  const segments = await Promise.all(
    Array.from({ length: parts }, async (_, i) => {
      const a = first + i * size;
      const b = Math.min(last, a + size);
      const file = path.join(tmp, `part-${i}.${ext}`);
      const { page, context } = await openStage();
      const ff = spawn(FFMPEG, encoder(file), { stdio: ['pipe', 'inherit', 'inherit'] });
      const exited = once(ff, 'close');
      for (let f = a; f < b; f++) {
        const png = await frame(page, (f * 1000) / fps);
        if (!ff.stdin.write(png)) await once(ff.stdin, 'drain');
        if (++done % fps === 0 || done === total) {
          process.stdout.write(`\r${done}/${total} frames, ${((Date.now() - started) / 1000).toFixed(0)}s`);
        }
      }
      ff.stdin.end();
      const [code] = await exited;
      if (code !== 0) throw new Error(`ffmpeg exited ${code} on segment ${i}`);
      await context.close();
      return file;
    }),
  );
  process.stdout.write('\n');

  const list = path.join(tmp, 'parts.txt');
  fs.writeFileSync(list, segments.map((file) => `file '${file.replace(/\\/g, '/')}'`).join('\n'));
  // A slice seeks the track to match, so it sounds like the same moment of the
  // full render.
  const audioIn = args.audio
    ? ['-ss', String(Number(args['audio-start'] ?? 0) + from), '-i', path.resolve(String(args.audio))]
    : [];
  const audioOut = args.audio
    ? [
        '-map', '0:v', '-map', '1:a',
        // Pad a short track with silence and cut a long one at the last frame.
        '-af', `apad,afade=t=out:st=${Math.max(0, to - from - 1.5).toFixed(2)}:d=1.5`, '-shortest',
        ...(prores ? ['-c:a', 'pcm_s16le'] : ['-c:a', 'aac', '-b:a', '192k']),
      ]
    : [];
  await run(FFMPEG, [
    '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, ...audioIn,
    '-c:v', 'copy', ...audioOut, ...(prores ? [] : ['-movflags', '+faststart']), out,
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(
    `${path.relative(process.cwd(), out)}: ${(total / fps).toFixed(1)}s at ${1920 * scale}x${1080 * scale}, ` +
      `${fps} fps, rendered in ${((Date.now() - started) / 1000).toFixed(0)}s`,
  );
}

async function still(seconds) {
  const { page } = await openStage();
  const out = path.join(OUT_DIR, `still-${seconds}.png`);
  fs.writeFileSync(out, await frame(page, seconds * 1000));
  console.log(path.relative(process.cwd(), out));
}

async function sheet(every) {
  const { page, info } = await openStage();
  const from = Number(args.from ?? 0);
  const to = Math.min(info.duration / 1000, Number(args.to ?? Infinity));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-sheet-'));
  let count = 0;
  for (let s = from; s < to; s += every) {
    const png = await frame(page, s * 1000, { timecode: true });
    fs.writeFileSync(path.join(tmp, `${String(count++).padStart(4, '0')}.png`), png);
  }
  const cols = Math.min(6, count);
  const out = path.join(OUT_DIR, 'sheet.png');
  await run(FFMPEG, [
    '-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(tmp, '%04d.png'),
    '-vf', `scale=480:-1,tile=${cols}x${Math.ceil(count / cols)}:padding=6:margin=6:color=0x26221a`,
    '-frames:v', '1', out,
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${path.relative(process.cwd(), out)}: ${count} frames, every ${every}s`);
}

// A page on a made-up origin whose every request is answered from disk: the
// stage, its fonts from node_modules, the captures, and the site's own
// public/ images. Nothing reaches the network.
async function openStage() {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  await context.route(`${ORIGIN}/**`, async (route) => {
    const file = resolveUrl(new URL(route.request().url()).pathname);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    await route.fulfill({
      body: fs.readFileSync(file),
      contentType: MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto(`${ORIGIN}/index.html`);
  const info = await page.evaluate(() => window.promo.ready);
  if (errors.length) throw errors[0];
  return { page, context, info };
}

function resolveUrl(pathname) {
  const p = decodeURIComponent(pathname);
  if (p.startsWith('/assets/')) return path.join(ROOT, p);
  if (p.startsWith('/fonts/')) return path.join(ROOT, 'node_modules', '@fontsource', p.slice('/fonts/'.length));
  if (p.startsWith('/site/')) return path.join(SITE_PUBLIC, p.slice('/site/'.length));
  return path.join(ROOT, 'promo', p === '/' ? 'index.html' : p);
}

async function frame(page, ms, options = {}) {
  await page.evaluate(([t, o]) => window.promo.seek(t, o), [ms, options]);
  return page.screenshot({ type: 'png' });
}

function encoder(file) {
  const video = prores
    ? ['-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le']
    : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p'];
  return [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    // Screenshots are sRGB; tag and convert as BT.709 so players show the
    // palette as it is on the site.
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    ...video, file,
  ];
}

function requireFfmpeg() {
  const probe = spawnSync(FFMPEG, ['-version']);
  if (probe.error || probe.status !== 0) {
    console.error(
      `ffmpeg not found (tried "${FFMPEG}"). Install it (macOS: brew install ffmpeg, ` +
        'Windows: winget install Gyan.FFmpeg, Linux: apt install ffmpeg) or set FFMPEG=/path/to/ffmpeg.',
    );
    process.exit(1);
  }
}

function run(command, argv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))));
  });
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
