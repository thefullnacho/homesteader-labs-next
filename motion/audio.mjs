// The promo's sound: a 120 BPM score and the sound effects the timeline cues,
// synthesised here from seeded noise and oscillators. No samples and no
// dependencies, so every machine renders the same track, and the score has
// no licence to clear.
//
//   score(duration, bpm)  a folk-ish bed: plucked guitar, bass, brushes, a bell hook
//   effects(cues)         one sound per cue from promo.js, each at its frame
//   mixdown(...)          both, as 48 kHz stereo 16-bit WAV bytes

export const RATE = 48000;

// ------------------------------------------------------------------- basics

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Bus {
  constructor(seconds) {
    this.l = new Float32Array(Math.ceil(seconds * RATE));
    this.r = new Float32Array(this.l.length);
  }

  // Adds a mono sound at `at` seconds, panned -1 (left) to 1 (right).
  add(mono, at, gain = 1, pan = 0) {
    const start = Math.round(at * RATE);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < mono.length; i++) {
      const j = start + i;
      if (j < 0 || j >= this.l.length) continue;
      this.l[j] += mono[i] * gl;
      this.r[j] += mono[i] * gr;
    }
  }

  // Adds a stereo pair, for sounds that move across the field.
  addStereo([l, r], at, gain = 1) {
    const start = Math.round(at * RATE);
    for (let i = 0; i < l.length; i++) {
      const j = start + i;
      if (j < 0 || j >= this.l.length) continue;
      this.l[j] += l[i] * gain;
      this.r[j] += r[i] * gain;
    }
  }

  mixInto(other, gain = 1) {
    for (let i = 0; i < this.l.length; i++) {
      other.l[i] += this.l[i] * gain;
      other.r[i] += this.r[i] * gain;
    }
  }
}

const buf = (seconds) => new Float32Array(Math.max(1, Math.round(seconds * RATE)));

function noise(seconds, seed) {
  const r = rng(seed);
  const out = buf(seconds);
  for (let i = 0; i < out.length; i++) out[i] = r() * 2 - 1;
  return out;
}

// RBJ biquad, with its centre allowed to move per sample.
function biquad(input, type, freq, q = 0.707) {
  const out = new Float32Array(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const f = typeof freq === 'function' ? freq : () => freq;
  for (let i = 0; i < input.length; i++) {
    const w = (2 * Math.PI * Math.min(f(i / RATE), RATE * 0.45)) / RATE;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === 'low') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; }
    else if (type === 'high') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; }
    else { b0 = alpha; b1 = 0; b2 = -alpha; }
    const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
    const x = input[i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}

function envelope(sound, fn) {
  for (let i = 0; i < sound.length; i++) sound[i] *= fn(i / RATE, i / sound.length);
  return sound;
}

const decay = (tau) => (t) => Math.exp(-t / tau);
const attackDecay = (a, tau) => (t) => (t < a ? t / a : Math.exp(-(t - a) / tau));

function sine(seconds, freq, phase = 0) {
  const out = buf(seconds);
  const f = typeof freq === 'function' ? freq : () => freq;
  let p = phase;
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.sin(p);
    p += (2 * Math.PI * f(i / RATE)) / RATE;
  }
  return out;
}

function sum(...parts) {
  const out = new Float32Array(Math.max(...parts.map(([s]) => s.length)));
  for (const [s, g] of parts) for (let i = 0; i < s.length; i++) out[i] += s[i] * g;
  return out;
}

// Karplus-Strong: a burst of noise ringing in a delay line the length of one
// period, averaged each pass so the highs die first, like a plucked string.
function pluck(freq, seconds, { seed = 1, bright = 0.5, sustain = 0.996 } = {}) {
  const out = buf(seconds);
  const n = Math.max(2, Math.round(RATE / freq));
  const line = biquad(noise(n / RATE, seed), 'low', 1200 + bright * 7000);
  let idx = 0;
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    const cur = line[idx];
    const next = sustain * (0.5 * (cur + prev) * (0.5 + bright * 0.5) + cur * (0.5 - bright * 0.5));
    prev = cur;
    line[idx] = next;
    out[i] = cur;
    idx = (idx + 1) % n;
  }
  return out;
}

const midi = (m) => 440 * 2 ** ((m - 69) / 12);

// Freeverb-style room: parallel combs into series allpasses, one set per side.
function reverb(bus, { room = 0.84, damp = 0.3, wet = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const alls = [556, 441, 341, 225];
  const side = (input, spread) => {
    const out = new Float32Array(input.length);
    for (const c of combs) {
      const len = Math.round(((c + spread) * RATE) / 44100);
      const line = new Float32Array(len);
      let idx = 0, store = 0;
      for (let i = 0; i < input.length; i++) {
        const y = line[idx];
        store = y * (1 - damp) + store * damp;
        line[idx] = input[i] * 0.015 + store * room;
        out[i] += y;
        idx = (idx + 1) % len;
      }
    }
    for (const a of alls) {
      const len = Math.round(((a + spread) * RATE) / 44100);
      const line = new Float32Array(len);
      let idx = 0;
      for (let i = 0; i < out.length; i++) {
        const b = line[idx];
        line[idx] = out[i] + b * 0.5;
        out[i] = b - out[i];
        idx = (idx + 1) % len;
      }
    }
    return out;
  };
  const wetBus = new Bus(bus.l.length / RATE);
  wetBus.l = side(bus.l, 0);
  wetBus.r = side(bus.r, 23);
  for (let i = 0; i < wetBus.l.length; i++) { wetBus.l[i] *= wet; wetBus.r[i] *= wet; }
  return wetBus;
}

// ---------------------------------------------------------------- the score

// D major, one chord a bar: D A Bm G. Voicings are open, like a capo'd acoustic.
const CHORDS = [
  { root: 38, notes: [50, 57, 62, 66, 69] },
  { root: 45, notes: [52, 57, 61, 64, 69] },
  { root: 47, notes: [50, 54, 59, 62, 66] },
  { root: 43, notes: [50, 55, 59, 62, 67] },
];

// The bell hook, two bars long: [beat, midi note].
const HOOK = [[0, 78], [0.5, 81], [1, 83], [2, 81], [2.75, 78], [3.5, 76], [4, 74], [5, 76], [5.5, 78], [6, 81]];

function kick() {
  return sum(
    [envelope(sine(0.3, (t) => 55 + 75 * Math.exp(-t / 0.025)), decay(0.07)), 0.55],
    [envelope(biquad(noise(0.02, 7), 'low', 3000), decay(0.004)), 0.4],
  );
}

function brush(seed) {
  return sum(
    [envelope(biquad(noise(0.35, seed), 'band', 2400, 0.7), attackDecay(0.004, 0.09)), 1.1],
    [envelope(sine(0.12, 190), decay(0.03)), 0.35],
  );
}

function shaker(seed, accent) {
  return envelope(biquad(noise(0.09, seed), 'high', 5500), (t) => (t < 0.012 ? t / 0.012 : Math.exp(-(t - 0.012) / 0.025)) * accent);
}

function bell(freq, seconds = 1.6) {
  return sum(
    [envelope(sine(seconds, freq), decay(0.55)), 1],
    [envelope(sine(seconds, freq * 2.76), decay(0.16)), 0.35],
    [envelope(sine(seconds, freq * 5.4), decay(0.05)), 0.15],
  );
}

function bassNote(freq, seconds) {
  const s = sum([sine(seconds, freq), 0.6], [sine(seconds, freq * 2), 0.3], [sine(seconds, freq * 3), 0.1]);
  return envelope(s, (t, p) => (t < 0.008 ? t / 0.008 : Math.exp(-t / 0.7)) * Math.min(1, (1 - p) * 20));
}

// A strum: strings a few ms apart, down or up, some muted.
function strum(bus, chord, at, { down = true, gain = 1, muted = false, seed = 1, ring = 1.6 } = {}) {
  const notes = down ? chord.notes : [...chord.notes].reverse();
  notes.forEach((m, i) => {
    const s = pluck(midi(m), muted ? 0.12 : ring, { seed: seed * 31 + i, bright: muted ? 0.15 : 0.55, sustain: muted ? 0.9 : 0.997 });
    if (muted) envelope(s, decay(0.03));
    bus.add(s, at + i * (down ? 0.011 : 0.008), gain * 0.34 * (1 - i * 0.05), -0.25 + i * 0.12);
  });
}

// Sections, in bars of four beats. The video's chapter cards and end card
// open bars 1, 5, 9 and 14; the three trust lines fall on beats 46 to 48.
export function score(duration, bpm = 120) {
  const beat = 60 / bpm;
  const bar = beat * 4;
  const dry = new Bus(duration + 3);
  const send = new Bus(duration + 3);
  const bars = Math.ceil(duration / bar);

  for (let b = 0; b < bars; b++) {
    const chord = CHORDS[b % 4];
    const t0 = b * bar;
    const intro = b < 4;
    const trust = t0 >= 22 && t0 < 26;
    const last = t0 >= 28;
    if (last) {
      // The last bar: one chord, left to ring out.
      strum(dry, CHORDS[0], t0, { gain: 1.3, seed: 900, ring: 2.8 });
      strum(send, CHORDS[0], t0, { gain: 0.8, seed: 900, ring: 2.8 });
      dry.add(bassNote(midi(38), 2.8), t0, 0.5);
      dry.add(kick(), t0, 0.9);
      dry.add(bell(midi(74), 2.5), t0 + 0.02, 0.18, 0.3);
      send.add(bell(midi(74), 2.5), t0 + 0.02, 0.2);
      continue;
    }

    for (let e = 0; e < 8; e++) {
      const at = t0 + e * (beat / 2);
      const beatNo = b * 4 + e / 2;
      if (trust && beatNo >= 44 && beatNo < 52) continue;
      // Down on the beats, up on the ands; the intro plays it muted till bar 3.
      const muted = intro && b < 2 && e % 2 === 1;
      strum(dry, chord, at, { down: e % 2 === 0, gain: (e % 2 ? 0.6 : 0.9) * (intro ? 0.75 : 1), muted, seed: b * 8 + e });
      if (e % 2 === 0) strum(send, chord, at, { gain: 0.35, seed: b * 8 + e });
    }

    if (trust) {
      // Stop time: a hit on each line, then a held chord under the last one.
      for (let k = 0; k < 3; k++) {
        const at = 23 + k * beat;
        strum(dry, CHORDS[[3, 1, 0][k]], at, { gain: 1.1, seed: 700 + k, ring: 0.9 });
        dry.add(kick(), at, 0.8);
      }
      strum(dry, CHORDS[1], 24.5, { gain: 0.7, seed: 720, ring: 1.6 });
      strum(send, CHORDS[1], 24.5, { gain: 0.6, seed: 720, ring: 1.6 });
      // Beats 44 and 45 before the stop keep the groove.
      if (b === 11) {
        for (let e = 0; e < 4; e++) strum(dry, chord, t0 + e * (beat / 2), { down: e % 2 === 0, gain: 0.8, seed: 800 + e });
        dry.add(kick(), t0, 1);
        dry.add(brush(801), t0 + beat, 0.5);
        dry.add(bassNote(midi(chord.root), beat * 2), t0, 0.55);
      }
      continue;
    }

    // Bass: root on 1, fifth on 3 once the band is in.
    dry.add(bassNote(midi(chord.root), beat * 2), t0, intro ? 0.35 : 0.55);
    if (!intro) dry.add(bassNote(midi(chord.root + 7), beat * 1.5), t0 + beat * 2, 0.45);
    if (!intro) dry.add(bassNote(midi(chord.root + 12), beat * 0.5), t0 + beat * 3.5, 0.3);

    // Drums: a kick on the one in the intro; the full pattern after.
    dry.add(kick(), t0, intro ? 0.7 : 1);
    if (!intro) {
      dry.add(kick(), t0 + beat * 2, 0.85);
      dry.add(kick(), t0 + beat * 2.5, 0.45);
      dry.add(brush(b * 2), t0 + beat, 0.55, 0.1);
      dry.add(brush(b * 2 + 1), t0 + beat * 3, 0.55, 0.1);
      send.add(brush(b * 2), t0 + beat, 0.25);
      send.add(brush(b * 2 + 1), t0 + beat * 3, 0.25);
    }
    // The fill into the chapter 3 card at 16s.
    if (b === 7) for (let k = 0; k < 4; k++) dry.add(brush(500 + k), t0 + beat * 3 + k * (beat / 4), 0.3 + k * 0.12, 0.2);
    const shakers = intro ? (b >= 2 ? 8 : 0) : 16;
    for (let s = 0; s < shakers; s++) {
      dry.add(shaker(b * 16 + s, s % 4 === 2 ? 1 : 0.5), t0 + s * (bar / shakers), 0.18, 0.45);
    }

    // The bell hook over the full band, twice per four bars.
    if (!intro && b % 2 === 0 && b < 11) {
      for (const [at, m] of HOOK) {
        dry.add(bell(midi(m)), t0 + at * beat, 0.12, 0.3);
        send.add(bell(midi(m)), t0 + at * beat, 0.14);
      }
    }
  }

  reverb(send, { room: 0.86, damp: 0.35 }).mixInto(dry, 0.9);
  return dry;
}

// ------------------------------------------------------------------ effects

// Paper crossing the frame: band-passed noise sweeping up and back, moving
// from right to left like the windows do.
function whoosh(seconds, seed, { low = 350, high = 2600, pan = true } = {}) {
  const n = noise(seconds, seed);
  const sweep = (t) => low + (high - low) * Math.sin(Math.PI * Math.min(1, t / seconds)) ** 1.5;
  const s = envelope(biquad(n, 'band', sweep, 0.9), (t, p) => Math.sin(Math.PI * p) ** 2);
  if (!pan) return [s, s];
  const l = new Float32Array(s.length), r = new Float32Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const p = i / s.length;
    l[i] = s[i] * (0.35 + 0.65 * p);
    r[i] = s[i] * (1 - 0.65 * p);
  }
  return [l, r];
}

function thud(freq, seconds, seed, click = 0.5) {
  return sum(
    [envelope(sine(seconds, (t) => freq * (1 + 0.8 * Math.exp(-t / 0.02))), decay(seconds / 4)), 1],
    [envelope(biquad(noise(0.05, seed), 'low', 1800), decay(0.01)), click],
  );
}

// Felt tip on paper: a band of hiss, roughened as the nib catches the grain.
function scratch(seconds, seed, { lo = 2600, hi = 5200, rough = 45, squeak = 0 } = {}) {
  const r = rng(seed);
  const n = biquad(biquad(noise(seconds, seed), 'band', (lo + hi) / 2, 0.8), 'high', lo * 0.7);
  let g = 0.6, target = 0.6, next = 0;
  const env = envelope(n, (t, p) => {
    if (t >= next) { target = 0.3 + r() * 0.7; next = t + 1 / (rough * (0.6 + r() * 0.8)); }
    g += (target - g) * 0.004;
    return g * Math.min(1, t / 0.015) * Math.min(1, (1 - p) * 12);
  });
  if (!squeak) return env;
  const tone = envelope(sine(seconds, (t) => 1700 + 220 * Math.sin(t * 19) + 90 * Math.sin(t * 53)), (t, p) => Math.sin(Math.PI * p) ** 3);
  return sum([env, 1], [tone, squeak]);
}

function ceramic(seed) {
  const partials = [[1180, 0.07], [2870, 0.05], [4410, 0.03], [6230, 0.02]];
  return sum(
    [thud(95, 0.3, seed, 1.2), 1],
    ...partials.map(([f, tau], i) => [envelope(sine(0.4, f), decay(tau)), 0.18 / (i + 1)]),
  );
}

// Coffee finding its way across paper: a wet hiss with small bubbles in it.
function slosh(seconds, seed) {
  const r = rng(seed);
  const out = sum([envelope(biquad(noise(seconds, seed), 'low', (t) => 900 - 500 * (t / seconds)), (t, p) => Math.min(1, t / 0.03) * (1 - p) ** 1.6), 0.8]);
  for (let k = 0; k < 26; k++) {
    const at = seconds * r() ** 1.8;
    const f = 380 + r() * 700;
    const blip = envelope(sine(0.05, (t) => f * (1 + t * 14)), (t) => Math.sin(Math.min(1, t / 0.05) * Math.PI));
    const start = Math.round(at * RATE);
    for (let i = 0; i < blip.length && start + i < out.length; i++) out[start + i] += blip[i] * 0.16 * (1 - at / seconds);
  }
  return out;
}

export function effects(cues, duration) {
  const bus = new Bus(duration + 3);
  cues.forEach((c, i) => {
    const at = c.at / 1000;
    const g = c.gain ?? 1;
    const seed = 1000 + i;
    const len = (c.duration ?? 400) / 1000;
    switch (c.sound) {
      case 'whoosh': bus.addStereo(whoosh(0.42, seed), at, 0.5 * g); break;
      case 'rise': bus.addStereo(whoosh(0.5, seed, { low: 200, high: 1300, pan: false }), at, 0.45 * g); break;
      case 'lift': bus.addStereo(whoosh(0.38, seed, { low: 500, high: 3400, pan: false }), at, 0.4 * g); break;
      case 'land': bus.add(thud(120, 0.12, seed, 0.9), at, 0.28 * g); break;
      case 'card': bus.add(sum([thud(160, 0.1, seed, 1.1), 1], [envelope(biquad(noise(0.08, seed + 1), 'band', 3000), decay(0.012)), 0.3]), at, 0.22 * g); break;
      case 'stamp': bus.add(thud(62, 0.35, seed, 1), at, 0.62 * g); break;
      case 'marker': bus.add(scratch(len, seed, { squeak: (c.weight ?? 6) > 10 ? 0.025 : 0.04 }), at, 0.2 * g * Math.min(1.4, 0.7 + (c.weight ?? 6) / 20), 0.15); break;
      case 'highlighter': bus.add(scratch(len, seed, { lo: 1400, hi: 3200, rough: 20 }), at, 0.16 * g, 0.1); break;
      case 'pencil': bus.add(scratch(len, seed, { lo: 3200, hi: 7500, rough: 14 }), at, 0.15 * g, 0.35); break;
      case 'tick': bus.add(sum([envelope(biquad(noise(0.02, seed), 'high', 3500), decay(0.002)), 1], [envelope(sine(0.03, 3100), decay(0.006)), 0.3]), at, 0.12 * g, -0.1); break;
      case 'click': bus.add(sum([envelope(biquad(noise(0.02, seed), 'band', 4200, 2), decay(0.0025)), 1], [envelope(sine(0.02, 2100), decay(0.004)), 0.4]), at, 0.35 * g, 0.4); break;
      case 'reveal': bus.add(sum([bell(midi(81), 1.4), 1], [bell(midi(86), 1.4), 0.7]), at, 0.16 * g, 0.4); break;
      case 'mug': bus.add(ceramic(seed), at, 0.75 * g, 0.45); break;
      case 'spill': bus.add(slosh(len, seed), at, 0.55 * g, 0.4); break;
      default: throw new Error(`no sound for cue "${c.sound}"`);
    }
  });
  return bus;
}

// ------------------------------------------------------------------ mixdown

// Sums the buses, trims to the video, and returns WAV bytes. A soft clip
// catches peaks; loudness is set by ffmpeg when it muxes.
export function mixdown(buses, duration) {
  const n = Math.round(duration * RATE);
  const l = new Float32Array(n), r = new Float32Array(n);
  for (const [bus, gain] of buses) {
    for (let i = 0; i < n && i < bus.l.length; i++) { l[i] += bus.l[i] * gain; r[i] += bus.r[i] * gain; }
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  const k = peak > 0 ? 0.9 / Math.max(0.9, peak * 0.8) : 1;
  const out = Buffer.alloc(44 + n * 4);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 4, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(RATE, 24); out.writeUInt32LE(RATE * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    out.writeInt16LE(Math.round(Math.tanh(l[i] * k) * 32000), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.tanh(r[i] * k) * 32000), 46 + i * 4);
  }
  return out;
}
