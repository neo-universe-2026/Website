/* Overlay video controls shared by player.html and the globe's detail panel.
   Plain script (no modules) so it works everywhere, like app.js/tracks.js.

   This only wires the on-video progress bar and time readout. Play/pause is
   left to each page (the player page drives a video + soundtrack pair, the
   globe panel drives one video), via the onSeek callback and CSS .is-playing
   classes. Screen-reader announcements stay with each page's announcer. */
(function () {
  "use strict";

  function clock(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  /*
    opts:
      range   input[type=range] acting as the progress bar (required)
      timeEl  element that shows "0:12 / 1:30" (optional)
      video   the video element, used by the default seek handler (optional)
      onSeek  function(seconds) when the user moves the bar (optional)
  */
  window.overlayPlayer = function (opts) {
    var range = opts.range;
    if (!range) return { sync: function () {} };
    var dragging = false;

    function sync(t, d) {
      if (!dragging) {
        range.max = d ? Number(d).toFixed(1) : "100";
        range.value = Number(t || 0).toFixed(1);
      }
      var pct = d ? Math.min(100, (Number(t) / Number(d)) * 100) : 0;
      range.style.setProperty("--vp-fill", pct.toFixed(1) + "%");
      range.setAttribute("aria-valuetext", clock(t) + " of " + clock(d));
      if (opts.timeEl) opts.timeEl.textContent = clock(t) + " / " + clock(d);
    }

    range.addEventListener("pointerdown", function () { dragging = true; });
    window.addEventListener("pointerup", function () { dragging = false; });
    window.addEventListener("pointercancel", function () { dragging = false; });
    range.addEventListener("input", function () {
      var t = Number(range.value);
      if (opts.onSeek) opts.onSeek(t);
      else if (opts.video && isFinite(opts.video.duration)) opts.video.currentTime = Math.min(t, opts.video.duration - 0.05);
    });

    // The bar sits above the video: keep its interactions from bubbling
    // into click-to-toggle handling on the video area.
    ["click", "pointerdown", "pointerup", "keydown"].forEach(function (type) {
      range.addEventListener(type, function (e) { e.stopPropagation(); });
    });

    return { sync: sync };
  };
})();
