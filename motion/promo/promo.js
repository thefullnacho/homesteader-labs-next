// Homesteader Labs promo: the storyboard and its timeline.
//
// The stage is a fixed 1920x1080 page. Every animation is created paused, and
// render.mjs calls promo.seek(ms) once per frame, so a slow frame can never
// drop or smear one. Scene lengths are counted in beats at 120 BPM, which puts
// every cut on a beat of any 120 BPM track laid under the video.

const BPM = 120;
const BEAT = 60000 / BPM;

// The cut, top to bottom: [scene, beats].
const CUT = [
  ['chapter1', 3], ['schedule', 6], ['kb', 6],
  ['chapter2', 2], ['zone', 6], ['game', 7],
  ['chapter3', 2], ['notes', 6], ['drip', 6],
  ['trust', 6], ['end', 9],
];

const T = {};
let beats = 0;
for (const [id, length] of CUT) {
  T[id] = { start: beats * BEAT, end: (beats + length) * BEAT };
  beats += length;
}
const DURATION = beats * BEAT;

const EASE = {
  out: 'cubic-bezier(.2, .8, .2, 1)',
  in: 'cubic-bezier(.55, 0, .75, .15)',
  inOut: 'cubic-bezier(.65, 0, .35, 1)',
  snap: 'cubic-bezier(.2, .9, .25, 1)',
  land: 'cubic-bezier(.16, 1.06, .3, 1)',
  cam: 'cubic-bezier(.45, .05, .25, 1)',
  pen: 'cubic-bezier(.55, .1, .35, 1)',
};

// Browser windows on the stage. Captures are 1440 CSS px wide.
const WIN = { x: 170, y: 96, w: 1580, h: 884 };
const GAME_WIN = { x: 1100, y: 56, w: 666 };
const BAR = 52;
const BORDER = 3;

const stage = document.getElementById('stage');
let SCREENS;
let F;

// ------------------------------------------------------------------ timeline

const anims = [];
const windows = [];
const counters = [];
const animated = new WeakMap();

// An element's first animation of a property fills backwards, so it holds its
// start state until it begins. Later ones only fill forwards: a backward fill
// would override the earlier animation, because the later one always wins.
function tween(node, keyframes, start, duration, easing = EASE.out) {
  const props = keyframes.flatMap((k) => Object.keys(k)).filter((p) => p !== 'offset' && p !== 'easing');
  const seen = animated.get(node) ?? new Set();
  const first = props.every((p) => !seen.has(p));
  props.forEach((p) => seen.add(p));
  animated.set(node, seen);
  const anim = node.animate(keyframes, { delay: start, duration, easing, fill: first ? 'both' : 'forwards' });
  anim.pause();
  anims.push(anim);
}

// Visible from `from` until `to`. Children fall back to inheriting.
function show(node, from, to) {
  windows.push([node, from, to]);
}

function count(node, to, start, duration) {
  counters.push((ms) => {
    const p = Math.min(1, Math.max(0, (ms - start) / duration));
    node.textContent = String(Math.round(to * (1 - (1 - p) ** 3)));
  });
}

function seek(ms, { timecode = false } = {}) {
  for (const anim of anims) anim.currentTime = ms;
  for (const [node, from, to] of windows) node.style.visibility = ms >= from && ms < to ? '' : 'hidden';
  for (const update of counters) update(ms);
  const tc = document.getElementById('timecode');
  tc.hidden = !timecode;
  tc.textContent = `${(ms / 1000).toFixed(1)}s`;
}

// ----------------------------------------------------------------------- DOM

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'style') Object.assign(node.style, value);
    else node.setAttribute(key, value);
  }
  node.append(...children.flat(Infinity).filter((c) => c != null));
  return node;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

const px = (n) => `${n}px`;
const place = ({ x, y, w, h }) => ({ left: px(x), top: px(y), width: px(w), height: px(h) });
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function scene(className = '') {
  const node = el('section', { class: `scene ${className}`.trim() });
  stage.append(node);
  return node;
}

function words(text) {
  return text.split(' ').map((word, i) => [i ? ' ' : null, el('span', { class: 'w' }, el('span', {}, word))]);
}

function revealWords(root, start, stagger = 70, duration = 380) {
  root.querySelectorAll('.w > span').forEach((span, i) =>
    tween(span, [{ transform: 'translateY(110%)' }, { transform: 'none' }], start + i * stagger, duration, EASE.snap),
  );
}

function fadeUp(node, start, duration = 380, distance = 22) {
  tween(node, [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'none' }], start, duration);
}

// Deterministic jitter, so the torn edges and marker wobble render the same
// on every machine.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A clip-path with torn edges, like .torn-top: clockwise from the top left.
function torn(w, h, { top = 0, left = 0, bottom = 0 }, seed) {
  const r = rng(seed);
  const step = () => 16 + r() * 30;
  const pts = [];
  if (top) {
    for (let x = 0; x < w; x += step()) pts.push([x, r() * top]);
    pts.push([w, r() * top]);
  } else {
    pts.push([left ? r() * left : 0, 0], [w, 0]);
  }
  if (bottom) {
    for (let x = w; x > 0; x -= step()) pts.push([x, h - r() * bottom]);
    pts.push([left ? r() * left : 0, h - r() * bottom]);
  } else {
    pts.push([w, h], [left ? r() * left : 0, h]);
  }
  if (left) for (let y = h; y > 0; y -= step()) pts.push([r() * left, y]);
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
}

// ---------------------------------------------------------------- marker ink

// A hand-drawn ring: a little over one turn, the pen landing off its start.
function ring({ x, y, width, height }, seed = 1) {
  const r = rng(seed);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2 + 16;
  const ry = height / 2 + 14;
  const phase = r() * 6;
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const f = i / 80;
    const t = -2.4 + f * Math.PI * 2 * 1.09;
    const wobble = 1 + 0.035 * Math.sin(t * 3 + phase) + 0.015 * Math.sin(t * 7 + phase);
    pts.push([cx + rx * wobble * (1 + f * 0.05) * Math.cos(t), cy + ry * wobble * (1 - f * 0.04) * Math.sin(t)]);
  }
  return `M${pts.map(([u, v]) => `${u.toFixed(1)} ${v.toFixed(1)}`).join(' L')}`;
}

function underline({ x, y, width, height }) {
  const base = y + height + 4;
  return `M${x - 8} ${base + 4} C${x + width * 0.3} ${base - 5}, ${x + width * 0.62} ${base + 7}, ${x + width + 10} ${base - 6}`;
}

// A highlighter pass, .hl on the site: one flat stroke across the text.
function sweep({ x, y, width, height }) {
  const mid = y + height / 2;
  return `M${x - 10} ${mid + 1.5} L${x + width + 10} ${mid - 1.5}`;
}

function tick(x, y, size = 1) {
  const p = (dx, dy) => `${(x + dx * size).toFixed(1)} ${(y + dy * size).toFixed(1)}`;
  return `M${p(18, 50)} L${p(44, 80)} L${p(108, -10)}`;
}

function drawStroke(svg, d, width, start, duration, className = '') {
  const path = svgEl('path', { d, pathLength: 1, 'stroke-width': width });
  if (className) path.setAttribute('class', className);
  path.style.strokeDasharray = '1 2';
  svg.append(path);
  tween(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], start, duration, EASE.pen);
  show(path, start, Infinity);
}

// ------------------------------------------------------------------- windows

// A browser window holding a capture, with a camera that pans and pushes in.
// Views are { x, y, z }: the capture point at the screen's top left, and zoom
// over fit-to-width. Views are clamped so the camera never leaves the page.
function browser(parent, shotName, url, rect, { narrow = false } = {}) {
  const data = SCREENS.shots[shotName];
  const screen = { w: rect.w - 2 * BORDER, h: rect.h - 2 * BORDER - BAR };
  const k = screen.w / data.width;
  const cam = el('div', { class: 'cam' });
  parent.append(
    el('section', { class: 'win', style: place(rect) },
      el('header', { class: 'win-bar' },
        el('span', { class: 'url' }, url),
        narrow ? null : el('span', { class: 'cap' }, `Captured ${SCREENS.capturedAt}`)),
      el('div', { class: 'win-screen' }, cam)),
  );

  const layer = (name) => {
    const shot = SCREENS.shots[name];
    const svg = svgEl('svg', { class: 'marks', width: shot.width, height: shot.height, viewBox: `0 0 ${shot.width} ${shot.height}` });
    const node = el('div', { class: 'layer' },
      el('img', { src: `/assets/screens/${shot.file}`, width: shot.width, height: shot.height, alt: '' }), svg);
    cam.append(node);
    return { node, svg, marks: shot.marks };
  };

  const transform = ({ x = 0, y = 0, z = 1 }) => {
    const s = k * z;
    const cx = clamp(x, 0, Math.max(0, data.width - screen.w / s));
    const cy = clamp(y, 0, Math.max(0, data.height - screen.h / s));
    return `translate(${(-cx * s).toFixed(2)}px, ${(-cy * s).toFixed(2)}px) scale(${s.toFixed(5)})`;
  };

  let view = { x: 0, y: 0, z: 1 };
  cam.style.transform = transform(view);
  const main = layer(shotName);

  return {
    ...main,
    k,
    layer,
    // The view that centres these boxes at zoom z, nudged by dx, dy.
    focus(boxes, z, { dx = 0, dy = 0 } = {}) {
      const x0 = Math.min(...boxes.map((b) => b.x));
      const y0 = Math.min(...boxes.map((b) => b.y));
      const x1 = Math.max(...boxes.map((b) => b.x + b.width));
      const y1 = Math.max(...boxes.map((b) => b.y + b.height));
      const s = k * z;
      return { x: (x0 + x1) / 2 - screen.w / s / 2 + dx, y: (y0 + y1) / 2 - screen.h / s / 2 + dy, z };
    },
    set(to) {
      view = to;
      cam.style.transform = transform(view);
    },
    move(to, start, duration, easing = EASE.cam) {
      tween(cam, [{ transform: transform(view) }, { transform: transform(to) }], start, duration, easing);
      view = to;
    },
  };
}

// How a scene arrives and leaves. After a chapter card the window rises as the
// card lifts; between shots windows slide like papers across a desk; before a
// chapter card the shot simply waits to be covered.
function motion(node, t, enter, exit) {
  let from = t.start - 40;
  if (enter === 'rise') {
    from = t.start - 120;
    tween(node, [{ transform: 'translateY(170px)' }, { transform: 'none' }], from, 480, EASE.out);
  } else if (enter === 'slide') {
    tween(node, [{ transform: 'translateX(2080px)' }, { transform: 'none' }], from, 460, EASE.land);
  }
  let to = t.end + 40;
  if (exit === 'slide') {
    tween(node, [{ transform: 'none' }, { transform: 'translateX(-2120px)' }], t.end - 60, 360, EASE.in);
    to = t.end + 300;
  }
  show(node, from, to);
}

function caption(parent, { lines, sub, display = false }, start) {
  const card = el('div', { class: `card caption${display ? ' display' : ''}` },
    lines.map((line, i) => [i ? el('br') : null, line]),
    sub ? el('span', { class: 'sub' }, sub) : null);
  parent.append(card);
  fadeUp(card, start, 400, 26);
}

function tally(parent, label, value, start) {
  if (!Number.isFinite(value)) throw new Error(`tally "${label}" has no value; re-run npm run capture`);
  const num = el('span', { class: 'num' }, String(value));
  const card = el('div', { class: 'card tally' }, el('span', { class: 'lbl' }, label), num);
  parent.append(card);
  num.style.width = px(Math.ceil(num.getBoundingClientRect().width) + 4);
  tween(card, [
    { opacity: 0, transform: 'translateY(26px) scale(.94)' },
    { opacity: 1, transform: 'scale(1.03)', offset: 0.7 },
    { opacity: 1, transform: 'none' },
  ], start, 420, EASE.out);
  count(num, value, start + 60, 1000);
}

// ------------------------------------------------------------------- scenes

function chapter(t, { no, title, next }, first = false) {
  const h1 = el('h1', {}, words(title));
  const noEl = el('div', { class: 'no' }, no);
  const nextEl = el('p', { class: 'next' }, next);
  const ink = svgEl('svg', { class: 'marks', width: 1990, height: 1150 });
  const sheet = el('div', { class: 'sheet grain', style: { clipPath: torn(1990, 1150, { left: 40, bottom: 46 }, t.start + 11) } },
    el('div', { class: 'body' }, noEl, h1, nextEl), ink);
  const node = scene('chapter');
  node.append(sheet);

  // Titles fill the frame, whatever their length.
  h1.style.fontSize = '100px';
  h1.style.fontSize = px(Math.min(300, (100 * 1580) / h1.getBoundingClientRect().width).toFixed(1));
  const h = h1.getBoundingClientRect();
  const s = sheet.getBoundingClientRect();
  drawStroke(ink, underline({ x: h.left - s.left, y: h.top - s.top, width: h.width, height: h.height * 0.9 }), 15, t.start + 420, 380);

  const from = first ? 0 : t.start - 330;
  if (!first) {
    tween(sheet, [{ transform: 'translateX(2080px)' }, { transform: 'none' }], from, 330, EASE.out);
    fadeUp(noEl, t.start - 60, 320, 16);
  }
  revealWords(h1, first ? 40 : t.start - 120, 90, 420);
  tween(nextEl, [{ opacity: 0 }, { opacity: 1 }], t.start + 480, 320);
  tween(sheet, [{ transform: 'none' }, { transform: 'translateY(-1260px)' }], t.end - 120, 380, EASE.in);
  show(node, from, t.end + 270);
}

function schedule(t) {
  const node = scene();
  const s = browser(node, 'schedule', 'homesteaderlabs.com/tools/planting-calendar/zone/6b/', WIN);
  motion(node, t, 'rise', 'slide');
  // Fill the window with the table, then read down it.
  s.set({ x: 190, y: 0, z: 1.3 });
  s.move({ x: 190, y: 560, z: 1.36 }, t.start + 150, t.end - t.start, EASE.inOut);
  drawStroke(s.svg, sweep(s.marks.tomatoes), s.marks.tomatoes.height + 6, t.start + 700, 520, 'hl');
  caption(node, { lines: ['Start, transplant, harvest:', 'counted from your frost dates.'] }, t.start + 450);
}

function kb(t) {
  const node = scene();
  const s = browser(node, 'kb', 'homesteaderlabs.com/kb/', WIN);
  motion(node, t, 'slide', 'cover');
  drawStroke(s.svg, underline(s.marks.headline), 7, t.start + 450, 420);
  s.move({ x: 150, y: 420, z: 1.22 }, t.start + 1150, t.end - t.start - 950);
  tally(node, 'Crops on file', F.kbCrops, t.start + 600);
}

function zone(t) {
  const node = scene();
  const s = browser(node, 'zone', 'homesteaderlabs.com/tools/planting-calendar/zone/6b/', WIN);
  motion(node, t, 'rise', 'slide');
  const { last, first } = s.marks;
  s.move(s.focus([last, first], 1.5, { dy: 70 }), t.start + 250, 1000);
  s.move(s.focus([last, first], 1.56, { dy: 70 }), t.start + 1250, t.end - t.start - 1100, 'linear');
  drawStroke(s.svg, ring(last, 1), 6, t.start + 1250, 420);
  drawStroke(s.svg, ring(first, 2), 6, t.start + 1250 + BEAT, 420);
  caption(node, { lines: ['Two frost dates.', 'Everything else is arithmetic.'], display: true }, t.start + 550);
}

function game(t) {
  const node = scene();
  const round = SCREENS.shots['game-round'];
  const k = (GAME_WIN.w - 2 * BORDER) / round.width;
  const rect = { ...GAME_WIN, h: Math.round(round.height * k) + 2 * BORDER + BAR };
  const s = browser(node, 'game-round', 'homesteaderlabs.com/tools/forager-game/play/', rect, { narrow: true });
  const reveal = s.layer('game-reveal');

  const h2 = el('h2', {}, words('Can you'), el('br'), words('beat the AI?'));
  const facts = el('p', { class: 'facts' }, `${F.gameRounds} rounds · ${F.gameDomains} domains · real photos`);
  const deck = el('p', { class: 'deck' }, 'Pick a species, then see how the vision model scored on the same photo.');
  node.append(el('div', { class: 'game-copy' }, h2, facts, deck));
  motion(node, t, 'slide', 'cover');
  revealWords(h2, t.start + 260, 70, 420);
  fadeUp(facts, t.start + 650);
  fadeUp(deck, t.start + 900);

  // Pick the answer the way a player would.
  const pick = s.marks.pick;
  const at = {
    x: rect.x + BORDER + (pick.x + pick.width * 0.32) * k,
    y: rect.y + BORDER + BAR + (pick.y + pick.height * 0.55) * k,
  };
  const click = t.start + 1400;
  const cursor = svgEl('svg', { class: 'cursor', viewBox: '0 0 23 29' });
  cursor.append(svgEl('path', {
    d: 'M1.5 1.5 L1.5 22.5 L7 17.2 L10.6 25.8 L14.4 24.2 L10.9 15.8 L18.4 15.8 Z',
    fill: '#26221a', stroke: '#f5f0e2', 'stroke-width': 1.6, 'stroke-linejoin': 'round',
  }));
  const ripple = el('div', { class: 'ripple', style: { left: px(at.x), top: px(at.y) } });
  node.append(ripple, cursor);
  const there = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px)`;
  tween(cursor, [{ transform: `translate(${(at.x + 240).toFixed(1)}px, 1120px)` }, { transform: there }], t.start + 600, 750, EASE.inOut);
  tween(cursor, [{ transform: there }, { transform: `${there} scale(.8)`, offset: 0.4 }, { transform: there }], click, 220, 'linear');
  tween(cursor, [{ opacity: 1 }, { opacity: 0 }], click + 550, 300);
  show(cursor, t.start + 600, click + 900);
  tween(ripple, [{ opacity: 1, transform: 'scale(.3)' }, { opacity: 0, transform: 'scale(2.4)' }], click + 40, 500, EASE.out);
  show(ripple, click + 40, click + 560);

  // The reveal: your pick, the model's pick, and how sure it was.
  tween(reveal.node, [{ opacity: 0 }, { opacity: 1 }], click + 90, 140, 'linear');
  s.move(s.focus([reveal.marks.answer, reveal.marks.ai], 1.1), click + 200, 700);
  drawStroke(reveal.svg, ring(reveal.marks.ai, 3), 6, click + 800, 420);
}

function notes(t) {
  const node = scene();
  const s = browser(node, 'notes', 'homesteaderlabs.com/archive/', WIN);
  motion(node, t, 'rise', 'slide');
  s.move(s.focus([s.marks.stamp], 1.35, { dx: 300, dy: 130 }), t.start + 200, 1000);
  drawStroke(s.svg, ring(s.marks.stamp, 4), 6, t.start + 1150, 420);
  s.move({ x: 150, y: 380, z: 1.2 }, t.start + 1800, t.end - t.start - 1600);
  tally(node, 'Notes on file', F.notes, t.start + 700);
}

function drip(t) {
  const node = scene();
  const s = browser(node, 'drip', 'homesteaderlabs.com/archive/diy-drip-irrigation-raised-beds/', WIN);
  motion(node, t, 'slide', 'slide');
  s.move(s.focus([s.marks.works], 1.6, { dx: 200, dy: 70 }), t.start + 450, 950);
  drawStroke(s.svg, sweep(s.marks.works), s.marks.works.height + 8, t.start + 1350, 420, 'hl');
  caption(node, { lines: ['“It works anyway.”'], sub: 'From the drip irrigation build log', display: true }, t.start + 1500);
}

function trust(t) {
  const node = scene('trust');
  const ink = svgEl('svg', { class: 'marks', width: 1920, height: 1080 });
  ['No account.', 'No tracking.', 'No ads.'].forEach((text, i) => {
    const y = 150 + i * 236;
    const line = el('div', { class: 'line', style: { top: px(y) } }, words(text));
    const box = el('div', { class: 'box', style: { top: px(y + 30) } });
    node.append(box, line);
    const at = t.start + 120 + i * BEAT;
    tween(box, [{ opacity: 0, transform: 'rotate(-1.5deg) scale(1.3)' }, { opacity: 1, transform: 'rotate(-1.5deg)' }], at, 260);
    revealWords(line, at, 70, 380);
    drawStroke(ink, tick(172, y + 30, 1.24), 18, at + 330, 260);
  });
  const foot = el('div', { class: 'foot' }, 'Tool data stays in your browser');
  node.append(ink, foot);
  fadeUp(foot, t.start + 3 * BEAT + 300, 400, 14);
  show(node, t.start - 60, t.end + 50);
}

function end(t) {
  const tagline = el('h2', { class: 'tagline' },
    ['Grow food.', 'Know your land.', 'Make things work.'].map((line) => el('span', { class: 'w' }, el('span', {}, line))));
  const lede = el('p', { class: 'lede' }, 'Practical tools and field notes from a garden in progress.');
  const arrow = svgEl('svg', { width: 34, height: 26, viewBox: '0 0 34 26' });
  arrow.append(svgEl('path', { d: 'M2 13 H30 M19 2 L31 13 L19 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 3.4 }));
  const cta = el('div', { class: 'cta' }, 'homesteaderlabs.com', arrow);
  const reassure = el('p', { class: 'reassure' }, 'Free tools. No account.');
  const photo = el('img', { src: '/site/images/seedlings_sprouting.png', alt: '' });
  const hand = el('span', { class: 'hand' }, 'Learn by doing.');
  const figure = el('figure', {}, el('div', { class: 'photo' }, photo),
    el('figcaption', {}, el('span', {}, 'A season starts here.'), hand));
  const mast = el('header', { class: 'mast' },
    el('img', { src: '/site/images/homesteaderlabs_logo_flask_seedlingv2.jpeg', alt: '' }),
    el('span', { class: 'name' }, 'Homesteader Labs'),
    el('span', { class: 'tag' }, 'Field guides & tools'));
  const sheet = el('div', { class: 'sheet grain', style: { clipPath: torn(1920, 1140, { top: 46 }, 29) } },
    el('div', { class: 'content' }, mast, tagline, lede, cta, reassure, figure));
  const node = scene('end');
  node.append(sheet);

  tween(sheet, [{ transform: 'translateY(1180px)' }, { transform: 'none' }], t.start - 380, 440, EASE.out);
  tagline.querySelectorAll('.w > span').forEach((span, i) =>
    tween(span, [{ transform: 'translateY(110%)' }, { transform: 'none' }], t.start + 60 + i * BEAT, 420, EASE.snap));
  tween(figure, [{ opacity: 0, transform: 'translateX(140px)' }, { opacity: 1, transform: 'none' }], t.start + 250, 600, EASE.out);
  tween(photo, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }], t.start + 250, t.end - t.start, 'linear');
  fadeUp(lede, t.start + 3 * BEAT);
  tween(cta, [
    { opacity: 0, transform: 'scale(.9)' },
    { opacity: 1, transform: 'scale(1.04)', offset: 0.65 },
    { opacity: 1, transform: 'none' },
  ], t.start + 4 * BEAT, 420, EASE.out);
  fadeUp(reassure, t.start + 4.5 * BEAT, 380, 14);
  tween(hand, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], t.start + 5 * BEAT, 750, 'cubic-bezier(.4, .1, .6, .9)');
  show(node, t.start - 380, Infinity);
}

// -------------------------------------------------------------------- build

const FACES = ['400 100px "Archivo Black"', '400 40px Newsreader', 'italic 400 40px Newsreader',
  '500 20px "IBM Plex Mono"', '600 20px "IBM Plex Mono"', '600 40px Caveat'];

async function build() {
  await Promise.all(FACES.map((face) => document.fonts.load(face)));
  const missing = FACES.filter((face) => !document.fonts.check(face));
  if (missing.length) throw new Error(`fonts did not load: ${missing.join(', ')}`);

  SCREENS = await (await fetch('/assets/screens/screens.json')).json();
  F = SCREENS.facts;

  chapter(T.chapter1, { no: '§1', title: 'Grow food.', next: 'Planting calendar · Crop files' }, true);
  schedule(T.schedule);
  kb(T.kb);
  chapter(T.chapter2, { no: '§2', title: 'Know your land.', next: 'Frost dates · Field ID' });
  zone(T.zone);
  game(T.game);
  chapter(T.chapter3, { no: '§3', title: 'Make things work.', next: 'Field notes · Build logs' });
  notes(T.notes);
  drip(T.drip);
  trust(T.trust);
  end(T.end);

  await Promise.all([...document.images].map((img) => img.decode()));
  seek(0);
  return { duration: DURATION, bpm: BPM, width: 1920, height: 1080 };
}

window.promo = { ready: build(), seek, duration: DURATION };
