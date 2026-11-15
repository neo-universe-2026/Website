#!/usr/bin/env bash
# Download NASA's original dataset videos and transcode sonifiable H.264
# copies into videos/<track>.mp4.
#
# Why: the Sonificator engine must read the pixels of the video it
# sonifies, and browsers only allow that for videos served from this
# site's own origin. NASA's servers don't send CORS headers for us, so
# each video is fetched once and transcoded to a local copy (H.264,
# max width 1280, no audio — the soundtrack is generated live).
#
# Usage:
#   scripts/fetch-videos.sh [--force]
#
# Environment:
#   FETCH_VIDEOS_SKIP   comma/space-separated track ids to skip
#   FETCH_VIDEOS_ONLY   inverse: fetch only these track ids
#
# Sources are cached under .cache/svs-src (git-ignored) so interrupted
# downloads resume and CI can cache them. Run inside the Nix shell
# (`nix develop`) or make sure curl and ffmpeg are on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

CACHE=".cache/svs-src"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

fetch() { # <track-id> <source-url>
  local id="$1"
  local url="$2"
  local out="videos/$id.mp4"
  local cached="$CACHE/$id-origin"

  case ",${FETCH_VIDEOS_SKIP:-}," in
    *",$id,"*) echo "== skipping $id (FETCH_VIDEOS_SKIP)"; return 0 ;;
  esac
  if [[ -n "${FETCH_VIDEOS_ONLY:-}" ]]; then
    case ",${FETCH_VIDEOS_ONLY}," in
      *",$id,"*) ;;
      *) return 0 ;;
    esac
  fi

  if [[ $FORCE -eq 0 && -s "$out" ]]; then
    echo "== $out up to date"
    return 0
  fi

  echo "== fetching $id"
  mkdir -p "$CACHE" "$(dirname "$out")"
  curl --silent --show-error --fail --retry 3 --continue-at - -o "$cached" "$url"

  echo "== transcoding $id"
  ffmpeg -y -v error -i "$cached" \
    -vf "scale='min(1280,iw)':-2:flags=lanczos" \
    -c:v libx264 -crf 30 -preset medium -pix_fmt yuv420p \
    -an -movflags +faststart -f mp4 \
    "$out.tmp"
  mv "$out.tmp" "$out"
  echo "== wrote $out ($(du -h "$out" | cut -f1))"
}

# NASA SVS originals, per track id in tracks.js. co2 is committed directly;
# caldwell-73 keeps NASA's own soundtrack and is not sonified, so both are
# not fetched.
fetch night-lights "https://svs.gsfc.nasa.gov/vis/a000000/a005300/a005313/nightlights_flat_series_and_change_wZooms_13_EIC_2160p30_h265.mp4"
fetch sea-surface "https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003912/ecco2_sst_flow.webmhd.webm"
fetch aerosols "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005552/Aerosols_RotatingEarth_3840x2160.mp4"
fetch air-quality "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005533/EIC_AirQuality_Preview_3840x1080.mp4"
fetch perpetual-ocean "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005425/perpetual_ocean2_CLOSE_093_clean_noDate_1080p30.mp4"
fetch lightning "https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005011/iss_lightning_sphere_07312023.mp4"
fetch atmospheric-river "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004960/atmos_river_HD.webm"
fetch forest-height "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004950/GEDI_global_w_colorbar_1080p60.mp4"

echo "== fetch-videos done"
