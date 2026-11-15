# Earth Information Jukebox: website

A NASA Space Apps 2026 "Earth Information Jukebox" site built around a 3D
globe. NASA's Earth datasets glow on the planet's surface; everything else
about the project (how it sounds, the quiz, about, the dataset list) orbits the
planet as moons. Whatever faces you as it spins is your choice.
It works with screen readers and the keyboard. Sound comes later.

## Open it

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
- The moving sound wave behind the planet is drawn in `globe.js` ("background"
  section). It is decorative for now and can later follow the real soundtrack.

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

- **Night Lights** comes only in H.265; some browsers can't play it. The panel
  says so and you can replace it.
- **GEOS Aerosols:** the 2025 page has still images only, so the video comes
  from NASA's related page (svs.gsfc.nasa.gov/5552).
- **Perpetual Ocean 2** (1.3 GB) and others stream from NASA and can be slow to
  start. The panel shows "Loading video from NASA…" while they buffer.
- **Caldwell 73** is NASA's own sonification example. It orbits as a star and
  is the only video with sound for now.

## Sound (later)

Videos play silent for now. When the backend makes a soundtrack per dataset,
add it to `tracks.js` (`soundtrack:` lines) and the globe panel can play it
alongside the video. The flat `player.html` already shows how to keep a
soundtrack in step with a video; its placeholder soundtrack path
(`JUKEBOX_PLACEHOLDER_SOUNDTRACK` in `tracks.js`) points at the main project's
`demos/JukeboxDemo.wav`, which is not in this repository.

## Credits

Visualizations by NASA's Scientific Visualization Studio, from the Earth
Information Jukebox challenge resources. Earth textures from the three.js
project. A NASA Space Apps Challenge 2026 project. Not endorsed by NASA.
