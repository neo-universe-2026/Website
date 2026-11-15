# Science, data and sonification

## Data sources

The dataset catalogue is defined in tracks.js. Each entry includes a title, video URL, poster image, description, suggested listening focus and source page. The source page is the authoritative place to check the original visualisation's scientific context.

Examples currently listed include:

- Night-time lights and changes in artificial lighting.
- Sea-surface temperature and ocean-current patterns.
- Atmospheric aerosols and air-quality model visualisations.
- Global ocean currents.
- Carbon dioxide transport visualisations.
- Lightning observations.
- Atmospheric rivers.
- GEDI forest-height measurements.
- A NASA reference sonification of Caldwell 73.

This list describes the media currently configured in the website. It does not mean that every dataset has a generated soundtrack.

## Visual explanation versus measured data

A video frame is a rendered representation of data. Its pixel colours, brightness and positions are affected by the visualisation's palette, projection, camera, annotations, compression and animation. Extracting pixels from a video therefore does not automatically recover the original scientific values.

For scientific interpretation, use the original dataset documentation and units. A sonification generated from rendered pixels should be described as an encoding of visual features unless the implementation explicitly reads the underlying numerical data.

## Current engine profile

The Sonificator engine's current analyser is specialised for a CO₂ globe video in which relevant emissions are rendered in orange. It estimates orange-pixel intensity, horizontal and vertical position, and spatial dispersion.

In the current synthesiser:

- Orange intensity affects the pulse envelope, tempo and musical energy.
- Horizontal position affects an initial musical fingerprint, melody pitch and stereo placement.
- Vertical position and dispersion are calculated and exposed by the API but do not yet have dedicated musical mappings.

This is a prototype mapping. It should not be presented as a validated scientific scale or as a universal mapping for all Earth datasets.

## Status in this website

The main globe website currently provides the visual and educational experience. Dataset soundtrack fields are currently unset, so ordinary dataset videos play without generated audio. The decorative sound-wave animation is not an audio visualisation. The Caldwell 73 reference video contains its own NASA-created sonification and is played with its source audio.

The separate Sonificator Studio repository demonstrates generated audio for a CO₂ visualisation using the Rust engine compiled to WebAssembly.

## Principles for a scientifically responsible sonification

Before adding a soundtrack for a dataset:

1. Identify the underlying scientific variable and its units.
2. Prefer original numerical data over colour-picking from a rendered video where possible.
3. Explain any transformations, normalisation, thresholds and missing-data handling.
4. Use a stable mapping so the same value or event has a consistent audible meaning.
5. Avoid implying that loudness, pitch or tempo is a direct physical unit unless it has been calibrated and validated.
6. Provide a legend or listening guide and retain access to the visual and textual explanation.
7. Test whether intended listeners can reliably interpret the sound.

## Accessibility and user testing

Sonification can add a non-visual channel, but it does not by itself make a product accessible. Controls need accessible names, keyboard operation, predictable focus, captions or text alternatives where appropriate, and options to pause motion and audio. Testing with people who use screen readers and other assistive technologies is essential.
