/*
  GLOBE DETAILS: the extra information shown on the 3D globe page.
  Keyed by the track id in tracks.js. The video, title and short description
  still come from tracks.js, so replacing a video there works here too.

    lat, lon   Where the glowing point sits on the globe (degrees)
    space      true = orbits the globe on the ring instead of sitting on it
    ringAngle  where on the orbit ring it sits (degrees, like a longitude)
    place      Name of that spot, read out when the globe faces it
    color      Colour of the glowing point
    science    Why this data matters, in plain words
    sound      How each feature of the picture becomes sound
    facts      [label, value] pairs shown as a fact list
*/
window.JUKEBOX_GLOBE = {
  "night-lights": {
    lat: 22, lon: 79, place: "India",
    color: "#f4a340",
    science: [
      "Every night, a satellite instrument called VIIRS photographs the dark side of Earth with a camera sensitive enough to see a single highway of streetlights. NASA averages a whole year of these pictures, removing moonlight, clouds and fires, to show where people light up the planet.",
      "Comparing 2012 with 2023 shows how the world changed. Fast-growing cities in India and the Middle East grew brighter. Places hit by war or power cuts, such as parts of Ukraine, went darker. Some European cities dimmed because they switched to more efficient lighting."
    ],
    sound: [
      ["Colour energy", "City lights are the only strong colour on the dark map, so the music stays in the quiet Sparse Drift groove over the ocean and swells as bright, growing cities fill the frame."],
      ["Zoomed views", "Each pop-out regional map moves the coloured area across the frame, panning the mix and lifting or dropping the melody's register as it goes."],
      ["The change map", "The purple and orange change map is a broad, colourful wash, so the groove turns busier and the key stays locked to the first bright frame."]
    ],
    facts: [
      ["Instrument", "VIIRS Day/Night Band, on the Suomi NPP satellite"],
      ["Time span", "Yearly averages, 2012 to 2023"],
      ["Colours", "Purple: more light. Orange: less light."],
      ["Video length", "About 43 seconds"]
    ]
  },

  "sea-surface": {
    lat: 0, lon: -140, place: "the equatorial Pacific Ocean",
    color: "#5fd3c6",
    science: [
      "Ocean currents carry heat from the tropics towards the poles, which shapes weather and climate on land. This animation comes from ECCO2, a computer model that combines satellite and ship measurements to recreate how the whole ocean moved over a year.",
      "The swirls are real features. Large, slow eddies peel off major currents like the Gulf Stream, and warm water stretches along the equator. Watching them move shows how the ocean stirs and spreads heat."
    ],
    sound: [
      ["Colour energy", "The currents colour nearly the whole map, so the groove sits in its busy state, and the music quickens and swells as colourful water spreads wider."],
      ["Warmth", "Warm reds and yellows near the equator shift the melody towards warm overtones; the cold blues cool it back towards a crisp, brighter tone."],
      ["Spread and position", "The main colour mass drifts with the currents, so the stereo pan and melodic register slowly follow the swirling water around the map."]
    ],
    facts: [
      ["Source", "ECCO2 ocean model (MIT and NASA JPL)"],
      ["Time span", "March 2007 to March 2008"],
      ["Colours", "Blue: cold. Red and yellow: warm."],
      ["Video length", "About 67 seconds"]
    ]
  },

  "aerosols": {
    lat: 16, lon: -20, place: "the Sahara and the Atlantic",
    color: "#e879d0",
    science: [
      "Aerosols are tiny particles floating in the air: dust blown off deserts, salt from sea spray, smoke from fires and sulfates from volcanoes and factories. They are too small to see one by one, but together they change air quality, cloud formation and how much sunlight reaches the ground.",
      "NASA's GEOS model tracks each type as winds carry it around the world. Saharan dust crosses the Atlantic to the Americas, and smoke from large fires can drift across whole continents."
    ],
    sound: [
      ["Colour energy", "Several bright particle colours on screen at once keep the groove dense and energetic."],
      ["Movement", "As the plumes drift and swirl, their combined centre slides across the frame, panning the music between the speakers."],
      ["Spread", "Widely scattered particles fill in a denser arpeggio; when the plumes thin out, the notes space apart."],
      ["One instrument for now", "The engine reads the frame as a whole, so smoke, dust and salt all feed one soundtrack together rather than separate part lines."]
    ],
    facts: [
      ["Source", "NASA GEOS atmosphere model"],
      ["Colours", "Orange and red: smoke and black carbon. Cyan: sea salt. Magenta: dust. Green: sulfates."],
      ["Video", "From NASA's related aerosols page, because the 2025 page has still images only"],
      ["Video length", "About 60 seconds"]
    ]
  },

  "air-quality": {
    lat: 33, lon: 112, place: "East Asia",
    color: "#c7b3ff",
    science: [
      "Air pollution harms the health of millions of people. NASA's GEOS-CF system works like a weather forecast for pollution, combining satellite measurements with a model of the atmosphere to predict where pollutants will be in the days ahead.",
      "It tracks fine particles small enough to reach deep into the lungs (PM2.5), ground-level ozone, carbon monoxide from burning, and nitrogen oxides from traffic and power plants."
    ],
    sound: [
      ["Colour energy", "Thin, sparse plumes keep the groove light; thick, colourful pollution over land builds the energy, tempo and loudness up."],
      ["Rotation", "As the forecast globe turns, the main colour mass sweeps across the frame, and the stereo pan and register follow it."]
    ],
    facts: [
      ["Source", "GEOS-CF composition forecasting system"],
      ["Pollutants", "PM2.5, ozone, carbon monoxide, nitrogen oxides"],
      ["Format", "Very wide video made for the Earth Information Center wall"],
      ["Video length", "About 75 seconds"]
    ]
  },

  "perpetual-ocean": {
    lat: 33, lon: 142, place: "the Kuroshio Current near Japan",
    color: "#8fd8ff",
    science: [
      "Western boundary currents are the fastest, strongest currents in the ocean. They run along the western edges of ocean basins: the Kuroshio past Japan, the Agulhas off South Africa and the Gulf Stream along North America.",
      "They move huge amounts of warm water and heat away from the tropics. The animation uses a very high-resolution ECCO ocean simulation and shows flow near the surface in white, with deeper currents glowing blue."
    ],
    sound: [
      ["Motion", "White currents on dark ocean barely register as colour, so the engine falls back on frame-to-frame motion: the moving water still drives the tempo, pan and density."],
      ["Energy", "From the Kuroshio to the Gulf Stream, the fast boundary currents keep the activity high, and quiet stretches of ocean relax it back into Sparse Drift."]
    ],
    facts: [
      ["Source", "ECCO high-resolution ocean simulation"],
      ["Currents shown", "Kuroshio, Agulhas, Gulf Stream"],
      ["Colours", "White: surface to 600 m. Blue and cyan: deeper than 600 m."],
      ["Video length", "About 5 minutes 17 seconds (large file, may load slowly)"]
    ]
  },

  "co2": {
    lat: 38, lon: -80, place: "the eastern United States",
    color: "#ffd36e",
    science: [
      "Carbon dioxide is the main gas driving climate change. It is invisible, but this simulation shows it as glowing plumes so you can watch it flow from power plants, cities and fires, and get pulled around the world by weather systems.",
      "The model is very detailed, with grid cells only a few kilometres wide. That is fine enough to show individual storms and the CO₂ released by a single region."
    ],
    sound: [
      ["Concentration", "Glowing plumes on a dark globe are sparse colour, so the video mostly sits in the slow Sparse Drift groove and lifts as the plumes and the camera's close-ups fill more of the frame."],
      ["Position", "The orbiting camera drags the CO₂ mass left and right across the frame, which gently pans the music between the speakers."],
      ["Fingerprint", "The hue and position of the first bright plume set the key and chord progression that the whole soundtrack uses."]
    ],
    facts: [
      ["Source", "NASA GEOS model run for the DYAMOND project"],
      ["Time span", "January to March 2020"],
      ["Unit", "Parts per million (ppm) of carbon dioxide"],
      ["Video length", "About 39 seconds"]
    ]
  },

  "lightning": {
    lat: -2, lon: 23, place: "the Congo Basin, Africa",
    color: "#eef3ff",
    science: [
      "The Lightning Imaging Sensor rode on the International Space Station and watched for the brief flashes of lightning, day and night. From orbit it could see lightning hidden inside clouds that people on the ground never notice.",
      "Over six years it shows where the world's storms are. Lightning is most common over land in the tropics, especially Central Africa, and it follows the seasons north and south of the equator."
    ],
    sound: [
      ["Each flash", "A flash is a sudden spike of colour on a dark globe: the engine's energy jolts, so the music swells louder and denser for a moment, then relaxes."],
      ["Clusters", "Busy storm regions keep the groove flowing between flashes; quiet stretches fall back to the sparse, slow drift."]
    ],
    facts: [
      ["Instrument", "Lightning Imaging Sensor (LIS) on the International Space Station"],
      ["Time span", "January 2017 to July 2023"],
      ["Window", "Each frame shows a moving 10-day window"],
      ["Video length", "About 3 minutes 37 seconds"]
    ]
  },

  "atmospheric-river": {
    lat: 37, lon: -135, place: "the northeast Pacific, heading for California",
    color: "#7ab8ff",
    science: [
      "An atmospheric river is a long, narrow band of water vapour flowing through the sky, often thousands of kilometres long. When one reaches the coast and rises over mountains, it can drop huge amounts of rain and snow in a few days.",
      "They bring much of the US West Coast's water supply, but strong ones cause floods. This 3D view from an Earth system model follows one as it streams across the ocean and reaches land."
    ],
    sound: [
      ["The river's path", "The bright vapour band against dark ocean is concentrated colour in one place, so the arpeggio stays focused and the band's position pans the mix."],
      ["Width and landfall", "When the band spreads out and brightens near land, both the colour energy and its spread rise, filling out the groove."]
    ],
    facts: [
      ["Source", "NASA Earth system model, 3D visualization"],
      ["What it shows", "Water vapour moving in three dimensions"],
      ["Video length", "About 4 minutes 52 seconds"]
    ]
  },

  "forest-height": {
    lat: -5, lon: -62, place: "the Amazon rainforest",
    color: "#8ee07a",
    science: [
      "GEDI is a laser instrument on the International Space Station. It fires short pulses at the ground and times the echoes from the top of the trees and from the forest floor, so it measures how tall forests are.",
      "Tall forests store more carbon. Knowing their height helps scientists work out how much carbon the world's forests hold, and how much is lost when they are cleared."
    ],
    sound: [
      ["Colour energy", "A full-frame colour map keeps the engine's energy high, so the groove is busy for the whole video."],
      ["Warmth", "Warm browns against cool greens and whites shift the melody's overtones between warm and bright as the palette changes."],
      ["Sweeping view", "As the view pans across continents, the main colour mass moves and the pan and register follow it."]
    ],
    facts: [
      ["Instrument", "GEDI lidar on the International Space Station"],
      ["Time span", "April 2019 to April 2020"],
      ["Colours", "Brown and dark green: shorter. Bright green and white: taller."],
      ["Note", "Height is exaggerated so differences show"],
      ["Video length", "About 51 seconds"]
    ]
  },

  "caldwell-73": {
    space: true, ringAngle: 180, place: "in orbit: a star cluster 40,000 light-years away",
    color: "#ffe3a3",
    science: [
      "Caldwell 73 is a globular cluster: hundreds of thousands of stars packed into a ball and held together by gravity. It is not Earth data, but NASA's sonification of it is a model for how this project turns pictures into sound.",
      "A line sweeps around the image like a radar. Each star it passes plays a note, and the whole picture becomes a choir."
    ],
    sound: [
      ["Distance from centre", "Stars farther from the middle play higher notes."],
      ["The whole image", "Becomes the sound of a choir."],
      ["Sweep", "The radar line sets the timing, so you hear the cluster in a circle."]
    ],
    facts: [
      ["Also called", "NGC 1851, in the constellation Columba"],
      ["Distance", "About 40,000 light-years"],
      ["Sound", "NASA's own soundtrack, played as it is"],
      ["Video length", "About 34 seconds"]
    ]
  }
};
