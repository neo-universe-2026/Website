#!/usr/bin/env bash
# Build the sonificator WASM wrapper (skipping it when up to date) and serve
# the website locally.
#
#   scripts/dev.sh [port]     # default port: 8080
#
# Run it inside the Nix shell (`nix develop`) so cargo, wasm-bindgen and
# http-server are all on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${1:-8080}"
OUT_DIR="wasm/pkg"
OUT_JS="$OUT_DIR/sonificator_wasm.js"
WASM_SRC="wasm/target/wasm32-unknown-unknown/release/sonificator_wasm.wasm"

for tool in cargo wasm-bindgen; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "error: $tool not found. Run this inside the Nix shell: nix develop" >&2
    exit 1
  fi
done

# Rebuild only when the bindings are missing or the wrapper sources changed.
if [[ ! -f "$OUT_JS" ]] || [[ -n "$(find wasm/Cargo.toml wasm/Cargo.lock wasm/src -newer "$OUT_JS" -type f 2>/dev/null)" ]]; then
  echo "== Building sonificator WASM =="
  if ! rustup target list --installed 2>/dev/null | grep -q wasm32-unknown-unknown; then
    rustup target add wasm32-unknown-unknown
  fi
  cargo build --manifest-path wasm/Cargo.toml --target wasm32-unknown-unknown --release
  mkdir -p "$OUT_DIR"
  wasm-bindgen "$WASM_SRC" --target web --out-dir "$OUT_DIR" --out-name sonificator_wasm
  echo "== WASM written to $OUT_DIR =="
else
  echo "== WASM up to date =="
fi

if command -v http-server >/dev/null 2>&1; then
  SERVER=(http-server .)
elif command -v npx >/dev/null 2>&1; then
  SERVER=(npx --yes http-server .)
else
  echo "error: no http-server or npx on PATH. Run this inside the Nix shell: nix develop" >&2
  exit 1
fi

echo "== Serving on http://localhost:$PORT (Ctrl-C to stop) =="
exec "${SERVER[@]}" -p "$PORT" -c-1
