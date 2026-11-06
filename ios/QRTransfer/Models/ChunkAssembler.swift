import Foundation

enum AssemblyError: Error {
    case incomplete
    case missingMetadata
    case checksumMismatch
    case decompressionFailed
}

struct AssembledFile {
    let name: String
    let data: Data
}

struct ChunkAssembler {
    private(set) var sessionId = ""
    private(set) var total = 0
    private(set) var meta: TransferProtocol.Meta?
    private var chunks: [Int: String] = [:]

    var receivedCount: Int { chunks.count }
    var isComplete: Bool { total > 0 && meta != nil && chunks.count == total }

    mutating func ingest(_ frame: TransferProtocol.Frame) throws -> Bool {
        if frame.sessionId != sessionId {
            reset()
            sessionId = frame.sessionId
        }
        guard total == 0 || frame.total == total else {
            throw AssemblyError.incomplete
        }
        total = frame.total

        if chunks[frame.index] != nil { return false }
        if frame.index == 0 {
            guard let decoded = TransferProtocol.decodeMeta(frame.payload) else { return false }
            meta = decoded
        }
        chunks[frame.index] = frame.payload
        return true
    }

    mutating func reset() {
        sessionId = ""
        total = 0
        meta = nil
        chunks = [:]
    }

    func assemble() throws -> AssembledFile {
        guard let meta else { throw AssemblyError.missingMetadata }
        guard chunks.count == total else { throw AssemblyError.incomplete }

        var data = Data()
        if total > 1 {
            for index in 1..<total {
                guard let payload = chunks[index], let chunk = Data(base64Encoded: payload) else {
                    throw AssemblyError.incomplete
                }
                data.append(chunk)
            }
        }

        if meta.g == 1 {
            guard let inflated = Gzip.decompress(data) else {
                throw AssemblyError.decompressionFailed
            }
            data = inflated
        }

        guard let expected = UInt32(meta.c, radix: 16), CRC32.checksum(data) == expected else {
            throw AssemblyError.checksumMismatch
        }
        return AssembledFile(name: meta.n, data: data)
    }
}
