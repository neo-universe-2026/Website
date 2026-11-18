# Neo Universe: website

A NASA Space Apps 2026 "Earth Information Jukebox" challenge site, *Neo Universe*, built around a 3D
globe. NASA's Earth datasets glow on the planet's surface; everything else
about the project (how it sounds, the quiz, about, the dataset list) orbits the
planet as moons. Whatever faces you as it spins is your choice.
It works with screen readers and the keyboard. 

## Quick Start

### Using Nix (Recommended)

For a complete development environment with all tools:

```bash
# First time: generate flake.lock and enter shell
nix develop

# Subsequent uses: flake.lock exists
nix develop

# Then run the server
pnpm start
# or
npx http-server . -p 8080 -c-1
```

See [NIX.md](NIX.md) for more details on the Nix setup.

**Note:** On first use, `nix develop` will generate the `flake.lock` file which pins all dependency versions.

### Sonificator Integration

The website now uses [sonificator](https://github.com/neo-universe-2026/sonificator) for audio generation. After running `nix develop`, build the WASM files:

```bash
git clone https://github.com/neo-universe-2026/sonificator.git
cd sonificator/sonificator
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen target/wasm32-unknown-unknown/release/sonificator.wasm \
  --out-dir ../../wasm/ \
  --target web
```

The wave-bg visualizer will then sync with sonificator's audio output.

### Without Nix

Run this from this folder, then open <http://localhost:8080/>:

```bash
npx -y http-server . -p 8080 -c-1
```

The globe needs a web server and an internet connection (three.js and the
Earth images load from a CDN). Double-clicking `index.html` won't show the 3D.
It also works on GitHub Pages: Settings > Pages > deploy from the `main` branch.

## Using the globe

- The Earth spins slowly. Whatever faces you, a dataset on the surface or a
  moon in orbit, is shown in the card at the bottom.
- Drag to spin it yourself. The ‹ › buttons, or the Left and Right arrow keys,
  turn to the previous or next choice in spin order.
- **Explore** / **Open**, clicking a point or moon, or Enter opens it. The camera
  zooms in and a panel opens. **Back to globe** or Escape closes it.
- The header menu (How it sounds, Quiz, About, Datasets) turns the globe to
  that moon and opens it.
- **Pause spinning** stops the globe. It starts paused if the device asks for
  reduced motion.
- "Everything on the globe", under the globe, lists every choice without 3D.
- The moving sound wave behind the planet follows the Sonificator's live audio
  output: its energy and horizontal colour focus pulse the wave.
- While a dataset video plays, the Sonificator engine generates its soundtrack
  from the video frames, and a meter under the video shows the engine's live
  readings (colour energy, left-right and up-down focus, and spread).

## Accessibility pop-up

The **Accessibility** button on the right edge (top-right on phones), or
`Alt + A` / `?`, opens a pop-up. Its settings change the page straight away and
are remembered on the device:

| Setting | What it does |
| --- | --- |
| Read aloud | The site speaks choices and opened pages with the device's voice |
| Announce while spinning | Reads each new choice as the globe turns by itself |
| Stop all motion | Stops the globe, the sound wave and all animations |
| Larger text | All text 25% bigger |
| High contrast | Brighter text, solid backgrounds, quieter wave |
| Single-key shortcuts | Turn off if letter keys clash with a screen reader or voice control |

Working shortcuts: Left/Right turn the globe, Enter (on the globe) or `O` opens,
Escape closes, `S` pauses spinning, `W` says what is facing you, `L` jumps to
the list. The pop-up also has a **Test announcement** button for checking a
screen reader. See `NVDA-TEST.md` for a full screen-reader test script.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The home page: globe, chooser, panel and topic content |
| `globe.js` | The 3D globe, orbiting moons, chooser, panel, quiz and settings |
| `globe.css` | Globe page styles (on top of `style.css`) |
| `tracks.js` | **Video list. Edit to change a dataset's video or text.** |
| `globe-data.js` | **Where each point sits, and the longer explanations** |
| `style.css` | Shared colours, type and focus styles |
| `player.html`, `app.js` | The earlier flat list player, kept as a simple non-3D version |
| `globe.html` | Redirects old links to the home page |
| `NVDA-TEST.md` | Screen-reader test script |

To change a moon (its title, colour or place on the orbit), edit `TOPICS` at the
top of `globe.js`. Its panel text is in `index.html` under `view-<id>`.

## Replace a video

**For good:** put the file in a `videos/` folder, then change that dataset's
`video:` line in `tracks.js`, for example `video: "videos/night-lights.mp4"`.
Use MP4 (H.264) or WebM.

**From the site:** open a dataset, then **Replace this video**. Paste a link or
path, or choose a file. Links are remembered in this browser; files last until
you reload. **Restore NASA's video** undoes it.

## Video notes

- `videos/<track>.mp4` files are generated by `scripts/fetch-videos.sh` from
  NASA's originals (the night-lights original is 8K H.265, which browsers
  mostly can't play, and two others are very large). The originals stay at
  each track's `source:` link in `tracks.js`.
- **GEOS Aerosols:** the 2025 page has still images only, so the video comes
  from NASA's related page (svs.gsfc.nasa.gov/5552).
- **Caldwell 73** is NASA's own sonification example. It orbits as a star and
  plays NASA's own soundtrack, so it isn't fetched.

## Sound (Sonificator)

The Sonificator engine (Rust, compiled to WebAssembly) generates sound live
while a video plays: it samples each frame and maps colour energy, position,
spread and warmth onto a pentatonic soundtrack. See the **How pictures become
sound** topic on the globe for the full mapping.

Browsers will not let a page read the pixels of videos served from another
domain, and NASA's servers don't send CORS headers, so every sonified video
must come from this origin. `scripts/fetch-videos.sh` (run by `pnpm build`,
by `scripts/dev.sh` when a video is missing, and by the Pages workflow)
downloads NASA's originals, caches them under `.cache/svs-src/`, and
transcodes sonifiable H.264 copies into `videos/` (max width 1280, no
audio). If you _replace_ a video with a NASA link at runtime, the soundtrack
stays quiet. See the Sonificator Integration section above for building the
WASM, and `sonificator/README.md` for the engine itself.

The flat `player.html` predates the live engine and still plays a soundtrack
file alongside the video if one is set (`soundtrack:` lines in `tracks.js`;
its placeholder path `JUKEBOX_PLACEHOLDER_SOUNDTRACK` points at the main
project's `demos/JukeboxDemo.wav`, which is not in this repository).

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md) — purpose, repository roles and implementation status.
- [Science and sonification](docs/SCIENCE_AND_SONIFICATION.md) — data sources, interpretation guidance and current audio status.
- [NVDA screen-reader test script](NVDA-TEST.md) — manual accessibility test procedure.

The audio engine and browser demonstration have their own technical documentation:
- [Sonificator engine](https://github.com/neo-universe-2026/sonificator)
- [Sonificator Studio](https://github.com/neo-universe-2026/sonificator-website)

## Credits

Visualizations by NASA's Scientific Visualization Studio, from the Earth
Information Jukebox challenge resources. Earth textures from the three.js
project. A NASA Space Apps Challenge 2026 project. Not endorsed by NASA.
