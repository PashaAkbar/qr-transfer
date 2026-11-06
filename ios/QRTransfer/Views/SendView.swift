import SwiftUI
import UIKit
import UniformTypeIdentifiers

final class SenderModel: ObservableObject {
    @Published var fileName: String?
    @Published var status = "Pilih file, lalu arahkan kamera penerima ke layar ini."
    @Published var qrImage: UIImage?
    @Published var isSending = false
    @Published var frameNumber = 0
    @Published var chunkSize = 600
    @Published var framesPerSecond = 4

    private var frames: [String] = []
    private var timer: Timer?
    private var pendingRaw: Data?
    private var pendingName: String?

    deinit {
        timer?.invalidate()
    }

    func load(url: URL) {
        stop()
        let accessed = url.startAccessingSecurityScopedResource()
        defer { if accessed { url.stopAccessingSecurityScopedResource() } }

        do {
            let raw = try Data(contentsOf: url)
            pendingRaw = raw
            pendingName = url.lastPathComponent
            fileName = url.lastPathComponent
            frameNumber = 0
            qrImage = nil
            status = "Siap mengirim \(url.lastPathComponent) (\(raw.count) byte). Tekan Mulai kirim."
        } catch {
            pendingRaw = nil
            pendingName = nil
            fileName = nil
            qrImage = nil
            status = "Gagal membaca file: \(error.localizedDescription)"
        }
    }

    func start() {
        guard let raw = pendingRaw, let name = pendingName else {
            status = "Pilih file dulu."
            return
        }

        do {
            try prepare(raw: raw, name: name)
        } catch {
            isSending = false
            qrImage = nil
            status = "Gagal menyiapkan QR: \(error.localizedDescription)"
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        if isSending {
            status = "Pengiriman dihentikan."
        }
        isSending = false
        qrImage = nil
    }

    private func prepare(raw: Data, name: String) throws {
        var payload = raw
        var gzipFlag = 0
        if let compressed = Gzip.compress(raw), compressed.count < raw.count {
            payload = compressed
            gzipFlag = 1
        }

        let size = max(1, chunkSize)
        let chunkCount = (payload.count + size - 1) / size
        let total = chunkCount + 1
        let sessionId = TransferProtocol.makeSessionId()
        let meta = TransferProtocol.Meta(n: name, s: raw.count, c: CRC32.hex(raw), g: gzipFlag)

        guard let metaPayload = TransferProtocol.encodeMeta(meta) else {
            throw SenderError.encodingFailed
        }

        var built: [String] = [
            TransferProtocol.Frame(sessionId: sessionId, index: 0, total: total, payload: metaPayload).raw
        ]

        if chunkCount > 0 {
            for index in 0..<chunkCount {
                let start = index * size
                let end = min(start + size, payload.count)
                let chunk = payload.subdata(in: start..<end)
                built.append(TransferProtocol.Frame(
                    sessionId: sessionId,
                    index: index + 1,
                    total: total,
                    payload: chunk.base64EncodedString()
                ).raw)
            }
        }

        frames = built
        frameNumber = 0
        startTimer()
    }

    private func startTimer() {
        timer?.invalidate()
        isSending = true
        showCurrentFrame()

        let interval = 1.0 / Double(max(1, framesPerSecond))
        let timer = Timer(timeInterval: interval, repeats: true) { [weak self] _ in
            self?.advance()
        }
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }

    private func advance() {
        guard !frames.isEmpty else { return }
        frameNumber = (frameNumber + 1) % frames.count
        showCurrentFrame()
    }

    private func showCurrentFrame() {
        guard frames.indices.contains(frameNumber) else { return }
        qrImage = QRCodeGenerator.image(for: frames[frameNumber])
        status = "QR \(frameNumber + 1) dari \(frames.count) • berulang otomatis sampai penerima selesai."
    }
}

private enum SenderError: LocalizedError {
    case encodingFailed

    var errorDescription: String? {
        "Data metadata gagal di-encode."
    }
}

struct SendView: View {
    @StateObject private var model = SenderModel()
    @State private var isPickingFile = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    GroupBox("File") {
                        Button {
                            isPickingFile = true
                        } label: {
                            Label(model.fileName ?? "Pilih file", systemImage: "doc.badge.plus")
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .disabled(model.isSending)
                    }

                    GroupBox("Pengaturan") {
                        Picker("Isi per QR", selection: $model.chunkSize) {
                            Text("300 byte").tag(300)
                            Text("600 byte").tag(600)
                            Text("1000 byte").tag(1000)
                        }
                        Picker("Kecepatan", selection: $model.framesPerSecond) {
                            Text("2 QR/detik").tag(2)
                            Text("4 QR/detik").tag(4)
                            Text("8 QR/detik").tag(8)
                        }
                    }
                    .disabled(model.isSending)

                    Button(model.isSending ? "Hentikan" : "Mulai kirim") {
                        if model.isSending {
                            model.stop()
                        } else {
                            model.start()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)
                    .disabled(model.fileName == nil)

                    if let image = model.qrImage {
                        Image(uiImage: image)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .padding(12)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .frame(maxWidth: .infinity)
                    }

                    Text(model.status)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding()
            }
            .navigationTitle("Kirim")
            .fileImporter(
                isPresented: $isPickingFile,
                allowedContentTypes: [.item],
                allowsMultipleSelection: false
            ) { result in
                switch result {
                case .success(let urls):
                    if let url = urls.first {
                        model.load(url: url)
                    }
                case .failure(let error):
                    model.status = "Gagal memilih file: \(error.localizedDescription)"
                }
            }
            .onDisappear { model.stop() }
        }
    }
}
