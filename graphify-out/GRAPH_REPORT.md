# Graph Report - qr-transfer  (2026-11-06)

## Corpus Check
- 29 files · ~9,252 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 298 nodes · 436 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e0d40314`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- base
- ChunkAssembler
- protocol.js
- steps
- ReceiverModel
- SenderModel
- QRScanner
- PreviewView
- QRCodeGenerator.swift
- ReceivedFile
- package.json
- steps
- web.yml

## God Nodes (most connected - your core abstractions)
1. `base` - 17 edges
2. `ReceiverModel` - 16 edges
3. `SenderModel` - 15 edges
4. `QRScanner` - 12 edges
5. `Assembler` - 11 edges
6. `ChunkAssembler` - 11 edges
7. `TransferProtocol` - 10 edges
8. `buildTransfer()` - 9 edges
9. `PreviewView` - 8 edges
10. `useReceiver()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ReceiverModel` --calls--> `ChunkAssembler`  [INFERRED]
  ios/QRTransfer/Views/ReceiveView.swift → ios/QRTransfer/Models/ChunkAssembler.swift
- `ReceiverModel` --calls--> `QRScanner`  [INFERRED]
  ios/QRTransfer/Views/ReceiveView.swift → ios/QRTransfer/Services/QRScanner.swift
- `.body` --calls--> `CameraPreview`  [INFERRED]
  ios/QRTransfer/Views/ReceiveView.swift → ios/QRTransfer/Views/CameraPreview.swift
- `ChunkAssembler` --references--> `TransferProtocol`  [EXTRACTED]
  ios/QRTransfer/Models/ChunkAssembler.swift → ios/QRTransfer/Models/TransferProtocol.swift
- `.body` --calls--> `ContentView`  [INFERRED]
  ios/QRTransfer/QRTransferApp.swift → ios/QRTransfer/ContentView.swift

## Import Cycles
- None detected.

## Communities (14 total, 3 thin omitted)

### Community 0 - "base"
Cohesion: 0.07
Nodes (30): CODE_SIGN_STYLE, CURRENT_PROJECT_VERSION, GENERATE_INFOPLIST_FILE, INFOPLIST_KEY_CFBundleDisplayName, INFOPLIST_KEY_NSCameraUsageDescription, INFOPLIST_KEY_UIApplicationSceneManifest_Generation, INFOPLIST_KEY_UILaunchScreen_Generation, INFOPLIST_KEY_UISupportedInterfaceOrientations (+22 more)

### Community 1 - "ChunkAssembler"
Cohesion: 0.07
Nodes (13): AVFoundation, Foundation, AssembledFile, AssemblyError, checksumMismatch, decompressionFailed, incomplete, missingMetadata (+5 more)

### Community 2 - "protocol.js"
Cohesion: 0.10
Nodes (26): react, metaPayload, qr, random, roundTrip(), text, App(), ReceivePanel() (+18 more)

### Community 3 - "steps"
Cohesion: 0.09
Nodes (21): defaults, runs-on, steps, run, jobs, build, name, on (+13 more)

### Community 4 - "ReceiverModel"
Cohesion: 0.11
Nodes (10): ContentView, .body, QRTransferApp, .body, ReceiverModel, ReceiveView, .body, SendView (+2 more)

### Community 5 - "SenderModel"
Cohesion: 0.11
Nodes (9): Frame, .raw, Meta, TransferProtocol, SenderError, encodingFailed, .errorDescription, SenderModel (+1 more)

### Community 7 - "PreviewView"
Cohesion: 0.21
Nodes (4): CameraPreview, PreviewView, .layerClass, .previewLayer

### Community 8 - "QRCodeGenerator.swift"
Cohesion: 0.22
Nodes (4): CoreImage, CoreImage.CIFilterBuiltins, QRCodeGenerator, UIKit

### Community 10 - "package.json"
Cohesion: 0.11
Nodes (20): jsqr, react-dom, vite, @vitejs/plugin-react, dependencies, jsqr@^1.4.0, react@^19.3.1, react-dom@^19.3.1 (+12 more)

### Community 12 - "steps"
Cohesion: 0.10
Nodes (21): runs-on, steps, environment, needs, runs-on, steps, name, url (+13 more)

### Community 13 - "web.yml"
Cohesion: 0.14
Nodes (13): concurrency, cancel-in-progress, group, name, on, push, workflow_dispatch, permissions (+5 more)

## Knowledge Gaps
- **13 isolated node(s):** `checksumMismatch`, `decompressionFailed`, `incomplete`, `missingMetadata`, `.isComplete` (+8 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ReceiverModel` connect `ReceiverModel` to `ChunkAssembler`, `SenderModel`, `QRScanner`, `ReceivedFile`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ReceiverModel` (e.g. with `ChunkAssembler` and `QRScanner`) actually correct?**
  _`ReceiverModel` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `checksumMismatch`, `decompressionFailed`, `incomplete` to the rest of the system?**
  _13 weakly-connected nodes found - possible missing edges._
- **Should `base` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `SenderModel` connect `SenderModel` to `ReceiverModel`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `ChunkAssembler` be split into smaller, more focused modules?**
  _Cohesion score 0.07394957983193277 - nodes in this community are weakly interconnected._
- **Why does `ChunkAssembler` connect `ChunkAssembler` to `ReceiverModel`, `SenderModel`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._