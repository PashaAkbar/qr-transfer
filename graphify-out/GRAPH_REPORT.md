# Graph Report - qr-transfer  (2026-11-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 175 nodes · 254 edges · 12 communities (7 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10

## God Nodes (most connected - your core abstractions)
1. `base` - 17 edges
2. `ReceiverModel` - 16 edges
3. `SenderModel` - 15 edges
4. `QRScanner` - 12 edges
5. `ChunkAssembler` - 11 edges
6. `TransferProtocol` - 10 edges
7. `PreviewView` - 8 edges
8. `Meta` - 7 edges
9. `CameraPreview` - 7 edges
10. `ReceivedFile` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ReceiverModel` --calls--> `ChunkAssembler`  [INFERRED]
  ios/QRTransfer/Views/ReceiveView.swift → ios/QRTransfer/Models/ChunkAssembler.swift
- `ReceiverModel` --calls--> `QRScanner`  [INFERRED]
  ios/QRTransfer/Views/ReceiveView.swift → ios/QRTransfer/Services/QRScanner.swift
- `.body` --calls--> `ReceiveView`  [INFERRED]
  ios/QRTransfer/ContentView.swift → ios/QRTransfer/Views/ReceiveView.swift
- `.body` --calls--> `CameraPreview`  [INFERRED]
  ios/QRTransfer/Views/ReceiveView.swift → ios/QRTransfer/Views/CameraPreview.swift
- `.body` --calls--> `ContentView`  [INFERRED]
  ios/QRTransfer/QRTransferApp.swift → ios/QRTransfer/ContentView.swift

## Import Cycles
- None detected.

## Communities (12 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (30): CODE_SIGN_STYLE, CURRENT_PROJECT_VERSION, GENERATE_INFOPLIST_FILE, INFOPLIST_KEY_CFBundleDisplayName, INFOPLIST_KEY_NSCameraUsageDescription, INFOPLIST_KEY_UIApplicationSceneManifest_Generation, INFOPLIST_KEY_UILaunchScreen_Generation, INFOPLIST_KEY_UISupportedInterfaceOrientations (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (9): AVFoundation, Foundation, AssembledFile, AssemblyError, checksumMismatch, decompressionFailed, incomplete, missingMetadata (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (7): ChunkAssembler, .isComplete, .receivedCount, Frame, .raw, Meta, TransferProtocol

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (10): ContentView, .body, QRTransferApp, .body, SenderError, encodingFailed, .errorDescription, SendView (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (3): ReceiverModel, ReceiveView, .body

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (4): CameraPreview, PreviewView, .layerClass, .previewLayer

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (4): CoreImage, CoreImage.CIFilterBuiltins, QRCodeGenerator, UIKit

## Knowledge Gaps
- **13 isolated node(s):** `checksumMismatch`, `decompressionFailed`, `incomplete`, `missingMetadata`, `.isComplete` (+8 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 73 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ReceiverModel` connect `Community 4` to `Community 9`, `Community 2`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.301) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ReceiverModel` (e.g. with `ChunkAssembler` and `QRScanner`) actually correct?**
  _`ReceiverModel` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `checksumMismatch`, `decompressionFailed`, `incomplete` to the rest of the system?**
  _13 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `SenderModel` connect `Community 5` to `Community 3`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._
- **Why does `ChunkAssembler` connect `Community 2` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._