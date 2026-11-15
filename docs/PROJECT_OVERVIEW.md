# Earth Information Jukebox — project overview

## Summary

Earth Information Jukebox is an interactive way to explore NASA Earth-science visualisations through a 3D globe and a set of orbiting topic panels. It is designed to make complex Earth data more approachable through visual exploration, plain-language explanations, and an accessibility-first interface.

The wider Neo Universe project also develops a sonification engine: software that turns selected visual patterns into sound. The engine and its browser demonstration are maintained in separate repositories. The main globe website is currently the exploration and learning interface; its dataset-specific generated soundtracks are not yet connected.

## The problem we are addressing

Scientific visualisations can contain patterns that are difficult to notice quickly, and visual-only interfaces can exclude people who are blind or have low vision. Earth Information Jukebox provides multiple ways to explore the same collection: a navigable globe, a plain list of topics, descriptive text, keyboard interaction and screen-reader announcements.

Sonification is a complementary direction: sound can provide another way to perceive change, rhythm, distribution and contrast in a dataset. It should supplement—not replace—scientific labels, units and explanations.

## Main experience

- A 3D Earth globe presents dataset locations and visual topics.
- Orbiting panels provide project information, a listening quiz, dataset listings and explanations.
- Dataset panels include a video, a plain-language description and notes about what a future sonification could make audible.
- A non-3D list provides an alternative way to reach all content.
- Accessibility controls include read-aloud support, announcements, reduced motion, larger text, high contrast and configurable single-key shortcuts.

## Repository map

| Repository | Responsibility | Current status |
| --- | --- | --- |
| [Website](https://github.com/neo-universe-2026/Website) | 3D globe, topic panels, dataset catalogue and accessibility experience | Interactive website implemented |
| [sonificator](https://github.com/neo-universe-2026/sonificator) | Rust frame-analysis and audio-synthesis engine; CLI renderer | Engine and renderer implemented; current analyser is CO₂/orange-pattern specific |
| [sonificator-website](https://github.com/neo-universe-2026/sonificator-website) | Browser demo connecting video, WebAssembly and Web Audio | Focused browser demonstration implemented |

The repositories are developed separately. The main Website does not currently load the Sonificator WASM module or play generated per-dataset soundtracks.

## Scientific content

The dataset catalogue is maintained in tracks.js; globe positions and longer explanations are maintained in globe-data.js. Each dataset entry identifies its source visualisation and provides descriptive text. The current collection includes examples such as night-time lights, sea-surface currents and temperature, aerosols, air quality, ocean currents, carbon dioxide, lightning, atmospheric rivers and forest height.

The source pages and media are provided by NASA's Scientific Visualization Studio and related NASA resources. Refer to the source link attached to each dataset for its original context, methods and caveats.

## Sonification status

The Rust engine currently analyses orange-coloured activity in video frames and maps selected features to musical parameters. Sonificator Studio demonstrates this pipeline with a CO₂ globe animation.

In the main Website, dataset soundtrack entries are currently unset and the ordinary dataset videos are silent. The moving wave graphic is decorative. The Caldwell 73 reference item is an exception because its NASA source video already contains its own sonification.

This distinction matters: the project demonstrates both an accessible dataset-exploration interface and a working sonification prototype, but the two are not yet integrated into one seamless experience.

## Accessibility approach

The interface is designed to remain usable without relying on 3D vision alone. Users can navigate by keyboard, open content from the plain list, receive spoken announcements and adjust motion and visual presentation. The repository includes an NVDA-oriented manual test script in NVDA-TEST.md.

Accessibility should be checked in the actual browser and assistive-technology combinations used for a submission. The presence of controls alone does not establish that every interaction is accessible.

## Intended next steps

1. Define a scientific feature model for each dataset rather than applying the orange-pixel detector to every video.
2. Design and document consistent feature-to-sound mappings, including units and interpretation guidance.
3. Generate and validate dataset-specific soundtracks.
4. Integrate those soundtracks into the main globe player with synchronised controls.
5. Test the complete experience with blind and low-vision users and with representative screen readers.
6. Publish reproducible setup, test and deployment instructions for the integrated experience.
