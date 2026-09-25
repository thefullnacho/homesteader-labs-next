# Promo video

A 29.5 second promo for homesteaderlabs.com, built from the site itself. The
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
| 3 | §1 Grow food. | Kraft chapter card |
| 6 | Planting calendar | Zone 6b spring schedule, Tomatoes row highlighted |
| 6 | Knowledge base | "The crop files, rescued from a dead website", crops-on-file tally |
| 2 | §2 Know your land. | Kraft chapter card |
| 6 | Frost dates | Zone 6b's two frost dates ringed in marker |
| 7 | Forager game | A player picks Amanita muscaria; the reveal shows the model's 98% |
| 2 | §3 Make things work. | Kraft chapter card |
| 6 | Field notes | "Tested on a real homestead" ringed, notes-on-file tally |
| 6 | Drip build log | "It works anyway." |
| 6 | Promise | No account. No tracking. No ads. |
| 9 | End card | The homepage above the fold, with the address as the button |

Scene lengths are in beats at 120 BPM, so every cut lands on a beat of a 120 BPM
track. The storyboard is the `CUT` list at the top of `promo/promo.js`, and each
scene is one function below it.

## Render it

Needs Node 22 or later and ffmpeg (macOS `brew install ffmpeg`, Windows
`winget install Gyan.FFmpeg`, Linux `apt install ffmpeg`, or point `FFMPEG` at a
binary).

```bash
cd motion
npm install
npx playwright install chromium

npm run render                            # 1080p30 H.264 -> out/promo.mp4
npm run render -- --scale 2 --fps 60      # 4K60
npm run render -- --audio track.mp3       # lay a track under it, faded out over the last 1.5s
npm run render -- --prores                # ProRes 422 HQ .mov, for an editor
npm run render -- --from 8.5 --to 11.5    # one scene, to check it
npm run render -- --still 14.3            # one frame -> out/still-14.3.png
npm run preview                           # a frame every half second -> out/sheet.png
```

Frames are stepped, not recorded, so a slow machine renders the same video, just
more slowly. `--workers N` sets how many frames render in parallel (default: one
fewer than your cores, at most four). Output goes to `out/`, which is ignored by
git.

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
