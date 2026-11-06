import Foundation

enum TransferProtocol {
    static let prefix = "QF"
    static let separator = "|"

    struct Meta: Codable, Equatable {
        let n: String
        let s: Int
        let c: String
        let g: Int
    }

    struct Frame: Equatable {
        let sessionId: String
        let index: Int
        let total: Int
        let payload: String

        var raw: String {
            "\(TransferProtocol.prefix)\(TransferProtocol.separator)\(sessionId)\(TransferProtocol.separator)\(index)\(TransferProtocol.separator)\(total)\(TransferProtocol.separator)\(payload)"
        }
    }

    static func makeSessionId() -> String {
        let alphabet = Array("abcdefghijklmnopqrstuvwxyz0123456789")
        return String((0..<4).compactMap { _ in alphabet.randomElement() })
    }

    static func parse(_ raw: String) -> Frame? {
        let parts = raw.components(separatedBy: separator)
        guard parts.count >= 5, parts[0] == prefix else { return nil }
        guard let index = Int(parts[2]), let total = Int(parts[3]) else { return nil }
        guard total > 0, index >= 0, index < total else { return nil }
        let payload = parts[4...].joined(separator: separator)
        return Frame(sessionId: parts[1], index: index, total: total, payload: payload)
    }

    static func encodeMeta(_ meta: Meta) -> String? {
        guard let json = try? JSONEncoder().encode(meta) else { return nil }
        return json.base64EncodedString()
    }

    static func decodeMeta(_ payload: String) -> Meta? {
        guard let data = Data(base64Encoded: payload) else { return nil }
        return try? JSONDecoder().decode(Meta.self, from: data)
    }
}
