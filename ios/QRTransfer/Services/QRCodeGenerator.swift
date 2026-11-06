import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

enum QRCodeGenerator {
    private static let context = CIContext()
    private static let scale: CGFloat = 12

    static func image(for text: String) -> UIImage? {
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(text.utf8)
        filter.correctionLevel = "L"

        guard let output = filter.outputImage else { return nil }
        let scaled = output.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
        let margin = 4 * scale
        let extent = scaled.extent.insetBy(dx: -margin, dy: -margin)
        let background = CIImage(color: CIColor.white).cropped(to: extent)
        let composed = scaled.composited(over: background)
        guard let cgImage = context.createCGImage(composed, from: extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
