# Speakdown

Fast, lightweight, local-first markdown editor with offline voice dictation and read-aloud.

Built with **Tauri v2**, **React**, **Zustand**, **CodeMirror**, and **Rust**. Documents stay on disk — no database, no cloud. Workspace respects `.gitignore` rules. Supports multiple windows, tables, Mermaid diagrams, full-content search, and fully offline speech-to-text plus text-to-speech.

## Features

- **Offline voice dictation** — two local engines: sherpa-onnx (NeMo Transducer models for low-latency streaming) and Apple's on-device `SFSpeechRecognizer`. No cloud dependency.
- **Read-aloud (TTS)** — karaoke-style word highlighting, mini-player with play/pause/speed, macOS system voices.
- **Markdown editor** — CodeMirror 6 with extended syntax (tables, Mermaid, YAML frontmatter).
- **Workspace management** — multi-root workspace with `.gitignore`-aware file tree, pinned tabs, drag-to-move files.
- **Full-content search** — fuzzy and literal grep across all markdown files (`Cmd+Shift+F`).
- **Local-first** — all data is plain markdown files on your filesystem.

## Repository structure

```
apps/desktop/            Tauri desktop app
apps/desktop/src/        React frontend
apps/desktop/src-tauri/  Rust backend (IPC, file watcher, workspace state, voice)
apps/website/            Landing page
docs/                    Project and agent workflow documentation
SPECs/                   Feature specs and design notes
```

## Development

This repo uses **Vite+** through the `vp` CLI.

```bash
vp install
vp dev
```

### Validation

```bash
vp check
vp test
```

Rust validation from the Tauri crate:

```bash
cd apps/desktop/src-tauri
cargo test
cargo clippy
cargo fmt --check
```

## Installing (macOS)

Speakdown is distributed as an unsigned macOS app (not notarized through the Apple Developer Program). On first launch, Gatekeeper will warn of an unidentified developer:

- **Right-click** (or Control-click) `Speakdown.app` → **Open**, then **Open** again.
- Or from Terminal: `xattr -dr com.apple.quarantine /Applications/Speakdown.app`

## Releases

macOS releases are cut locally with `scripts/distribute.sh`. See `docs/releasing.md` for the workflow. Apple signing/notarization is optional; the in-app auto-updater is signed with an independent minisign key.

## Credits & license

Speakdown is a **modified version** of **Writer** by [joelbqz](https://github.com/joelbqz). Modifications include offline voice dictation (sherpa-onnx + Apple speech recognition), read-aloud with karaoke highlighting, voice settings, full-content search, and related changes.

- **Original project**: [Writer](https://github.com/joelbqz/writer-computer) by joelbqz
- **This fork**: [Speakdown](https://github.com/fluxorr/speakdown), maintained by [fluxorr](https://github.com/fluxorr)
- **License**: [GNU General Public License v3.0](./LICENSE) — same as upstream.

As required by the GPL:

- This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
- This program is distributed in the hope that it will be useful, but **without any warranty**; without even the implied warranty of merchantability or fitness for a particular purpose. See the GNU General Public License for more details.
- The complete corresponding source code is publicly available at the repository above.
- Modified versions are marked as changed, and problems should not be attributed to the authors of previous versions.
