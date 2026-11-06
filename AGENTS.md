# QR Transfer

Offline file transfer between devices using animated QR codes. No server, no network, no cloud.

## Components

- `qr-transfer-tanpa-library.html` — single-file web app, fully offline. **Sender only** (no receive UI, no jsQR). QR encoder (`qrMake`) is hand-written: byte mode, EC level L, version auto-selected.
- `ios/` — native iOS app (SwiftUI), **receiver and sender**, wire-compatible with the HTML app. Project is defined by `ios/project.yml` (XcodeGen); see `ios/README.md` for build steps.
- `graphify-out/` — generated knowledge graph (run `/graphify .` to query it; `graphify update .` after code changes).

## Wire protocol (must stay compatible)

Every QR frame is plain text:

```
QF|<sessionId>|<index>|<total>|<payload>
```

- `index = 0` carries metadata: `base64(JSON)`, JSON shape `{"n": filename, "s": original byte length, "c": crc32 hex, "g": gzip flag}`.
- `index = 1..total-1` carries data chunks: `base64(chunk bytes)`.
- `g = 1` means the chunk payload is gzip-compressed before base64; decompress after reassembly.
- `sessionId` is a short random string. A new session id resets receiver state.
- Chunk size and display speed are sender-side only. The receiver must accept any chunk size and any frame rate, and must handle frames arriving out of order or repeatedly.
- Integrity: receiver verifies CRC32 over the reassembled (decompressed) file and only then offers it for saving.
- Frame geometry: QR error correction level L, byte mode, version auto-selected.

## Rules

Universal rules (apply to all code in this repo):

@./.commandcode/rules/security.md
@./.commandcode/rules/coding-style.md
@./.commandcode/rules/testing.md
@./.commandcode/rules/patterns.md
@./.commandcode/rules/git-workflow.md

Platform-specific reference, not auto-loaded (written for Claude Code's agent/hook setup; read on demand): `.commandcode/rules/agents.md`, `.commandcode/rules/performance.md`, `.commandcode/rules/hooks.md`.
