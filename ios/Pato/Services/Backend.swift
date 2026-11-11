import Foundation
import Supabase
import PatoCore

/// Acceso a Supabase: cuenta, vinculación de pareja, sincronización y presencia.
/// Si no hay configuración (Config/Secrets.xcconfig), la app corre en modo local.
final class Backend {
    let client: SupabaseClient

    static func makeFromBundle() -> Backend? {
        let info = Bundle.main.infoDictionary ?? [:]
        guard let host = (info["SupabaseHost"] as? String)?.trimmingCharacters(in: .whitespaces), !host.isEmpty,
              let key = (info["SupabaseAnonKey"] as? String)?.trimmingCharacters(in: .whitespaces), !key.isEmpty,
              let url = URL(string: "https://\(host)") else { return nil }
        return Backend(url: url, key: key)
    }

    init(url: URL, key: String) {
        client = SupabaseClient(supabaseURL: url, supabaseKey: key)
    }

    // MARK: Cuenta

    var userID: UUID? { client.auth.currentUser?.id }
    var email: String? { client.auth.currentUser?.email }

    func sendCode(to email: String) async throws {
        try await client.auth.signInWithOTP(email: email)
    }

    func verify(email: String, code: String) async throws {
        _ = try await client.auth.verifyOTP(email: email, token: code, type: .email)
    }

    func signOut() async {
        try? await client.auth.signOut()
    }

    // MARK: Pareja

    private struct MemberRow: Decodable {
        let couple_id: UUID
    }

    private struct CoupleRow: Decodable {
        let invite_code: String
    }

    func currentCoupleID() async throws -> UUID? {
        guard let userID else { return nil }
        let rows: [MemberRow] = try await client.from("members")
            .select("couple_id")
            .eq("user_id", value: userID.uuidString)
            .execute()
            .value
        return rows.first?.couple_id
    }

    func inviteCode(coupleID: UUID) async throws -> String? {
        let rows: [CoupleRow] = try await client.from("couples")
            .select("invite_code")
            .eq("id", value: coupleID.uuidString)
            .execute()
            .value
        return rows.first?.invite_code
    }

    func createCouple() async throws {
        try await client.rpc("create_couple").execute()
    }

    func joinCouple(code: String) async throws {
        try await client.rpc("join_couple", params: ["invite": code.uppercased()]).execute()
    }

    func leaveCouple() async throws {
        try await client.rpc("leave_couple").execute()
    }

    // MARK: Registros compartidos

    private struct ItemRow: Codable {
        let couple_id: UUID
        let id: UUID
        let kind: String
        let payload: AnyJSON
        let updated_at: Double
        let deleted: Bool
    }

    func push(_ records: [SyncRecord], coupleID: UUID) async throws {
        guard !records.isEmpty else { return }
        let rows = try records.map { record in
            ItemRow(couple_id: coupleID, id: record.id, kind: record.kind.rawValue,
                    payload: try JSONDecoder().decode(AnyJSON.self, from: record.payload),
                    updated_at: record.updatedAt.timeIntervalSince1970, deleted: record.deleted)
        }
        try await client.from("items").upsert(rows).execute()
    }

    func pull(coupleID: UUID) async throws -> [SyncRecord] {
        let rows: [ItemRow] = try await client.from("items")
            .select()
            .eq("couple_id", value: coupleID.uuidString)
            .execute()
            .value
        return rows.compactMap { row in
            guard let kind = ItemKind(rawValue: row.kind), let payload = try? JSONEncoder().encode(row.payload) else { return nil }
            return SyncRecord(id: row.id, kind: kind, payload: payload,
                              updatedAt: Date(timeIntervalSince1970: row.updated_at), deleted: row.deleted, dirty: false)
        }
    }

    // MARK: Presencia

    private struct PresenceRow: Codable {
        let user_id: UUID
        let couple_id: UUID
        let data: AnyJSON
        let updated_at: Double
    }

    func publish(_ presence: Presence, coupleID: UUID) async throws {
        guard let userID else { return }
        let data = try JSONDecoder().decode(AnyJSON.self, from: PatoJSON.encoder.encode(presence))
        let row = PresenceRow(user_id: userID, couple_id: coupleID, data: data, updated_at: Date().timeIntervalSince1970)
        try await client.from("presence").upsert(row).execute()
    }

    func partnerPresence(coupleID: UUID) async throws -> Presence? {
        guard let userID else { return nil }
        let rows: [PresenceRow] = try await client.from("presence")
            .select()
            .eq("couple_id", value: coupleID.uuidString)
            .neq("user_id", value: userID.uuidString)
            .execute()
            .value
        guard let row = rows.first else { return nil }
        return try PatoJSON.decoder.decode(Presence.self, from: JSONEncoder().encode(row.data))
    }

    /// Emite cada vez que cambia la presencia de alguien de la pareja
    /// (la seguridad a nivel de fila limita los eventos a tu pareja).
    func presenceChanges() -> AsyncStream<Void> {
        AsyncStream { continuation in
            let channel = client.channel("presence-changes")
            let task = Task {
                let changes = channel.postgresChange(AnyAction.self, schema: "public", table: "presence")
                await channel.subscribe()
                for await _ in changes {
                    continuation.yield(())
                }
            }
            continuation.onTermination = { _ in
                task.cancel()
                Task { await channel.unsubscribe() }
            }
        }
    }

    // MARK: Fotos

    func uploadMedia(fileName: String, data: Data, coupleID: UUID) async throws {
        _ = try await client.storage.from("media")
            .upload("\(coupleID.uuidString.lowercased())/\(fileName)", data: data,
                    options: FileOptions(contentType: "image/jpeg", upsert: true))
    }

    func downloadMedia(fileName: String, coupleID: UUID) async throws -> Data {
        try await client.storage.from("media").download(path: "\(coupleID.uuidString.lowercased())/\(fileName)")
    }
}
