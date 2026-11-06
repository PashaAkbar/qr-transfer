import AVFoundation
import Foundation

final class QRScanner: NSObject {
    let session = AVCaptureSession()
    var onCode: ((String) -> Void)?
    var onError: ((String) -> Void)?

    private let sessionQueue = DispatchQueue(label: "qrtransfer.camera.session")
    private let metadataQueue = DispatchQueue(label: "qrtransfer.camera.metadata")
    private var isConfigured = false

    func start() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            configureAndStart()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                guard let self else { return }
                if granted {
                    self.configureAndStart()
                } else {
                    self.fail("Akses kamera ditolak. Aktifkan di Pengaturan > Privasi > Kamera.")
                }
            }
        default:
            fail("Akses kamera ditolak. Aktifkan di Pengaturan > Privasi > Kamera.")
        }
    }

    func stop() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            if self.session.isRunning {
                self.session.stopRunning()
            }
        }
    }

    private func configureAndStart() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            if !self.isConfigured {
                self.configure()
            }
            guard self.isConfigured else { return }
            if !self.session.isRunning {
                self.session.startRunning()
            }
        }
    }

    private func configure() {
        session.beginConfiguration()
        defer { session.commitConfiguration() }

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else {
            fail("Kamera belakang tidak tersedia.")
            return
        }
        session.addInput(input)
        session.sessionPreset = .high

        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else {
            fail("Kamera tidak bisa memindai QR.")
            return
        }
        session.addOutput(output)

        guard output.availableMetadataObjectTypes.contains(.qr) else {
            fail("Pemindaian QR tidak didukung kamera ini.")
            return
        }
        output.metadataObjectTypes = [.qr]
        output.setMetadataObjectsDelegate(self, queue: metadataQueue)
        isConfigured = true
    }

    private func fail(_ message: String) {
        DispatchQueue.main.async { [weak self] in
            self?.onError?(message)
        }
    }
}

extension QRScanner: AVCaptureMetadataOutputObjectsDelegate {
    func metadataOutput(_ output: AVCaptureMetadataOutput,
                        didOutput metadataObjects: [AVMetadataObject],
                        from connection: AVCaptureConnection) {
        for object in metadataObjects {
            guard let code = object as? AVMetadataMachineReadableCodeObject,
                  code.type == .qr,
                  let value = code.stringValue else { continue }
            onCode?(value)
        }
    }
}
