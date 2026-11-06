# QR Transfer for iOS

Native iOS app: **receiver and sender**, wire-compatible with the offline HTML sender.

## Build

Requirements: macOS, Xcode 16+, and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
brew install xcodegen
cd ios
xcodegen generate
open QRTransfer.xcodeproj
```

Then in Xcode:

1. Select the `QRTransfer` target → **Signing & Capabilities** → choose your team.
2. Change the bundle identifier if needed.
3. Pick a physical iPhone (the camera does not work in the Simulator).

Without XcodeGen: create a new iOS App project named `QRTransfer`, drag the
`QRTransfer/` folder in, set the bridging header to
`QRTransfer/QRTransfer-Bridging-Header.h`, and add `-lz` to Other Linker Flags.

## Building without a Mac

`.github/workflows/ios.yml` builds the app on GitHub's macOS runner and uploads
two artifacts:

- `QRTransfer-unsigned-ipa` — device build, unsigned. Sign and install it from
  Windows with [Sideloadly](https://sideloadly.io/) using your Apple ID (free
  accounts expire after 7 days; a paid developer account lasts a year).
- `QRTransfer-simulator-app` — simulator build for inspection.

Push the repo to GitHub, open **Actions → iOS Build → Run workflow**, then
download the artifact. Sideloadly handles signing with the Apple ID configured
on the iPhone.

Other options that do not require owning a Mac: Codemagic or Bitrise (macOS
cloud, can export a signed IPA with an Apple Developer account), MacinCloud or
MacStadium (rented Mac with Xcode), or Xcode Cloud (needs the Apple Developer
Program and a one-time setup in Xcode).

Compiling iOS apps on Windows is not possible: the Windows Swift toolchain has
no UIKit/SwiftUI/AVFoundation SDK. The Swift sources can be syntax-checked, but
a macOS build environment is required for a runnable app.

## Usage

- **Kirim**: pick a file, choose chunk size and frame rate, press *Mulai kirim*,
  then point the other device at the screen. Frames loop automatically.
- **Terima**: press *Buka kamera* and hold it over the sender's QR codes. The app
  reassembles the file, verifies CRC32, and offers *Simpan file*.

## Wire protocol

Identical to the HTML sender:

```
QF|<sessionId>|<index>|<total>|<payload>
```

- `index 0` → base64(JSON) metadata `{"n":filename,"s":originalBytes,"c":crc32Hex,"g":0|1}`
- `index 1..total-1` → base64 chunk bytes
- Chunks are gzip-compressed before base64 when `g = 1` and compression helps.
  gzip is handled by the system zlib (`-lz`, `<zlib.h>` in the bridging header).
- QR: byte mode, error correction level L, version auto-selected.
- The receiver accepts any chunk size and frame rate, ignores duplicates, and
  resets when the session id changes.
