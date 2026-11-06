import SwiftUI
import UniformTypeIdentifiers

final class ReceiverModel: ObservableObject {
    @Published var status = "Arahkan kamera ke QR di layar pengirim dan tahan sampai selesai."
    @Published var progress: Double = 0
    @Published var received = 0
    @Published var total = 0
    @Published var fileName: String?
    @Published var isScanning = false
    @Published var finishedFile: ReceivedFile?
    @Published var isExporting = false

    let scanner = QRScanner()
    private var assembler = ChunkAssembler()
    private var didFinish = false

    init() {
        scanner.onCode = { [weak self] code in
            DispatchQueue.main.async { self?.handle(code) }
        }
        scanner.onError = { [weak self] message in
            DispatchQueue.main.async {
                self?.isScanning = false
                self?.status = message
            }
        }
    }

    func start() {
        reset()
        status = "Mencari QR..."
        isScanning = true
        scanner.start()
    }

    func stop() {
        scanner.stop()
        isScanning = false
    }

    func reset() {
        assembler.reset()
        received = 0
        total = 0
        progress = 0
        fileName = nil
        finishedFile = nil
        didFinish = false
    }

    func reportExport(_ result: Result<URL, Error>) {
        switch result {
        case .success:
            status = "File disimpan."
        case .failure(let error):
            if (error as NSError).code == NSUserCancelledError { return }
            status = "Gagal menyimpan: \(error.localizedDescription)"
        }
    }

    private func handle(_ code: String) {
        guard !didFinish, let frame = TransferProtocol.parse(code) else { return }

        do {
            let isNew = try assembler.ingest(frame)
            total = assembler.total
            received = assembler.receivedCount
            progress = total > 0 ? Double(received) / Double(total) : 0
            if let meta = assembler.meta { fileName = meta.n }

            if isNew {
                var message = "Diterima \(received) dari \(total) QR"
                if let fileName { message += " untuk \(fileName)" }
                status = message + "."
            }

            if assembler.isComplete {
                finish()
            }
        } catch {
            assembler.reset()
            received = 0
            total = 0
            progress = 0
            status = "Aliran QR tidak konsisten. Mulai pindai ulang."
        }
    }

    private func finish() {
        guard !didFinish else { return }
        didFinish = true
        stop()

        do {
            let file = try assembler.assemble()
            let safeName = sanitize(file.name)
            fileName = safeName
            finishedFile = ReceivedFile(data: file.data)
            progress = 1
            status = "Selesai: \(safeName) (\(file.data.count) byte). Checksum cocok."
        } catch {
            progress = 0
            status = "File rusak atau tidak lengkap. Coba terima ulang."
        }
    }

    private func sanitize(_ name: String) -> String {
        let cleaned = name
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "\\", with: "_")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return cleaned.isEmpty ? "file" : cleaned
    }
}

struct ReceiveView: View {
    @StateObject private var model = ReceiverModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if model.isScanning {
                        CameraPreview(session: model.scanner.session)
                            .frame(height: 320)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button(model.isScanning ? "Hentikan kamera" : "Buka kamera") {
                        if model.isScanning {
                            model.stop()
                        } else {
                            model.start()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)

                    if model.total > 0 {
                        ProgressView(value: model.progress)
                        Text("\(model.received) dari \(model.total) QR")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    if model.finishedFile != nil {
                        Button("Simpan file") {
                            model.isExporting = true
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .frame(maxWidth: .infinity)

                        Button("Terima file lain") {
                            model.start()
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.large)
                        .frame(maxWidth: .infinity)
                    }

                    Text(model.status)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding()
            }
            .navigationTitle("Terima")
            .fileExporter(
                isPresented: $model.isExporting,
                document: model.finishedFile,
                contentType: .data,
                defaultFilename: model.fileName ?? "file"
            ) { result in
                model.reportExport(result)
            }
            .onChange(of: scenePhase) { _, phase in
                if phase != .active {
                    model.stop()
                }
            }
            .onDisappear { model.stop() }
        }
    }
}
