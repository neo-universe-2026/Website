/* Earth Information Jukebox: player, track list, replace dialog, keyboard
   shortcuts, screen-reader announcements and the listening quiz.
   Plain script (no modules) so the page also works when opened as a file. */
(function () {
  "use strict";

  var TRACKS = window.JUKEBOX_TRACKS || [];
  var PLACEHOLDER = window.JUKEBOX_PLACEHOLDER_SOUNDTRACK || "";
  var STORE_KEY = "earth-jukebox-replacements-v1";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (id) { return document.getElementById(id); };
  var video = $("video");
  var audio = $("soundtrack");
  var screenEl = $("screen");
  var stageEl = document.querySelector(".stage");
  var playBtn = $("play-button");
  var playText = $("play-text");
  var seek = $("seek");
  var volume = $("volume");
  var announcer = $("announcer");
  var dialog = $("replace-dialog");

  var index = 0;
  var playing = false;
  var muted = false;
  var videoFailed = false;
  var current = null;            // resolved track currently loaded
  var sessionFiles = {};         // track id -> { video, soundtrack } object URLs (until reload)
  var replacements = loadReplacements(); // track id -> { video, soundtrack } links (saved)

  /* ---------------- storage (wrapped: private windows can block it) ---------------- */
  function loadReplacements() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveReplacements() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(replacements)); } catch (e) { /* not saved */ }
  }

  /* ---------------- announcements ---------------- */
  var announceTimer = null;
  function announce(msg) {
    clearTimeout(announceTimer);
    announcer.textContent = "";
    // A short gap makes screen readers read the same message twice in a row.
    announceTimer = setTimeout(function () { announcer.textContent = msg; }, 60);
  }

  /* ---------------- time helpers ---------------- */
  function clock(s) {
    if (!isFinite(s)) s = 0;
    s = Math.floor(s);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  function spoken(s) {
    if (!isFinite(s)) s = 0;
    s = Math.floor(s);
    var m = Math.floor(s / 60), r = s % 60, parts = [];
    if (m) parts.push(m + (m === 1 ? " minute" : " minutes"));
    if (r || !m) parts.push(r + (r === 1 ? " second" : " seconds"));
    return parts.join(" ");
  }

  /* ---------------- track resolution ---------------- */
  function resolve(i) {
    var t = TRACKS[i];
    var saved = replacements[t.id] || {};
    var files = sessionFiles[t.id] || {};
    var r = Object.assign({}, t);
    r.video = files.video || saved.video || t.video;
    r.soundtrack = files.soundtrack || saved.soundtrack || t.soundtrack;
    r.videoReplaced = !!(files.video || saved.video);
    r.soundReplaced = !!(files.soundtrack || saved.soundtrack);
    // A video's own sound is used only if no separate soundtrack has been given.
    r.useVideoSound = !!t.videoHasSound && !r.soundtrack;
    r.audioSrc = r.useVideoSound ? "" : (r.soundtrack || PLACEHOLDER);
    r.placeholder = !r.useVideoSound && !r.soundtrack;
    return r;
  }

  function soundLabel(t) {
    if (t.useVideoSound) return "Original sound from the video";
    if (t.placeholder) return "Placeholder soundtrack (demo, not made from this video yet)";
    return t.soundReplaced ? "Your soundtrack" : "Generated soundtrack";
  }

  /* ---------------- the horizon: soundtrack drawn along the bottom of the video ---------------- */
  var canvas = $("horizon");
  var ctx = canvas.getContext("2d");
  var audioCtx = null, analyser = null, routed = null, samples = null, rafId = 0;

  function sameOrigin(src) {
    if (location.protocol === "file:" || !src || src.indexOf("blob:") === 0) return src.indexOf("blob:") === 0;
    try { return new URL(src, location.href).origin === location.origin; } catch (e) { return false; }
  }

  // Swap in a fresh <audio> element: once an element is routed through Web Audio
  // it stays routed, and a cross-origin file routed that way would play silence.
  function freshAudioElement() {
    var el = document.createElement("audio");
    el.id = "soundtrack";
    el.preload = "metadata";
    audio.replaceWith(el);
    audio = el;
    bindMediaEvents(audio);
  }

  function connectAnalyser() {
    if (!current || !current.audioSrc || !sameOrigin(current.audioSrc) || routed === audio) return;
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        samples = new Uint8Array(analyser.fftSize);
        analyser.connect(audioCtx.destination);
      }
      audioCtx.createMediaElementSource(audio).connect(analyser);
      routed = audio;
    } catch (e) { /* visual only: carry on without it */ }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    drawHorizon();
  }

  function drawHorizon() {
    var w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    var base = h * 0.72;
    var live = playing && analyser && routed === audio;
    if (live) analyser.getByteTimeDomainData(samples);
    ctx.lineWidth = Math.max(2, h / 60);
    ctx.strokeStyle = "#f4a340";
    ctx.shadowColor = "rgba(244, 163, 64, .8)";
    ctx.shadowBlur = h / 12;
    ctx.beginPath();
    var steps = 160;
    for (var s = 0; s <= steps; s++) {
      var x = (s / steps) * w;
      var y = base;
      if (live) {
        var v = samples[Math.floor((s / steps) * (samples.length - 1))];
        y = base + ((v - 128) / 128) * h * 0.55;
      }
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function loop() {
    drawHorizon();
    rafId = playing && !REDUCED ? requestAnimationFrame(loop) : 0;
  }

  /* ---------------- playback ---------------- */
  function usesAudio() { return !!(current && current.audioSrc); }
  function master() { return videoFailed && usesAudio() ? audio : video; }

  function load(i, autoplay) {
    stopMedia();
    index = (i + TRACKS.length) % TRACKS.length;
    current = resolve(index);
    videoFailed = false;
    $("screen-msg").hidden = true;

    // Clear the old soundtrack before switching, so it never plays under the new video.
    if (routed === audio && current.audioSrc && !sameOrigin(current.audioSrc)) freshAudioElement();

    video.poster = current.poster || "";
    video.src = current.video;
    video.muted = !current.useVideoSound || muted;
    video.loop = false;

    if (current.audioSrc) {
      audio.src = current.audioSrc;
      audio.loop = current.placeholder;
    } else {
      audio.removeAttribute("src");
    }
    audio.load();
    applyVolume();

    var n = TRACKS.length;
    $("track-position").textContent = "Track " + (index + 1) + " of " + n;
    $("now-title").textContent = current.title;
    $("desc-text").textContent = current.description || "";
    $("listen-text").textContent = current.listenFor || "";
    var note = $("desc-note");
    note.textContent = current.videoReplaced ? "You replaced this video, so the description above may not match it." : (current.note || "");
    note.hidden = !note.textContent;
    var src = $("source-link");
    src.href = current.source || "#";
    src.hidden = !current.source;
    $("sound-source").textContent = soundLabel(current);
    screenEl.setAttribute("aria-label", "Video: " + current.title + ". Arrow keys seek and change volume.");
    updateSeek();
    renderTrackStates();
    updatePlayUI();

    if (autoplay) {
      play(true);
      announce("Track " + (index + 1) + " of " + n + " now playing: " + current.title);
    }
  }

  function stopMedia() {
    video.pause();
    audio.pause();
    playing = false;
    if (window.speechSynthesis) speechSynthesis.cancel();
    setSpeakLabel(false);
  }

  function play(quiet) {
    if (!current) return;
    connectAnalyser();
    if (!videoFailed) {
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* the error event explains */ });
    }
    if (usesAudio()) {
      syncAudio(true);
      var a = audio.play();
      if (a && a.catch) a.catch(function () {});
    }
    playing = true;
    updatePlayUI();
    if (!rafId) loop();
    if (!quiet) announce("Playing: " + current.title);
  }

  function pause(quiet) {
    video.pause();
    audio.pause();
    playing = false;
    updatePlayUI();
    drawHorizon();
    if (!quiet) announce("Paused");
  }

  function toggle() { if (playing) pause(); else play(); }

  // Keep the soundtrack lined up with the video. The placeholder loops,
  // so its position is the video time wrapped around its length.
  function syncAudio(force) {
    if (!usesAudio() || master() === audio) return;
    var d = audio.duration;
    if (!isFinite(d) || d <= 0) return;
    var want = current.placeholder ? video.currentTime % d : Math.min(video.currentTime, d);
    if (force || Math.abs(audio.currentTime - want) > 0.35) {
      try { audio.currentTime = want; } catch (e) {}
    }
  }

  function updatePlayUI() {
    var title = current ? current.title : "";
    stageEl.classList.toggle("is-playing", playing);
    playText.textContent = playing ? "Pause" : "Play";
    playBtn.setAttribute("aria-label", (playing ? "Pause, " : "Play, ") + title);
  }

  function updateSeek() {
    var m = master();
    var d = isFinite(m.duration) ? m.duration : 0;
    var t = m.currentTime || 0;
    seek.max = d ? d.toFixed(1) : 100;
    if (document.activeElement !== seek || !seek.dataset.dragging) seek.value = t.toFixed(1);
    seek.setAttribute("aria-valuetext", spoken(t) + " of " + spoken(d));
    $("time-out").textContent = clock(t) + " / " + clock(d);
  }

  function seekTo(t) {
    var m = master();
    if (!isFinite(m.duration)) return;
    m.currentTime = Math.max(0, Math.min(t, m.duration - 0.05));
    syncAudio(true);
    updateSeek();
  }

  var seekAnnounce = null;
  function seekBy(delta) {
    seekTo((master().currentTime || 0) + delta);
    clearTimeout(seekAnnounce);
    seekAnnounce = setTimeout(function () { announce("At " + spoken(master().currentTime)); }, 450);
  }

  function applyVolume() {
    var v = Number(volume.value) / 100;
    video.volume = v;
    audio.volume = v;
    video.muted = !(current && current.useVideoSound) || muted;
    audio.muted = muted;
    $("volume-out").textContent = volume.value + "%";
    volume.setAttribute("aria-valuetext", muted ? "Muted, " + volume.value + " percent" : volume.value + " percent");
  }

  function volumeBy(delta) {
    volume.value = Math.max(0, Math.min(100, Number(volume.value) + delta));
    if (muted && delta > 0) muted = false;
    applyVolume();
    announce("Volume " + volume.value + " percent");
  }

  function toggleMute() {
    muted = !muted;
    applyVolume();
    announce(muted ? "Muted" : "Sound on");
  }

  function next() { load(index + 1, true); }
  function prev() {
    if ((master().currentTime || 0) > 5) { seekTo(0); announce("Back to the start of " + current.title); return; }
    load(index - 1, true);
  }

  /* ---------------- media events ---------------- */
  function bindMediaEvents(el) {
    el.addEventListener("timeupdate", function () {
      if (el === master()) updateSeek();
      if (el === video && playing) syncAudio(false);
    });
    el.addEventListener("loadedmetadata", function () { if (el === master()) updateSeek(); syncAudio(true); });
    el.addEventListener("ended", function () {
      if (el === master() && playing) next();
    });
    el.addEventListener("error", function () {
      if (el !== audio || !current || !current.audioSrc) return;
      $("sound-source").textContent = "Soundtrack could not be loaded";
    });
  }
  bindMediaEvents(video);
  bindMediaEvents(audio);

  // While the video buffers, hold the soundtrack so they stay together.
  video.addEventListener("waiting", function () { if (playing && usesAudio() && !videoFailed) audio.pause(); });
  video.addEventListener("playing", function () {
    if (playing && usesAudio()) { syncAudio(true); audio.play().catch(function () {}); }
  });

  video.addEventListener("error", function () {
    if (!video.getAttribute("src")) return;
    videoFailed = true;
    var msg = "This video can't play in this browser. " +
      (usesAudio() ? "The soundtrack still plays. " : "") +
      "Use Replace in the track list to swap in another copy.";
    var box = $("screen-msg");
    box.textContent = msg;
    box.hidden = false;
    announce(msg);
    updateSeek();
  });

  /* ---------------- controls ---------------- */
  playBtn.addEventListener("click", function () { toggle(); });
  $("next-button").addEventListener("click", next);
  $("prev-button").addEventListener("click", prev);
  seek.addEventListener("pointerdown", function () { seek.dataset.dragging = "1"; });
  seek.addEventListener("pointerup", function () { delete seek.dataset.dragging; });
  seek.addEventListener("input", function () { seekTo(Number(seek.value)); });
  volume.addEventListener("input", function () { if (muted) muted = false; applyVolume(); });
  screenEl.addEventListener("click", function () { toggle(); });

  /* Keyboard shortcuts. Typing in a field, or a button's own Space, always wins. */
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || dialog.open) return;
    var t = e.target, tag = t.tagName;
    var isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
    var isControl = tag === "BUTTON" || tag === "A" || tag === "SUMMARY" || isInput;
    var inScreen = screenEl.contains(t);
    var key = e.key;

    if (key === " " || key === "Spacebar") {
      if (isControl) return;
      e.preventDefault(); toggle(); return;
    }
    if (isInput) return;
    if (key === "ArrowLeft" || key === "ArrowRight") {
      if (!inScreen) return;
      e.preventDefault(); seekBy((key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 30 : 5)); return;
    }
    if (key === "ArrowUp" || key === "ArrowDown") {
      if (!inScreen) return;
      e.preventDefault(); volumeBy(key === "ArrowUp" ? 10 : -10); return;
    }
    switch (key.toLowerCase()) {
      case "k": e.preventDefault(); toggle(); break;
      case "n": e.preventDefault(); next(); break;
      case "p": e.preventDefault(); prev(); break;
      case "m": e.preventDefault(); toggleMute(); break;
      case "d": e.preventDefault(); $("description").focus(); break;
    }
  });

  /* ---------------- read description aloud ---------------- */
  var speakBtn = $("speak-button");
  function setSpeakLabel(on) { speakBtn.textContent = on ? "Stop reading" : "Read description aloud"; }
  if (!("speechSynthesis" in window)) speakBtn.hidden = true;
  speakBtn.addEventListener("click", function () {
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); setSpeakLabel(false); return; }
    var u = new SpeechSynthesisUtterance(current.title + ". " + current.description + " What to listen for: " + current.listenFor);
    u.onend = u.onerror = function () { setSpeakLabel(false); };
    speechSynthesis.speak(u);
    setSpeakLabel(true);
  });

  /* ---------------- track list ---------------- */
  var list = $("track-list");
  function renderTrackList() {
    list.innerHTML = "";
    TRACKS.forEach(function (t, i) {
      var li = document.createElement("li");
      li.className = "track";
      li.innerHTML =
        '<div class="track-main">' +
          '<button type="button" class="track-play"></button>' +
          '<p class="track-meta"></p>' +
        '</div>' +
        '<div class="track-actions">' +
          '<button type="button" class="btn btn-quiet track-replace">Replace<span class="visually-hidden"></span></button>' +
          '<a class="track-source" target="_blank" rel="noopener">Source<span class="visually-hidden"></span></a>' +
        '</div>';
      var playEl = li.querySelector(".track-play");
      playEl.textContent = t.title;
      playEl.setAttribute("aria-label", "Play, " + t.title);
      playEl.addEventListener("click", function () { load(i, true); });
      var rep = li.querySelector(".track-replace");
      rep.querySelector("span").textContent = " video or soundtrack for " + t.title;
      rep.addEventListener("click", function () { openReplace(i, rep); });
      var srcA = li.querySelector(".track-source");
      srcA.href = t.source || "#";
      srcA.querySelector("span").textContent = ": NASA page for " + t.title + " (opens in a new tab)";
      list.appendChild(li);
    });
    renderTrackStates();
  }

  function renderTrackStates() {
    Array.prototype.forEach.call(list.children, function (li, i) {
      var r = resolve(i);
      if (i === index) li.setAttribute("aria-current", "true"); else li.removeAttribute("aria-current");
      var meta = li.querySelector(".track-meta");
      meta.textContent = soundLabel(r) + ".";
      if (r.videoReplaced || r.soundReplaced) {
        var s = document.createElement("span");
        s.className = "replaced";
        s.textContent = " Replaced by you.";
        meta.appendChild(s);
      }
    });
  }

  /* ---------------- replace dialog ---------------- */
  var replacing = -1, replaceOpener = null;
  function openReplace(i, opener) {
    replacing = i;
    replaceOpener = opener;
    var t = TRACKS[i];
    var saved = replacements[t.id] || {};
    $("replace-title").textContent = "Replace media for " + t.title;
    $("replace-video-url").value = saved.video || "";
    $("replace-audio-url").value = saved.soundtrack || "";
    $("replace-video-file").value = "";
    $("replace-audio-file").value = "";
    dialog.showModal();
  }

  // Handle the buttons on submit (the dialog's close event is not reliable everywhere).
  $("replace-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var action = e.submitter ? e.submitter.value : "save";
    dialog.close();
    finishReplace(action);
  });
  // Escape key: treat as Cancel and return focus.
  dialog.addEventListener("cancel", function (e) {
    e.preventDefault();
    dialog.close();
    finishReplace("cancel");
  });

  function finishReplace(action) {
    var i = replacing;
    replacing = -1;
    if (i < 0) return;
    var t = TRACKS[i];
    if (action === "save") {
      var saved = replacements[t.id] || {};
      var files = sessionFiles[t.id] || {};
      var vUrl = $("replace-video-url").value.trim();
      var aUrl = $("replace-audio-url").value.trim();
      var vFile = $("replace-video-file").files[0];
      var aFile = $("replace-audio-file").files[0];
      if (vUrl) saved.video = vUrl; else delete saved.video;
      if (aUrl) saved.soundtrack = aUrl; else delete saved.soundtrack;
      if (vFile) files.video = URL.createObjectURL(vFile);
      if (aFile) files.soundtrack = URL.createObjectURL(aFile);
      replacements[t.id] = saved;
      sessionFiles[t.id] = files;
      saveReplacements();
      announce("Saved changes for " + t.title);
    } else if (action === "reset") {
      delete replacements[t.id];
      delete sessionFiles[t.id];
      saveReplacements();
      announce("Restored the original media for " + t.title);
    } else {
      if (replaceOpener) replaceOpener.focus();
      return;
    }
    renderTrackStates();
    if (i === index) load(index, false);
    if (replaceOpener) replaceOpener.focus();
  }

  /* ---------------- quiz ---------------- */
  var QUIZ = [
    {
      q: "In the lightning track, what does a sudden flash of lightning do to the soundtrack?",
      options: ["Nothing, the music carries on", "The music suddenly grows louder and denser for a moment", "It mutes the soundtrack for a second"],
      answer: 1,
      why: "A flash is a spike of bright colour on a dark globe. The engine's energy jumps, so the music swells in tempo and loudness, then relaxes."
    },
    {
      q: "In the night lights track, how do brighter cities affect the music?",
      options: ["Quieter", "Louder and denser", "Exactly the same as dark areas"],
      answer: 1,
      why: "Coloured light raises the engine's colour energy, which lifts the volume, tempo and groove density. Dark ocean falls back to a sparse drift."
    },
    {
      q: "How does the Sonificator choose the key of a soundtrack?",
      options: ["The colour and position of the first strong frame set it", "It is the same key for every video", "The location on the map sets it"],
      answer: 0,
      why: "The engine fingerprints the first strongly coloured frame: its hue and where the colour sits horizontally pick one of twelve keys and one of three chord progressions."
    }
  ];
  var quizResults = QUIZ.map(function () { return null; });

  function renderQuiz() {
    var form = $("quiz-form");
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    QUIZ.forEach(function (item, qi) {
      var fs = document.createElement("fieldset");
      var lg = document.createElement("legend");
      lg.textContent = "Question " + (qi + 1) + " of " + QUIZ.length + ": " + item.q;
      fs.appendChild(lg);
      item.options.forEach(function (opt, oi) {
        var lab = document.createElement("label");
        lab.className = "choice";
        var r = document.createElement("input");
        r.type = "radio";
        r.name = "q" + qi;
        r.value = String(oi);
        lab.appendChild(r);
        lab.appendChild(document.createTextNode(opt));
        fs.appendChild(lab);
      });
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-quiet";
      btn.textContent = "Check answer";
      btn.setAttribute("aria-label", "Check answer to question " + (qi + 1));
      var fb = document.createElement("p");
      fb.className = "feedback";
      fb.id = "feedback-" + qi;
      fs.setAttribute("aria-describedby", fb.id);
      btn.addEventListener("click", function () {
        var picked = form.querySelector('input[name="q' + qi + '"]:checked');
        if (!picked) {
          fb.textContent = "Choose an answer first.";
          fb.className = "feedback";
          announce("Choose an answer first.");
          return;
        }
        var ok = Number(picked.value) === item.answer;
        quizResults[qi] = ok;
        fb.className = "feedback " + (ok ? "correct" : "wrong");
        fb.textContent = (ok ? "Correct. " : "Not quite. The answer is: " + item.options[item.answer] + ". ") + item.why;
        var score = quizResults.filter(Boolean).length;
        var answered = quizResults.filter(function (x) { return x !== null; }).length;
        $("quiz-score").textContent = "Score: " + score + " of " + QUIZ.length + (answered === QUIZ.length ? ". Quiz complete." : "");
        announce("Quiz answer " + (ok ? "correct. " : "incorrect. ") + fb.textContent.replace(/^(Correct|Not quite)\. /, "") + " Score " + score + " of " + QUIZ.length + ".");
      });
      fs.appendChild(btn);
      fs.appendChild(fb);
      form.appendChild(fs);
    });
  }

  /* ---------------- start ---------------- */
  if (!TRACKS.length) {
    $("now-title").textContent = "No tracks yet. Add some in tracks.js.";
    return;
  }
  renderTrackList();
  renderQuiz();
  // Links like index.html#track-lightning (from the 3D globe) open that track.
  var fromHash = location.hash.indexOf("#track-") === 0 ?
    TRACKS.findIndex(function (t) { return "#track-" + t.id === location.hash; }) : -1;
  load(fromHash >= 0 ? fromHash : 0, false);
  if (fromHash >= 0) {
    document.getElementById("player").scrollIntoView();
    playBtn.focus();
  }
  if ("ResizeObserver" in window) new ResizeObserver(sizeCanvas).observe(canvas);
  else window.addEventListener("resize", sizeCanvas);
  sizeCanvas();
})();
