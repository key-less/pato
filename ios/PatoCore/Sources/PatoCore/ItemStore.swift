import Foundation

public enum ItemKind: String, Codable, CaseIterable, Sendable {
    case memory, specialDate, letter, profile, couple
}

/// Sobre genérico con el que se guarda y sincroniza cualquier entidad compartida.
public struct SyncRecord: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var kind: ItemKind
    public var payload: Data
    public var updatedAt: Date
    public var deleted: Bool
    public var dirty: Bool

    public init(id: UUID, kind: ItemKind, payload: Data, updatedAt: Date, deleted: Bool = false, dirty: Bool = true) {
        self.id = id
        self.kind = kind
        self.payload = payload
        self.updatedAt = updatedAt
        self.deleted = deleted
        self.dirty = dirty
    }
}

public enum PatoJSON {
    public static var encoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .secondsSince1970
        return encoder
    }

    public static var decoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .secondsSince1970
        return decoder
    }
}

/// Almacén local "offline first". La app funciona sin cuenta; al vincular la
/// pareja, los registros `dirty` se suben y los remotos se fusionan
/// (gana la última escritura).
public struct ItemStore: Codable, Equatable, Sendable {
    public private(set) var records: [UUID: SyncRecord]

    public init(records: [UUID: SyncRecord] = [:]) {
        self.records = records
    }

    public func all<T: Decodable>(_ type: T.Type, kind: ItemKind) -> [T] {
        records.values
            .filter { $0.kind == kind && !$0.deleted }
            .compactMap { try? PatoJSON.decoder.decode(T.self, from: $0.payload) }
    }

    public func get<T: Decodable>(_ type: T.Type, id: UUID) -> T? {
        guard let record = records[id], !record.deleted else { return nil }
        return try? PatoJSON.decoder.decode(T.self, from: record.payload)
    }

    public mutating func put<T: Encodable>(_ value: T, id: UUID, kind: ItemKind, now: Date = Date()) {
        guard let payload = try? PatoJSON.encoder.encode(value) else { return }
        records[id] = SyncRecord(id: id, kind: kind, payload: payload, updatedAt: now, deleted: false, dirty: true)
    }

    public mutating func remove(id: UUID, now: Date = Date()) {
        guard var record = records[id] else { return }
        record.deleted = true
        record.dirty = true
        record.updatedAt = now
        records[id] = record
    }

    public var dirtyRecords: [SyncRecord] {
        records.values.filter(\.dirty)
    }

    /// Marca como subidos solo los que no cambiaron mientras se subían.
    public mutating func markClean(_ pushed: [SyncRecord]) {
        for item in pushed {
            guard var current = records[item.id], current.updatedAt == item.updatedAt else { continue }
            current.dirty = false
            records[item.id] = current
        }
    }

    /// Vuelve a marcar todo como pendiente (al vincularse a una pareja nueva).
    public mutating func markAllDirty() {
        for key in records.keys {
            records[key]?.dirty = true
        }
    }

    /// Devuelve `true` si algo cambió localmente.
    @discardableResult
    public mutating func merge(remote: [SyncRecord]) -> Bool {
        var changed = false
        for incoming in remote {
            if let local = records[incoming.id], local.updatedAt >= incoming.updatedAt { continue }
            var copy = incoming
            copy.dirty = false
            records[incoming.id] = copy
            changed = true
        }
        return changed
    }
}
