# QR Transfer

Offline file transfer between devices using animated QR codes. No server, no network, no cloud.

## Live site

https://pashaakbar.github.io/qr-transfer/

Deployed automatically by `.github/workflows/web.yml` on every push that touches `web/`.
The receiver needs a camera and a secure origin — GitHub Pages serves HTTPS.

## What's here

| Path | Description |
| --- | --- |
| `web/` | React + Vite app: **Kirim** and **Terima** in the browser. |
| `qr-transfer-tanpa-library.html` | Single-file offline HTML app. **Sender only.** |
| `ios/` | Experimental SwiftUI app (paused). |
| `graphify-out/` | Generated knowledge graph (`/graphify .`). |

## Protocol

Every QR frame is plain text:

```
QF|<sessionId>|<index>|<total>|<payload>
```

- `index 0` → `base64(JSON)` metadata `{"n":filename,"s":originalBytes,"c":crc32Hex,"g":0|1}`
- `index 1..total-1` → `base64(chunk bytes)`
- `g = 1` means the chunk payload is gzip-compressed before base64.
- The receiver verifies CRC32 over the reassembled (decompressed) file before offering it.
- QR: byte mode, error correction level L, version auto-selected.

## Web app

```bash
cd web
npm install --include=dev
npm run dev      # local development
npm run check    # protocol round-trip test
npm run build    # production build in web/dist
```

Vite is configured with `base: './'`, so the build works under the
`/qr-transfer/` subpath used by GitHub Pages.
