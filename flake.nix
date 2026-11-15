
{
  description = "Earth Information Jukebox - NASA Space Apps Challenge 2026";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        tools = with pkgs; [
          nodejs_24
          pnpm_10
          http-server

          cargo
          rustc
          rustup
          wasm-bindgen-cli

          ffmpeg
          git
          curl
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          packages = tools;

          shellHook = ''
            echo "=========================================="
            echo "Earth Information Jukebox Development Shell"
            echo "=========================================="
            echo ""
            echo "Node: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo "Rust: $(rustc --version)"
            echo "FFmpeg: $(ffmpeg -version | head -n 1)"
            echo ""
            echo "Build + serve the website (rebuilds the sonificator WASM when stale):"
            echo "  scripts/dev.sh [port]"
            echo ""
            echo "Rebuild the sonificator WASM (sonificator is pulled from GitHub by cargo):"
            echo "  cargo build --manifest-path wasm/Cargo.toml --target wasm32-unknown-unknown --release"
            echo "  wasm-bindgen wasm/target/wasm32-unknown-unknown/release/sonificator_wasm.wasm \\"
            echo "    --target web --out-dir wasm/pkg --out-name sonificator_wasm"
            echo ""
          '';
        };
      }
    );
}
