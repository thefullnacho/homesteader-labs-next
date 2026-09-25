# Promo video

A 30 second promo for homesteaderlabs.com, built from the site itself. The
stage is an HTML page in the paper field-notebook system; headless Chromium
steps its timeline one frame at a time and ffmpeg encodes the frames. Every
screen in the cut is a real capture of the site, and every number on screen is
read off the live pages at capture time, never typed into the storyboard.

This folder is its own package. Nothing in it is imported by the site, and the
site's `npm install` never installs it.

## The cut

Three chapters on the homepage tagline, each followed by the tools that back it
up, then the promise, then the homepage as the end card.

| Beats | Scene | What is on screen |
|-------|-------|-------------------|
| 4 | §1 Grow food. | Kraft chapter card |
| 6 | Planting calendar | Zone 6b spring schedule, Tomatoes row highlighted |
| 6 | Knowledge base | "The crop files, rescued from a dead website", crops-on-file tally |
| 2 | §2 Know your land. | Kraft chapter card |
| 6 | Frost dates | Zone 6b's two frost dates ringed in marker |
| 8 | Forager game | A player picks Amanita muscaria; the reveal shows the model's 98% |
| 2 | §3 Make things work. | Kraft chapter card |
| 6 | Field notes | "Tested on a real homestead" ringed, notes-on-file tally |
| 6 | Drip build log | "It works anyway." |
| 6 | Promise | No account. No tracking. No ads. |
| 8 | End card | The homepage above the fold, with the address as the button |

Scene lengths are in beats at 120 BPM: every cut lands on a beat, and the three
chapter cards and the end card open on the first beat of a bar. The storyboard
is the `CUT` list at the top of `promo/promo.js`, and each scene is one function
below it.

## Render it

Needs Node 22 or later and ffmpeg (macOS `brew install ffmpeg`, Windows
`winget install Gyan.FFmpeg`, Linux `apt install ffmpeg`, or point `FFMPEG` at a
binary).

```bash
cd motion
npm install
npx playwright install chromium

npm run render                            # 1080p30 H.264 -> out/promo.mp4, with score and effects
npm run render -- --scale 2 --fps 60      # 4K60
npm run render -- --audio song.mp3        # a track in place of the score, faded out over the last 1.5s
npm run render -- --no-score              # sound effects only
npm run render -- --no-sfx                # score (or --audio track) only
npm run render -- --silent                # no audio
npm run render -- --clean                 # no film grain or vignette
npm run render -- --prores                # ProRes 422 HQ .mov, for an editor
npm run render -- --from 9 --to 12        # one scene, to check it
npm run render -- --still 15              # one frame -> out/still-15.png
npm run preview                           # a frame every half second -> out/sheet.png
```

Frames are stepped, not recorded, so a slow machine renders the same video, just
more slowly. `--workers N` sets how many frames render in parallel (default: one
fewer than your cores, at most four). Output goes to `out/`, which is ignored by
git.

## Sound

`audio.mjs` synthesises everything you hear, from seeded noise and
oscillators, so there are no samples to license and every machine renders the
same track:

- **The score.** A 120 BPM folk bed in D (D, A, Bm, G): plucked guitar strums,
  bass, brushes, a shaker and a bell hook. The intro is muted strums and a kick
  until the band comes in on the §2 card. It stops for the three trust lines,
  with one hit on each, and ends on one chord ringing out at 28s.
- **The effects.** Each animation in `promo/promo.js` that should make a noise
  calls `cue(sound, ms)` beside its tween: whooshes as windows slide in and
  out, a stamp on each chapter card and checkbox, marker and highlighter
  scratches as long as their strokes, ticks as the tallies count, the mouse
  click and a bell on the game's reveal, pencil on "Learn by doing.", and a mug
  and a spill for the coffee. Move an animation and its sound moves with it.

The mix is loudness normalised to -14 LUFS, the level most platforms play at.

## Film

A vignette and a grain that changes 24 times a second sit over every frame,
including stills. `--clean` drops both. Grain is expensive to encode: with it
the full cut takes about three times as long and the 1080p file is about 60 MB,
against 16 MB clean. H.264 is encoded with `-tune grain` so it keeps the grain
rather than smearing it.

## Adding a song

The cut is 60 beats at 120 BPM, so a 120 BPM song (or a 60 BPM one at half time)
lines up without touching the video. Find the downbeat you want the video to
open on and pass its time:

```bash
npm run render -- --audio song.mp3 --audio-start 12.4
```

The song replaces the built-in score. The sound effects stay on top of it
unless you pass `--no-sfx`.

Short tracks are padded with silence and long ones cut at the last frame, with a
1.5s fade out. A slice (`--from`, `--to`) seeks the song to match, so checking one
scene sounds like that moment of the full render. For another tempo, change
`BPM` in `promo/promo.js`: scene lengths scale with it (30s at 120), and the
timing inside each scene is tuned for about 110 to 130.

## Refresh the screens

The captures in `assets/screens/` and the counts in `screens.json` come from
`capture.mjs`. Re-run it when the pages change:

```bash
npm run capture -- --base https://homesteaderlabs.com
npm run capture -- --base https://localhost:3000             # a local npm run dev
npm run capture -- --base https://homesteaderlabs.com --only kb,notes
```

It saves each shot at 2x, the boxes the marker strokes are drawn around, and
the facts the promo quotes (crops on file, notes on file, game rounds and
domains). If a page no longer shows one of those, capture stops with an error
rather than letting a render show a stale number. The forager-game round is
dealt with a seeded shuffle, so the shot is always the same Amanita round.
