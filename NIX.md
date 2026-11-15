# Nix Flakes Setup for Earth Information Jukebox

This document explains how to use Nix flakes to manage dependencies for the Earth Information Jukebox project, including the sonificator audio engine.

## Quick Start

The flake.nix file provides the tools; Cargo pulls the sonificator engine directly from GitHub when the WASM wrapper in `wasm/` is built.

### Prerequisites

1. Install Nix with flakes support:
   ```bash
   curl -L https://nixos.org/nixos/install | sh
   ```

2. Enable flakes in your Nix configuration:
   ```bash
   mkdir -p ~/.config/nix
   echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
   ```

### Development Environment

To enter a development shell with all tools pre-installed:

```bash
# From the project root
# First time: This will generate flake.lock
nix develop

# Subsequent times: Uses existing flake.lock
nix develop
# or
nix shell
```

The first time you run `nix develop`, it will:
1. Download all dependencies defined in `flake.nix`
2. Generate a `flake.lock` file that pins exact versions
3. Enter the development shell with all tools available

After the first run, `flake.lock` should be committed to git so all developers use the same versions.

This will give you access to:
- Node.js 20 with npm and pnpm
- http-server for local development
- Rust toolchain (cargo, rustc, rustup) for sonificator
- wasm-bindgen for WASM generation
- FFmpeg for video processing
- Git

### Running the Server

Once in the development shell:

```bash
# Recommended: rebuilds the sonificator WASM if needed, then serves
scripts/dev.sh            # or: pnpm start

# Just serve (WASM untouched)
npx http-server . -p 8080 -c-1
```

## Building with Nix

To build the project with Nix:

```bash
nix build
```

This will create a `result` directory with the built project.

## Using direnv

For automatic environment activation when you enter the directory:

1. Install direnv:
   ```bash
   nix-env -iA nixpkgs.direnv
   ```

2. Allow direnv in your shell (add to ~/.bashrc or ~/.zshrc):
   ```bash
   eval "$(direnv hook bash)"
   # or for zsh
   eval "$(direnv hook zsh)"
   ```

3. The `.envrc` file in this project will automatically load the Nix shell.

## Adding Dependencies

To add a new dependency, edit `flake.nix`:

```nix
nativeBuildInputs = with pkgs; [
  nodejs_20
  nodePackages.pnpm
  http-server
  # Add new packages here
  # e.g., for Python:
  python3
  python3Packages.numpy
];
```

Then run `nix shell` to get the updated environment.

## Sonificator Integration

Sonificator is pulled straight from GitHub by Cargo and wrapped for the browser
in a small wrapper crate that lives in this repo at `wasm/`.

### Building WASM for Browser Use

To build sonificator to WebAssembly for use in the browser:

```bash
# Add the WASM target (if not already present)
rustup target add wasm32-unknown-unknown

# Build the wrapper crate (Cargo fetches sonificator from GitHub)
cargo build --manifest-path wasm/Cargo.toml --target wasm32-unknown-unknown --release

# Generate JavaScript bindings using wasm-bindgen
wasm-bindgen wasm/target/wasm32-unknown-unknown/release/sonificator_wasm.wasm \
  --target web --out-dir wasm/pkg --out-name sonificator_wasm
```

This will create:
- `wasm/pkg/sonificator_wasm.js` - JavaScript bindings
- `wasm/pkg/sonificator_wasm_bg.wasm` - The WebAssembly binary

### Using Sonificator in the Website

In your JavaScript code:

```javascript
import init, { WasmSonificator } from './wasm/pkg/sonificator_wasm.js';

async function loadSonificator(sampleRate) {
  await init();
  const engine = new WasmSonificator(sampleRate);
  
  // Process video frames
  engine.push_frame(rgbaData, width, height);
  
  // Render audio
  const samples = engine.render(512);
  
  return engine;
}
```

The globe.js file already has sonificator integration code that:
- Initializes sonificator when the page loads
- Processes video frames from any video element
- Syncs the wave-bg visualizer with sonificator's audio output
- Connects to the Web Audio API for playback

## Notes

- Nix flakes provide reproducible development environments
- All tools are pinned to specific versions in `flake.lock`
- The environment is isolated from your system packages
- First-time setup may take a while as Nix downloads dependencies

## Troubleshooting

### Nix command not found

Make sure Nix is installed and in your PATH. Restart your shell or run:
```bash
. /home/YOUR_USER/.nix-profile/etc/profile.d/nix.sh
```

### Flakes not enabled

Ensure you have `experimental-features = nix-command flakes` in your `~/.config/nix/nix.conf`

### Slow downloads

Nix will cache dependencies. The first build may take longer, but subsequent builds will be faster.

### Clearing cache

To force a fresh download:
```bash
nix store gc -f
nix develop --recreate-lock-file
```
