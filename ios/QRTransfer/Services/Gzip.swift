import Foundation

enum Gzip {
    static func compress(_ data: Data) -> Data? {
        guard !data.isEmpty else { return nil }

        var stream = z_stream()
        guard deflateInit2_(&stream, Z_DEFAULT_COMPRESSION, Z_DEFLATED, 15 + 16, 8,
                            Z_DEFAULT_STRATEGY, zlibVersion(),
                            Int32(MemoryLayout<z_stream>.size)) == Z_OK else {
            return nil
        }
        defer { deflateEnd(&stream) }

        let bound = Int(deflateBound(&stream, uLong(data.count)))
        guard bound > 0 else { return nil }

        var output = [UInt8](repeating: 0, count: bound)
        let input = [UInt8](data)

        let status: Int32 = input.withUnsafeBufferPointer { inputBuffer in
            output.withUnsafeMutableBufferPointer { outputBuffer in
                stream.next_in = UnsafeMutablePointer(mutating: inputBuffer.baseAddress)
                stream.avail_in = uInt(inputBuffer.count)
                stream.next_out = outputBuffer.baseAddress
                stream.avail_out = uInt(outputBuffer.count)
                return deflate(&stream, Z_FINISH)
            }
        }

        guard status == Z_STREAM_END else { return nil }
        let produced = output.count - Int(stream.avail_out)
        return Data(output.prefix(produced))
    }

    static func decompress(_ data: Data) -> Data? {
        guard data.count >= 18 else { return nil }

        let size = data.withUnsafeBytes { raw -> UInt32 in
            let bytes = raw.bindMemory(to: UInt8.self)
            let base = data.count - 4
            return UInt32(bytes[base])
                | (UInt32(bytes[base + 1]) << 8)
                | (UInt32(bytes[base + 2]) << 16)
                | (UInt32(bytes[base + 3]) << 24)
        }
        guard size > 0 else { return Data() }

        var stream = z_stream()
        guard inflateInit2_(&stream, 15 + 16, zlibVersion(),
                            Int32(MemoryLayout<z_stream>.size)) == Z_OK else {
            return nil
        }
        defer { inflateEnd(&stream) }

        var output = [UInt8](repeating: 0, count: Int(size) + 16)
        let input = [UInt8](data)

        let status: Int32 = input.withUnsafeBufferPointer { inputBuffer in
            output.withUnsafeMutableBufferPointer { outputBuffer in
                stream.next_in = UnsafeMutablePointer(mutating: inputBuffer.baseAddress)
                stream.avail_in = uInt(inputBuffer.count)
                stream.next_out = outputBuffer.baseAddress
                stream.avail_out = uInt(outputBuffer.count)
                return inflate(&stream, Z_FINISH)
            }
        }

        guard status == Z_STREAM_END else { return nil }
        let produced = output.count - Int(stream.avail_out)
        return Data(output.prefix(produced))
    }
}
