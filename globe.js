// Earth Information Jukebox home: a spinning Earth. NASA datasets glow on the
// surface; every other topic orbits it as a moon. Whatever faces you is the
// current choice. Open it to read, watch, or (for topics) take part.
import * as THREE from "three";

// Sonificator integration — initAudio() runs on the first user gesture,
// because browsers refuse to start an AudioContext without one.
let sonificatorEngine = null;
let sonificatorInit = null;      // promise for the in-flight init
let audioCtx = null;
let analyzer = null, waveData = null;
let outGain = null;
let frameCount = 0;

async function initAudio() {
  if (audioCtx) { if (audioCtx.state === "suspended") audioCtx.resume(); return; }

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  analyzer = audioCtx.createAnalyser();
  analyzer.fftSize = 2048;
  waveData = new Uint8Array(analyzer.frequencyBinCount);
  outGain = audioCtx.createGain();
  outGain.gain.value = 2.0;                       // sonificator output is quiet
  outGain.connect(analyzer);
  analyzer.connect(audioCtx.destination);

  // Load the sonificator wasm-bindgen bindings (optional: without them the
  // visualiser still tracks the video's own audio).
  sonificatorInit = (async () => {
    try {
      const mod = await import("./wasm/pkg/sonificator_wasm.js");
      await mod.default();                        // wasm-bindgen init()
      sonificatorEngine = new mod.WasmSonificator(audioCtx.sampleRate);
      console.log("Sonificator ready at", audioCtx.sampleRate, "Hz");
    } catch (e) {
      console.warn("Sonificator unavailable, visualiser uses the video audio only:", e.message);
      return;
    }
    // Continuous pull: every audio callback drains the engine.
    // render(n) returns an interleaved Float32Array of 2*n samples.
    // (1 input channel, never connected: some browsers reject 0-input nodes.)
    const node = audioCtx.createScriptProcessor(2048, 1, 2);
    node.onaudioprocess = (e) => {
      const L = e.outputBuffer.getChannelData(0);
      const R = e.outputBuffer.getChannelData(1);
      if (!sonificatorEngine) { L.fill(0); R.fill(0); return; }
      let s;
      try { s = sonificatorEngine.render(L.length); }
      catch (err) { L.fill(0); R.fill(0); return; }
      for (let i = 0; i < L.length; i++) { L[i] = s[i * 2]; R[i] = s[i * 2 + 1]; }
    };
    node.connect(outGain);
  })();
}

const TRACKS = window.JUKEBOX_TRACKS || [];
const GLOBE = window.JUKEBOX_GLOBE || {};
const REDUCED_MEDIA = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TEX = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/";
const STORE_KEY = "earth-jukebox-replacements-v1";
const SPIN_SPEED = 0.1;            // radians per second, about one turn a minute
const RESUME_AFTER = 8000;         // ms without input before the spin restarts
const RING_R = 1.6;                // orbit radius of the moons
const RING_TILT = 0.28;            // orbit tilted towards the viewer
const DEG = Math.PI / 180;
const $ = (id) => document.getElementById(id);

/* ---------- topics that orbit the globe ---------- */
// angle = position on the orbit, chosen to fall between the datasets' longitudes
const TOPICS = [
  { id: "how", nav: "How it sounds", title: "How pictures become sound", place: "How the Sonificator turns colour, brightness and movement into music", color: "#f4a340", angle: -107 },
  { id: "quiz", nav: "Quiz", title: "Listening quiz", place: "Three quick questions", color: "#7ee0d4", angle: -41 },
  { id: "about", nav: "About", title: "About the project", place: "The challenge, our approach and sources", color: "#c7b3ff", angle: 51 },
  { id: "datasets", nav: "Datasets", title: "All datasets", place: "Every Earth video in one list", color: "#8ee07a", angle: 127 },
];

/* ---------- saved video replacements (shared with the list version) ---------- */
let saved = {};
try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { /* private window */ }
const sessionFiles = {};
function saveReplacements() { try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) { /* not saved */ } }

function videoFor(t) {
  return sessionFiles[t.id] || (saved[t.id] && saved[t.id].video) || t.video;
}

/* ---------- everything on the globe, in one list ---------- */
const all = [];
TRACKS.forEach((t) => {
  const g = GLOBE[t.id] || {};
  all.push({
    ...t, ...g,
    kind: "data",
    ring: !!g.space,
    angle: g.space ? (g.ringAngle ?? 180) : g.lon,
    color: g.color || "#f4a340",
    place: g.place || "",
  });
});
TOPICS.forEach((t) => all.push({ ...t, kind: "topic", ring: true }));
all.forEach((it, i) => { it.index = i; });

// "Next" follows the spin: as the globe turns, things further west come round.
const order = all.map((it) => it.index).sort((a, b) => all[b].angle - all[a].angle);
const posOf = (i) => order.indexOf(i);

const kindLabel = (it) => it.kind === "topic" ? "Topic in orbit" : it.ring ? "Dataset in orbit" : "Earth dataset";
const whereText = (it) => it.kind === "topic" ? it.place : it.ring ? it.place : `Over ${it.place}`;
const verb = (it) => it.kind === "topic" ? "Open" : "Explore";
const whereSaid = (it) => whereText(it).replace(/^Over /, "over ").replace(/^In orbit/, "in orbit");

/* ---------- accessibility settings (remembered on this device) ---------- */
const A11Y_KEY = "earth-jukebox-a11y-v1";
const settings = { readAloud: false, announceSpin: false, stopMotion: REDUCED_MEDIA, largeText: false, highContrast: false, singleKeys: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem(A11Y_KEY)) || {}); } catch (e) { /* defaults */ }
const still = () => settings.stopMotion;

function applySettings() {
  document.documentElement.classList.toggle("large-text", settings.largeText);
  document.body.classList.toggle("high-contrast", settings.highContrast);
  document.body.classList.toggle("motion-off", settings.stopMotion);
  document.querySelectorAll("[data-setting]").forEach((el) => { el.checked = !!settings[el.dataset.setting]; });
  if (!settings.readAloud && "speechSynthesis" in window) speechSynthesis.cancel();
}
function saveSettings() { try { localStorage.setItem(A11Y_KEY, JSON.stringify(settings)); } catch (e) { /* not saved */ } }

/* ---------- announcements: screen reader, plus the device voice if Read aloud is on ---------- */
let annTimer;
function speak(text) {
  if (!settings.readAloud || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
function announce(msg) {
  const el = $("announcer");
  clearTimeout(annTimer);
  el.textContent = "";
  annTimer = setTimeout(() => { el.textContent = msg; }, 60);
  speak(msg);
}

/* ---------- state ---------- */
let focused = order[0];
let userPaused = settings.stopMotion;
let resumeAt = 0;
let exploring = false;
let yaw = -Math.PI / 2 - 20 * DEG, pitch = 0.32;
let yawVel = 0;
let targetYaw = null, targetPitch = null;
let dragging = false;
let returnFocusTo = null;

/* ---------- chooser, menus and lists (work without WebGL too) ---------- */
function renderChooser() {
  const it = all[focused];
  $("data-count").textContent = `${kindLabel(it)}, ${posOf(focused) + 1} of ${all.length}`;
  $("data-title").textContent = it.title;
  $("data-place").textContent = whereText(it);
  $("explore-verb").textContent = verb(it);
  $("explore-name").textContent = `: ${it.title}`;
  document.querySelector(".chooser-card").style.setProperty("--card-color", it.color);
  $("globe-wrap").setAttribute("aria-label", `Globe, facing ${it.title}`);
}

function listButton(it, onClick) {
  const li = document.createElement("li");
  const b = document.createElement("button");
  b.type = "button";
  b.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="name"></span><span class="where"></span>';
  b.querySelector(".dot").style.color = it.color;
  b.querySelector(".name").textContent = it.title;
  b.querySelector(".where").textContent = whereText(it);
  b.setAttribute("aria-label", `${verb(it)} ${it.title}`);
  b.addEventListener("click", () => onClick(b));
  li.appendChild(b);
  return li;
}

function renderLists() {
  all.forEach((it) => {
    const list = it.kind === "topic" ? $("topic-list") : $("dataset-list");
    list.appendChild(listButton(it, (b) => { select(it.index, false); open(it.index, b); }));
    if (it.kind === "data") {
      // The "All datasets" topic switches the panel straight to the dataset.
      $("all-datasets").appendChild(listButton(it, () => { select(it.index, false); fillPanel(it.index); }));
    }
  });
  TOPICS.forEach((t) => {
    const it = all.find((x) => x.kind === "topic" && x.id === t.id);
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "topic-link";
    b.textContent = t.nav;
    b.setAttribute("aria-label", `Open ${t.title}`);
    b.addEventListener("click", () => { select(it.index, false); open(it.index, b); });
    li.appendChild(b);
    $("topic-nav").appendChild(li);
  });
}

function nearestAngle(from, to) {
  const turn = Math.PI * 2;
  return from + ((((to - from) % turn) + turn + Math.PI) % turn) - Math.PI;
}

// Choose something and turn the globe until it faces you.
function select(i, speak) {
  focused = i;
  const it = all[i];
  targetYaw = nearestAngle(yaw, -Math.PI / 2 - it.angle * DEG);
  targetPitch = it.ring ? 0.32 : it.lat * DEG * 0.9;
  yawVel = 0;
  resumeAt = performance.now() + RESUME_AFTER;
  renderChooser();
  if (speak) announce(`${it.title}. ${kindLabel(it)}, ${whereSaid(it)}. Press Enter to ${verb(it).toLowerCase()}.`);
}
function step(dir) { select(order[(posOf(focused) + dir + order.length) % order.length], true); }

$("prev-data").addEventListener("click", () => step(-1));
$("next-data").addEventListener("click", () => step(1));
$("explore-button").addEventListener("click", (e) => open(focused, e.currentTarget));

const spinBtn = $("spin-toggle");
function renderSpinBtn() { spinBtn.textContent = userPaused ? "Start spinning" : "Pause spinning"; }
spinBtn.addEventListener("click", () => {
  userPaused = !userPaused;
  // Starting the spin by hand also lifts "Stop all motion".
  if (!userPaused && settings.stopMotion) { settings.stopMotion = false; applySettings(); saveSettings(); }
  resumeAt = 0;
  renderSpinBtn();
  announce(userPaused ? "Spinning paused" : "Spinning");
});

const wrap = $("globe-wrap");
wrap.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(focused, wrap); }
});

/* ---------- the Accessibility pop-up ---------- */
const a11y = $("a11y");
let a11yOpener = null;
function openA11y(opener) {
  if (a11y.open) return;
  a11yOpener = opener || document.activeElement;
  applySettings();
  a11y.showModal();
  $("a11y-title").focus();
  announce("Accessibility settings opened");
}
function closeA11y() {
  if (!a11y.open) return;
  a11y.close();
  if (a11yOpener && a11yOpener.focus) a11yOpener.focus();
}
$("a11y-button").addEventListener("click", (e) => openA11y(e.currentTarget));
$("a11y-close").addEventListener("click", closeA11y);
a11y.addEventListener("cancel", (e) => { e.preventDefault(); closeA11y(); });
a11y.addEventListener("click", (e) => { if (e.target === a11y) closeA11y(); });   // click outside the box

const SETTING_SAYS = {
  readAloud: ["Read aloud on", "Read aloud off"],
  announceSpin: ["Announcing while spinning", "Not announcing while spinning"],
  stopMotion: ["All motion stopped", "Motion on"],
  largeText: ["Larger text on", "Larger text off"],
  highContrast: ["High contrast on", "High contrast off"],
  singleKeys: ["Single-key shortcuts on", "Single-key shortcuts off"],
};
document.querySelectorAll("[data-setting]").forEach((el) => {
  el.addEventListener("change", () => {
    const k = el.dataset.setting;
    settings[k] = el.checked;
    if (k === "stopMotion") { userPaused = el.checked; renderSpinBtn(); }
    applySettings();
    saveSettings();
    announce(SETTING_SAYS[k][el.checked ? 0 : 1]);
  });
});
$("a11y-test").addEventListener("click", () => {
  const msg = "Test announcement. If you can hear this, your screen reader works with this page.";
  const out = $("a11y-test-result");
  out.textContent = `Sent: "${msg}" If you heard nothing, check that your screen reader is running and its speech is on.`;
  out.hidden = false;
  announce(msg);
});

/* ---------- keyboard shortcuts that work anywhere on the page ---------- */
document.addEventListener("keydown", (e) => {
  const t = e.target;
  const typing = t.tagName === "INPUT" && !["checkbox", "radio", "button"].includes(t.type) || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
  if (typing || e.ctrlKey || e.metaKey) return;

  if (e.altKey && (e.key === "a" || e.key === "A" || e.code === "KeyA")) { e.preventDefault(); openA11y(document.activeElement); return; }
  if (e.altKey || detail.open || a11y.open) return;          // dialogs handle their own keys (Escape)

  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    if (t.type === "radio") return;
    e.preventDefault();
    step(e.key === "ArrowLeft" ? -1 : 1);
    return;
  }
  if (!settings.singleKeys) return;
  switch (e.key.toLowerCase()) {
    case "o": e.preventDefault(); open(focused, document.activeElement); break;
    case "s": e.preventDefault(); spinBtn.click(); break;
    case "w": e.preventDefault(); announce(`Facing ${all[focused].title}. ${kindLabel(all[focused])}, ${whereSaid(all[focused])}.`); break;
    case "l": e.preventDefault(); location.hash = "everything"; $("everything-heading").setAttribute("tabindex", "-1"); $("everything-heading").focus(); break;
    case "?": e.preventDefault(); openA11y(document.activeElement); break;
  }
});

/* ---------- the panel ---------- */
const detail = $("detail");
const dVideo = $("detail-video");
let panelItem = null, videoPlaying = false;

function fillPairs(dl, pairs) {
  dl.innerHTML = "";
  (pairs || []).forEach(([k, v]) => {
    const div = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = k;
    dd.textContent = v;
    div.append(dt, dd);
    dl.appendChild(div);
  });
}

function fillPanel(i) {
  const it = all[i];
  panelItem = it;
  stopVideo();
  detail.style.setProperty("--detail-color", it.color);
  $("detail-place").textContent = it.kind === "topic" ? "In orbit" : whereText(it);
  $("detail-title").textContent = it.title;
  document.querySelectorAll("#detail .view").forEach((v) => { v.hidden = true; });

  if (it.kind === "topic") {
    $(`view-${it.id}`).hidden = false;
  } else {
    $("view-dataset").hidden = false;
    $("detail-see").textContent = it.description || "";
    const sci = $("detail-science");
    sci.innerHTML = "";
    (it.science || []).forEach((p) => { const el = document.createElement("p"); el.textContent = p; sci.appendChild(el); });
    fillPairs($("detail-sound"), it.sound);
    $("detail-listen").textContent = it.listenFor || "";
    fillPairs($("detail-facts"), it.facts);
    $("detail-source").href = it.source || "#";
    $("replace-url").value = (saved[it.id] && saved[it.id].video) || "";
    $("replace-file").value = "";
    $("replace-box").open = false;
    loadVideo(it);
  }
  detail.scrollTop = 0;
  $("detail-title").focus();
}

function loadVideo(it) {
  const replaced = videoFor(it) !== it.video;
  const note = $("detail-note");
  note.textContent = replaced ? "You replaced this video, so the text here may not match it." : (it.note || "");
  note.hidden = !note.textContent;
  $("detail-video-msg").hidden = true;
  dVideo.poster = it.poster || "";
  dVideo.src = videoFor(it);
  // Sound comes later. Only NASA's Caldwell 73 example has its own soundtrack.
  dVideo.muted = !it.videoHasSound;
  $("detail-status").textContent = it.videoHasSound ? "This one has NASA's own sound." : "The soundtrack is generated live from the video frames.";
}

function open(i, opener) {
  returnFocusTo = opener || $("explore-button");
  if (focused !== i) select(i, false);
  exploring = true;
  fillPanel(i);
  if (!detail.open) detail.showModal();
  document.body.classList.add("is-exploring");
  $("detail-title").focus();
  const it = all[i];
  const first = it.kind === "topic" ? ($(`view-${it.id}`).querySelector("p") || {}).textContent : it.description;
  announce(`Opened ${it.title}`);
  // Read aloud also reads the first part of the page.
  if (settings.readAloud) speak(`${it.title}. ${first || ""}`);
}

function closePanel() {
  if (!detail.open) return;
  stopVideo();
  detail.close();
  document.body.classList.remove("is-exploring");
  exploring = false;
  resumeAt = performance.now() + RESUME_AFTER;
  if (returnFocusTo) returnFocusTo.focus();
  announce("Back to the globe");
}
$("detail-close").addEventListener("click", closePanel);
detail.addEventListener("cancel", (e) => { e.preventDefault(); closePanel(); });

function setVideoPlaying(on) {
  videoPlaying = on;
  detail.classList.toggle("is-playing", on);
  $("detail-play-text").textContent = on ? "Pause video" : "Play video";
  $("detail-play").setAttribute("aria-label", `${on ? "Pause" : "Play"} video, ${panelItem ? panelItem.title : ""}`);
}
function stopVideo() { dVideo.pause(); setVideoPlaying(false); }

$("detail-play").addEventListener("click", () => {
  if (videoPlaying) { stopVideo(); announce("Paused"); return; }
  dVideo.play().catch(() => {});
  setVideoPlaying(true);
  if (dVideo.readyState < 3) $("detail-status").textContent = "Loading video from NASA…";
  announce(`Playing video: ${panelItem.title}`);
});
dVideo.addEventListener("playing", () => { if (panelItem) $("detail-status").textContent = panelItem.videoHasSound ? "This one has NASA's own sound." : "The soundtrack is generated live from the video frames."; });
dVideo.addEventListener("waiting", () => { if (videoPlaying) $("detail-status").textContent = "Loading video from NASA…"; });
dVideo.addEventListener("ended", () => { stopVideo(); announce("Video finished"); });
dVideo.addEventListener("error", () => {
  if (!dVideo.getAttribute("src")) return;
  const m = $("detail-video-msg");
  m.textContent = "This video can't play in this browser. Use Replace this video below to swap in another copy.";
  m.hidden = false;
  setVideoPlaying(false);
  announce(m.textContent);
});

// Replace this video
$("replace-save").addEventListener("click", () => {
  const it = panelItem;
  const url = $("replace-url").value.trim();
  const file = $("replace-file").files[0];
  if (!url && !file) { announce("Paste a link or choose a file first."); $("replace-url").focus(); return; }
  if (file) sessionFiles[it.id] = URL.createObjectURL(file);
  else delete sessionFiles[it.id];
  saved[it.id] = saved[it.id] || {};
  if (url) saved[it.id].video = url; else delete saved[it.id].video;
  saveReplacements();
  loadVideo(it);
  announce(`New video set for ${it.title}`);
});
$("replace-reset").addEventListener("click", () => {
  const it = panelItem;
  delete sessionFiles[it.id];
  if (saved[it.id]) delete saved[it.id].video;
  saveReplacements();
  $("replace-url").value = "";
  $("replace-file").value = "";
  loadVideo(it);
  announce(`Restored NASA's video for ${it.title}`);
});

/* ---------- quiz ---------- */
const QUIZ = [
  { q: "In the lightning dataset, what does a sudden flash of lightning do to the soundtrack?",
    options: ["Nothing — the music carries on", "The music suddenly grows louder and denser for a moment", "It mutes the soundtrack for a second"], answer: 1,
    why: "A flash is a spike of bright colour on a dark globe. The engine's energy jumps, so the music swells in tempo and loudness, then relaxes." },
  { q: "In the night lights dataset, how do brighter cities affect the music?",
    options: ["Quieter", "Louder and denser", "Exactly the same as dark areas"], answer: 1,
    why: "Coloured light raises the engine's colour energy, which lifts the volume, tempo and groove density. Dark ocean falls back to a sparse drift." },
  { q: "How does the Sonificator choose the key of a soundtrack?",
    options: ["The colour and position of the first strong frame set it", "It is the same key for every video", "The location on the map sets it"], answer: 0,
    why: "The engine fingerprints the first strongly coloured frame: its hue and where the colour sits horizontally pick one of twelve keys and one of three chord progressions." },
];
function renderQuiz() {
  const form = $("quiz-form");
  const results = QUIZ.map(() => null);
  form.addEventListener("submit", (e) => e.preventDefault());
  QUIZ.forEach((item, qi) => {
    const fs = document.createElement("fieldset");
    const lg = document.createElement("legend");
    lg.textContent = `Question ${qi + 1} of ${QUIZ.length}: ${item.q}`;
    fs.appendChild(lg);
    item.options.forEach((opt, oi) => {
      const lab = document.createElement("label");
      lab.className = "choice";
      const r = document.createElement("input");
      r.type = "radio"; r.name = `q${qi}`; r.value = String(oi);
      lab.append(r, document.createTextNode(opt));
      fs.appendChild(lab);
    });
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-quiet";
    btn.textContent = "Check answer";
    btn.setAttribute("aria-label", `Check answer to question ${qi + 1}`);
    const fb = document.createElement("p");
    fb.className = "feedback";
    btn.addEventListener("click", () => {
      const picked = form.querySelector(`input[name="q${qi}"]:checked`);
      if (!picked) { fb.className = "feedback"; fb.textContent = "Choose an answer first."; announce(fb.textContent); return; }
      const ok = Number(picked.value) === item.answer;
      results[qi] = ok;
      fb.className = `feedback ${ok ? "correct" : "wrong"}`;
      fb.textContent = (ok ? "Correct. " : `Not quite. The answer is: ${item.options[item.answer]}. `) + item.why;
      const score = results.filter(Boolean).length;
      const done = results.every((x) => x !== null);
      $("quiz-score").textContent = `Score: ${score} of ${QUIZ.length}${done ? ". Quiz complete." : ""}`;
      announce(`Quiz answer ${ok ? "correct" : "incorrect"}. ${fb.textContent.replace(/^(Correct|Not quite)\. /, "")} Score ${score} of ${QUIZ.length}.`);
    });
    fs.append(btn, fb);
    form.appendChild(fs);
  });
}

/* ---------- start the page (before any 3D) ---------- */
renderLists();
renderQuiz();
renderChooser();
renderSpinBtn();
applySettings();

/* ---------- background: a glowing sound wave behind the planet ---------- */
// Thin vertical bars mirrored around a bright centre line, like an audio
// waveform. Teal and ocean blue to match the site, fading out at the tips.
const wave = $("wave-bg");
const wctx = wave.getContext("2d");
let wW = 0, wH = 0, bars = [], waveGrad = null, coreGrad = null;
function sizeWave() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  wW = wave.width = Math.round(wave.clientWidth * dpr);
  wH = wave.height = Math.round(wave.clientHeight * dpr);
  const gap = Math.max(4, Math.round(5 * dpr));
  bars = Array.from({ length: Math.ceil(wW / gap) + 1 }, (_, i) => ({ x: i * gap, j: Math.random(), jt: Math.random() }));
  const cy = wH * 0.5;
  waveGrad = wctx.createLinearGradient(0, cy - wH * 0.45, 0, cy + wH * 0.45);
  waveGrad.addColorStop(0, "rgba(40, 110, 190, 0)");
  waveGrad.addColorStop(0.3, "rgba(50, 140, 220, .35)");
  waveGrad.addColorStop(0.46, "rgba(110, 215, 225, .85)");
  waveGrad.addColorStop(0.5, "rgba(225, 250, 255, 1)");
  waveGrad.addColorStop(0.54, "rgba(110, 215, 225, .85)");
  waveGrad.addColorStop(0.7, "rgba(50, 140, 220, .35)");
  waveGrad.addColorStop(1, "rgba(40, 110, 190, 0)");
  coreGrad = wctx.createLinearGradient(0, 0, wW, 0);
  coreGrad.addColorStop(0, "rgba(126, 224, 212, 0)");
  coreGrad.addColorStop(0.5, "rgba(200, 245, 255, .9)");
  coreGrad.addColorStop(1, "rgba(126, 224, 212, 0)");
  drawWave(performance.now());
}
function drawWave(now) {
  if (!wW) return;
  const t = now / 1000;
  const cy = wH * 0.5;
  const barW = Math.max(2, Math.round(wW / 650));
  wctx.clearRect(0, 0, wW, wH);
  wctx.globalCompositeOperation = "lighter";
  wctx.fillStyle = waveGrad;
  
  // Live features from the engine (if loaded) drive the wave's energy.
  let pulseIntensity = 0;
  let pulseX = 0.5;
  if (sonificatorEngine) {
    try {
      pulseIntensity = sonificatorEngine.orange_pulse() || 0;
      pulseX = sonificatorEngine.pulse_x() || 0.5;
    } catch (e) { /* engine busy between callbacks */ }
  }

  // The analyser carries the engine's output; fall back to the idle motion.
  let audioData = null;
  if (audioCtx && analyzer && waveData) {
    try {
      analyzer.getByteTimeDomainData(waveData);
      audioData = waveData;
    } catch (e) { /* analyser not ready yet */ }
  }
  
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const x = b.x / wW;
    const env = 0.45 + 0.55 * Math.sin(Math.PI * x);              // a little calmer at the edges
    
    // Base waveform
    let s = Math.abs(0.55 * Math.sin(x * 9 + t * 1.1) + 0.3 * Math.sin(x * 23 - t * 1.7) + 0.25 * Math.sin(x * 51 + t * 2.6));

    // Boost based on the engine's pulse: overall intensity, plus a hotspot
    // centred where the orange emissions sit horizontally.
    const halo = Math.exp(-Math.pow((x - pulseX) * 4, 2));
    s = s + (pulseIntensity * 0.5) + (pulseIntensity * halo * 0.8);
    
    // Use audio data if available
    if (audioData) {
      const audioIndex = Math.min(audioData.length - 1, Math.floor((i / bars.length) * audioData.length));
      const audioValue = (audioData[audioIndex] - 128) / 128;
      s = s * 0.5 + Math.abs(audioValue) * 0.5;
      b.jt = Math.abs(audioValue) * 0.3 + 0.7;
    } else if (!still()) {
      b.j += (b.jt - b.j) * 0.1; 
      if (Math.random() < 0.04) {
        b.jt = pulseIntensity > 0.5 ? pulseIntensity + 0.3 : Math.pow(Math.random(), 0.8);
      }
    }
    
    const h = wH * 0.47 * env * (0.12 + 0.88 * s * (0.25 + 0.75 * b.j));
    wctx.globalAlpha = 0.5 + 0.5 * b.j;
    wctx.fillRect(b.x, cy - h, barW, h * 2);
  }
  // Soft glow and the bright core line
  wctx.globalAlpha = 0.5;
  wctx.fillStyle = coreGrad;
  wctx.fillRect(0, cy - wH * 0.012, wW, wH * 0.024);
  wctx.globalAlpha = 1;
  wctx.fillRect(0, cy - Math.max(1, wH * 0.0015), wW, Math.max(2, wH * 0.003));
  wctx.globalCompositeOperation = "source-over";
}
let waveLast = 0;
function waveLoop(now) {
  // About 30 frames a second is plenty for a background, and kinder to laptops.
  if (!still() && now - waveLast > 33) { drawWave(now); waveLast = now; }
  requestAnimationFrame(waveLoop);
}
new ResizeObserver(sizeWave).observe(wave);
requestAnimationFrame(waveLoop);

/* ---------- feeding the engine from video elements ---------- */
// Wired at page load: the play listeners must exist before the first play
// event, since initAudio() itself is started by one of them.
// Frames are pushed to sonificator while a video plays; the engine's output
// is drained continuously by the ScriptProcessor created in initAudio().
const captureCanvas = document.createElement("canvas");
const captureCtx = captureCanvas.getContext("2d", { willReadFrequently: true });
const CAP_W = 160, CAP_H = 90;   // engine only needs coarse features
let taintWarned = false;

function captureFrame(video) {
  if (!sonificatorEngine || !audioCtx || video.readyState < 2) return;
  try {
    captureCtx.drawImage(video, 0, 0, CAP_W, CAP_H);
    const px = captureCtx.getImageData(0, 0, CAP_W, CAP_H).data;
    sonificatorEngine.push_frame(new Uint8Array(px.buffer), CAP_W, CAP_H);
  } catch (e) {
    // Cross-origin videos without CORS taint the canvas: read the frame once,
    // and suggest the site's Replace-video option to the user.
    if (!taintWarned && /tainted|SecurityError|cross-origin/i.test(e.message)) {
      taintWarned = true;
      console.warn(
        "Sonificator cannot read frames of this video (cross-origin without CORS). " +
        "Use the Replace video button to pick a local copy, e.g. videos/co2.mp4."
      );
    }
  }
}

function startPumping(video) {
  console.log("Playback started:", video.currentSrc || video.src || "(set later)",
    "— sonificator:", sonificatorEngine ? "ready" : "still loading");
  Promise.resolve(initAudio()).then(() => {
    if (outGain && audioCtx) outGain.gain.setTargetAtTime(2.0, audioCtx.currentTime, 0.1);
  });
  if (video.requestVideoFrameCallback) {
    const step = () => {
      captureFrame(video);
      if (!video.paused && !video.ended) video._sf_rvfc = video.requestVideoFrameCallback(step);
    };
    video._sf_rvfc = video.requestVideoFrameCallback(step);
  } else {
    video._sf_timer = setInterval(() => captureFrame(video), 33);
  }
}

function stopPumping(video) {
  if (outGain && audioCtx) outGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.1);
}

function wireVideoProcessing() {
  const hook = (video) => {
    if (video._sf_wired) return;
    video._sf_wired = true;
    video.addEventListener("play", () => startPumping(video));
    video.addEventListener("pause", () => stopPumping(video));
    video.addEventListener("ended", () => stopPumping(video));
  };
  document.querySelectorAll("video").forEach(hook);
  // Videos show up in the DOM over time (e.g. the detail player).
  new MutationObserver(() => document.querySelectorAll("video").forEach(hook))
    .observe(document.documentElement, { childList: true, subtree: true });
}
wireVideoProcessing();

// Prime the AudioContext on the first interaction anywhere, so it is running
// by the time a video starts (creation inside a gesture satisfies autoplay
// policies; the engine output itself only flows while a video plays).
const primeAudio = () => { initAudio(); };
addEventListener("pointerdown", primeAudio, { once: true, capture: true });
addEventListener("keydown", primeAudio, { once: true, capture: true });

/* ---------- live sonificator readings under the video ---------- */
// The wasm engine's feature getters are read every 200 ms while the detail
// panel shows a dataset and turns them into the meter block under the video.
const STATS = {
  energy: { label: "Colour energy", el: ["stat-energy-fill", "stat-energy-meter", "stat-energy-val"] },
  x:      { label: "Horizontal focus", el: ["stat-x-fill", "stat-x-meter", "stat-x-val"] },
  y:      { label: "Vertical focus", el: ["stat-y-fill", "stat-y-meter", "stat-y-val"] },
  spread: { label: "Spread", el: ["stat-spread-fill", "stat-spread-meter", "stat-spread-val"] },
};
const pct = (v) => Math.round(v * 100);
function energyPhrase(v) {
  return v < 0.28 ? "quiet, sparse drift" : v < 0.65 ? "steady, flowing groove" : "loud, intense climax";
}
function xPhrase(v) { return v < 0.35 ? "left of centre" : v < 0.65 ? "near centre" : "right of centre"; }
function yPhrase(v) {
  return v >= 0.65 ? "low in the frame; melody lifted an octave"
       : v < 0.35 ? "high in the frame; base register"
       : "mid-frame; melody up a fifth";
}
function spreadPhrase(v) { return v < 0.25 ? "clustered" : v < 0.6 ? "partly spread" : "widely spread"; }

function setStat(name, v, phrase) {
  const s = STATS[name];
  const [fillId, meterId, valId] = s.el;
  const fill = document.getElementById(fillId);
  const meter = document.getElementById(meterId);
  const val = document.getElementById(valId);
  if (!fill || !meter || !val) return;
  fill.style.width = pct(v) + "%";
  meter.setAttribute("aria-valuenow", String(pct(v)));
  meter.setAttribute("aria-valuetext", `${pct(v)} percent of full, ${phrase}`);
  val.textContent = pct(v) + "%";
}

function updateDetailStats() {
  // Cheap repeated lookups are fine: the panel opens rarely.
  const box = $("detail-stats");
  const note = $("detail-stats-status");
  if (!box || !note) return;
  if (!detail.open || !panelItem || panelItem.kind !== "data") return;

  if (!sonificatorEngine) {
    if (!box.hidden) box.hidden = true;
    note.textContent = "The Sonificator engine isn't running in this browser, so there is no generated soundtrack or live meter. The text on this page still explains how it works.";
    return;
  }

  let f;
  try {
    f = {
      energy: sonificatorEngine.orange_pulse() ?? 0,
      x: sonificatorEngine.pulse_x() ?? 0.5,
      y: sonificatorEngine.pulse_y() ?? 0.5,
      spread: sonificatorEngine.pulse_dispersion() ?? 0,
    };
  } catch (e) { return; }
  box.hidden = false;

  setStat("energy", f.energy, energyPhrase(f.energy));
  setStat("x", f.x, xPhrase(f.x));
  setStat("y", f.y, yPhrase(f.y));
  setStat("spread", f.spread, spreadPhrase(f.spread));

  // With no readable frames (cross-origin video), the features sit at zero.
  if (videoPlaying && f.energy < 0.002 && f.spread < 0.002) {
    note.textContent = "The engine can't read this video's pixels, most likely because it is served from another site. Use Replace this video to load a local copy and the soundtrack will start.";
  } else if (!videoPlaying) {
    note.textContent = "Paused: the readings hold their last values until the video plays again.";
  } else {
    note.textContent = "Live readings, sampled every few ticks. Energy drives tempo and loudness; focus sets pan and pitch register; spread sets arpeggio density.";
  }
}
setInterval(updateDetailStats, 200);

/* ---------- 3D ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $("globe-canvas"), antialias: true, alpha: true });
} catch (e) {
  $("globe-fallback").hidden = false;
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
let baseDist = 5;
const cam = { x: 0, y: -0.16, z: baseDist };

scene.add(new THREE.AmbientLight(0xb8c8d8, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(-4, 2, 5);
scene.add(sun);

const globe = new THREE.Group();
scene.add(globe);
const ringPivot = new THREE.Group();     // the orbit: turns with the globe, tilted towards you
scene.add(ringPivot);

const loader = new THREE.TextureLoader();
const earthMat = new THREE.MeshPhongMaterial({ color: 0x2c5a78, specular: 0x333333, shininess: 14 });
const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), earthMat);
globe.add(earth);
loader.load(TEX + "earth_atmos_2048.jpg", (t) => { t.colorSpace = THREE.SRGBColorSpace; earthMat.map = t; earthMat.color.set(0xffffff); earthMat.needsUpdate = true; });
loader.load(TEX + "earth_normal_2048.jpg", (t) => { earthMat.normalMap = t; earthMat.normalScale.set(0.6, 0.6); earthMat.needsUpdate = true; });
loader.load(TEX + "earth_specular_2048.jpg", (t) => { earthMat.specularMap = t; earthMat.needsUpdate = true; });

const cloudMat = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.32, depthWrite: false });
const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 64), cloudMat);
clouds.visible = false;
globe.add(clouds);
loader.load(TEX + "earth_clouds_1024.png", (t) => { t.colorSpace = THREE.SRGBColorSpace; cloudMat.map = t; cloudMat.needsUpdate = true; clouds.visible = true; });

scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.14, 64, 64),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.35,0.65,1.0,1.0) * i; }`,
  })
));

{ // stars
  const n = 1400, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 20);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.7 })));
}

{ // the orbit line
  const pts = [];
  for (let a = 0; a <= 128; a++) { const t = (a / 128) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * RING_R, 0, -Math.sin(t) * RING_R)); }
  ringPivot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x7ea6c2, transparent: true, opacity: 0.28 })));
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = glowTexture();

// Latitude/longitude to a point (matches the Earth texture layout).
function latLon(lat, lon, r) {
  const a = lat * DEG, b = lon * DEG;
  return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r);
}

const labelsEl = $("globe-labels");
const hitTargets = [];
const markers = all.map((it) => {
  const group = new THREE.Group();
  const color = new THREE.Color(it.color);
  const moon = it.ring;
  const body = moon
    ? new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 32), new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.45, shininess: 30 }))
    : new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), new THREE.MeshBasicMaterial({ color }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const baseHalo = moon ? 0.34 : 0.16;
  halo.scale.setScalar(baseHalo);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(moon ? 0.15 : 0.08, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.index = it.index;
  hitTargets.push(hit);
  group.add(body, halo, hit);

  if (moon) {
    group.position.copy(latLon(0, it.angle, RING_R));
    ringPivot.add(group);
  } else {
    group.position.copy(latLon(it.lat, it.lon, 1.03));
    globe.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([latLon(it.lat, it.lon, 1.0), latLon(it.lat, it.lon, 1.03)]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })
    ));
    globe.add(group);
  }

  // Name tags: always on for moons that face you; datasets only when chosen.
  const tag = document.createElement("div");
  tag.className = "globe-label" + (moon ? " globe-label--moon" : "");
  tag.textContent = it.title;
  tag.style.setProperty("--label-color", it.color);
  labelsEl.appendChild(tag);
  return { it, group, halo, baseHalo, tag };
});

/* ---------- size ---------- */
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Keep the planet and its orbit on screen, however narrow.
  const t = Math.tan(17.5 * DEG);
  baseDist = Math.max(1.95 / t, 1.85 / (t * camera.aspect));
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap);
resize();
cam.z = baseDist;

/* ---------- pointer: drag to spin, click to open ---------- */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let down = null, last = null;

function pick(e) {
  const r = wrap.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const earthHit = ray.intersectObject(earth, false)[0];
  for (const h of ray.intersectObjects(hitTargets, false)) {
    if (!earthHit || earthHit.distance > h.distance) return h.object.userData.index;
  }
  return -1;
}

wrap.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  down = { x: e.clientX, y: e.clientY };
  last = { x: e.clientX, y: e.clientY, t: performance.now() };
  dragging = false;
  wrap.setPointerCapture(e.pointerId);
});
wrap.addEventListener("pointermove", (e) => {
  if (!down) { wrap.classList.toggle("is-over-point", pick(e) >= 0); return; }
  const dx = e.clientX - last.x, dy = e.clientY - last.y;
  if (!dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
    dragging = true;
    wrap.classList.add("is-dragging");
    targetYaw = targetPitch = null;
  }
  if (dragging) {
    const k = 3.2 / wrap.clientWidth;
    yaw += dx * k * 1.6;
    pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * k));
    const now = performance.now();
    yawVel = (dx * k * 1.6) / Math.max(0.008, (now - last.t) / 1000);
    resumeAt = now + RESUME_AFTER;
  }
  last = { x: e.clientX, y: e.clientY, t: performance.now() };
});
wrap.addEventListener("pointerup", (e) => {
  if (!down) return;
  if (!dragging) {
    const i = pick(e);
    if (i >= 0) { select(i, false); open(i, wrap); }
  } else {
    announce(`Facing ${all[focused].title}`);
  }
  down = null;
  dragging = false;
  wrap.classList.remove("is-dragging");
});
wrap.addEventListener("pointercancel", () => { down = null; dragging = false; wrap.classList.remove("is-dragging"); });

/* ---------- each frame ---------- */
const camDir = new THREE.Vector3();
const tmp = new THREE.Vector3();
const scr = new THREE.Vector3();
let lastT = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const spinning = !userPaused && !exploring && now > resumeAt;

  if (targetYaw !== null && !dragging) {
    const k = still() ? 1 : Math.min(1, dt * 3.5);
    yaw += (targetYaw - yaw) * k;
    pitch += (targetPitch - pitch) * k;
    if (Math.abs(targetYaw - yaw) < 0.002 && Math.abs(targetPitch - pitch) < 0.002) targetYaw = targetPitch = null;
  } else if (!dragging) {
    yawVel *= Math.pow(0.04, dt);
    yaw += yawVel * dt;
    if (spinning) {
      yaw += SPIN_SPEED * dt;
      pitch += (0.32 - pitch) * Math.min(1, dt * 0.5);
    }
  }
  globe.rotation.set(pitch, yaw, 0);
  ringPivot.rotation.set(RING_TILT, yaw, 0);
  clouds.rotation.y += dt * 0.012;

  // Camera: pull in when something is open, and keep it clear of the panel.
  const wide = wrap.clientWidth > 900;
  const it = all[focused];
  // With the wide panel open, fit the planet (or its orbit) into the space left of it.
  const tanF = Math.tan(17.5 * DEG);
  const panelShare = exploring && wide ? Math.min(0.7, detail.clientWidth / wrap.clientWidth) : 0;
  const fitR = it.ring ? 1.85 : 1.15;
  const wantZ = exploring ? Math.max(it.ring ? 4.2 : 3.0, fitR / ((1 - panelShare) * tanF * camera.aspect)) : baseDist;
  const wantX = exploring ? panelShare * wantZ * tanF * camera.aspect : (wrap.clientWidth > 1100 ? -0.5 : 0);
  const wantY = exploring ? (it.ring ? -RING_R * Math.sin(RING_TILT) : 0) : -0.12;
  const ck = still() ? 1 : Math.min(1, dt * 3);
  cam.z += (wantZ - cam.z) * ck;
  cam.x += (wantX - cam.x) * ck;
  cam.y += (wantY - cam.y) * ck;
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.x, cam.y, 0);

  // Whatever faces you becomes the choice: a dataset or a moon.
  camDir.set(0, 0, 1);
  if (dragging || (targetYaw === null && !exploring && spinning)) {
    let best = -1, bestDot = -2;
    markers.forEach((m) => {
      m.group.getWorldPosition(tmp);
      const d = tmp.normalize().dot(camDir);
      if (d > bestDot) { bestDot = d; best = m.it.index; }
    });
    if (best >= 0 && best !== focused) {
      focused = best;
      renderChooser();
      if (settings.announceSpin && !dragging) announce(`Now facing ${all[best].title}`);
    }
  }

  const pulse = still() ? 1 : 1 + Math.sin(now / 320) * 0.18;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  markers.forEach((m) => {
    const on = m.it.index === focused;
    m.halo.scale.setScalar(on ? m.baseHalo * 1.9 * pulse : m.baseHalo);
    m.halo.material.opacity = on ? 1 : 0.75;

    // Name tags. Hidden when behind the planet or while a panel is open.
    m.group.getWorldPosition(tmp);
    const front = m.it.ring ? tmp.z > -0.35 : tmp.clone().normalize().z > 0.2;
    const show = !exploring && front && ((m.it.ring && W > 640) || on);
    if (show) {
      scr.copy(tmp).project(camera);
      const half = m.tag.offsetWidth / 2 + 8;      // keep the whole name on screen
      const x = Math.max(half, Math.min(W - half, (scr.x * 0.5 + 0.5) * W));
      m.tag.style.left = `${x}px`;
      m.tag.style.top = `${(-scr.y * 0.5 + 0.5) * H}px`;
    }
    m.tag.classList.toggle("is-on", show);
    m.tag.classList.toggle("is-focus", on);
  });

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.body.dataset.globeReady = "1";
