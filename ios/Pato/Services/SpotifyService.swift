import Foundation
import AuthenticationServices
import CryptoKit
import UIKit
import PatoCore

/// Spotify sin servidor: OAuth con PKCE desde el teléfono y consulta de
/// "lo que suena ahora". El token de refresco se guarda en el llavero.
@MainActor
final class SpotifyService: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let redirectURI = "pato://spotify-callback"
    private let clientID: String
    private var accessToken: String?
    private var expiresAt = Date.distantPast
    private var session: ASWebAuthenticationSession?

    static func makeFromBundle() -> SpotifyService? {
        guard let id = (Bundle.main.infoDictionary?["SpotifyClientID"] as? String)?.trimmingCharacters(in: .whitespaces),
              !id.isEmpty else { return nil }
        return SpotifyService(clientID: id)
    }

    init(clientID: String) {
        self.clientID = clientID
    }

    var isConnected: Bool { Keychain.read("spotify.refresh") != nil }

    func disconnect() {
        Keychain.delete("spotify.refresh")
        accessToken = nil
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap(\.windows).first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }

    func connect() async throws {
        let verifier = Self.randomString(length: 64)
        let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64URLEncoded
        var components = URLComponents(string: "https://accounts.spotify.com/authorize")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "redirect_uri", value: Self.redirectURI),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "scope", value: "user-read-currently-playing user-read-playback-state"),
        ]
        let authURL = components.url!
        let callback: URL = try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: "pato") { url, error in
                if let url {
                    continuation.resume(returning: url)
                } else {
                    continuation.resume(throwing: error ?? URLError(.userCancelledAuthentication))
                }
            }
            session.presentationContextProvider = self
            self.session = session
            session.start()
        }
        session = nil
        guard let code = URLComponents(url: callback, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "code" })?.value else {
            throw URLError(.badServerResponse)
        }
        try await requestToken([
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": Self.redirectURI,
            "client_id": clientID,
            "code_verifier": verifier,
        ])
    }

    /// `nil` si no hay nada sonando o no está conectado.
    func nowPlaying() async -> NowPlaying? {
        guard isConnected, let token = try? await validToken() else { return nil }
        var request = URLRequest(url: URL(string: "https://api.spotify.com/v1/me/player/currently-playing")!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let payload = try? JSONDecoder().decode(CurrentlyPlaying.self, from: data),
              let item = payload.item, payload.is_playing else { return nil }
        return NowPlaying(title: item.name,
                          artist: item.artists.map(\.name).joined(separator: ", "),
                          artworkURL: item.album?.images.first?.url,
                          source: "spotify", isPlaying: true)
    }

    // MARK: Tokens

    private struct TokenResponse: Decodable {
        let access_token: String
        let expires_in: Double
        let refresh_token: String?
    }

    private struct CurrentlyPlaying: Decodable {
        struct Item: Decodable {
            struct Artist: Decodable { let name: String }
            struct Album: Decodable {
                struct Cover: Decodable { let url: String }
                let images: [Cover]
            }
            let name: String
            let artists: [Artist]
            let album: Album?
        }
        let is_playing: Bool
        let item: Item?
    }

    private func validToken() async throws -> String {
        if let accessToken, expiresAt > Date().addingTimeInterval(60) { return accessToken }
        guard let refresh = Keychain.read("spotify.refresh") else { throw URLError(.userAuthenticationRequired) }
        try await requestToken(["grant_type": "refresh_token", "refresh_token": refresh, "client_id": clientID])
        guard let accessToken else { throw URLError(.userAuthenticationRequired) }
        return accessToken
    }

    private func requestToken(_ form: [String: String]) async throws {
        var request = URLRequest(url: URL(string: "https://accounts.spotify.com/api/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        var body = URLComponents()
        body.queryItems = form.map { URLQueryItem(name: $0.key, value: $0.value) }
        request.httpBody = Data((body.percentEncodedQuery ?? "").utf8)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.userAuthenticationRequired) }
        let token = try JSONDecoder().decode(TokenResponse.self, from: data)
        accessToken = token.access_token
        expiresAt = Date().addingTimeInterval(token.expires_in)
        if let refresh = token.refresh_token {
            Keychain.save(refresh, for: "spotify.refresh")
        }
    }

    private static func randomString(length: Int) -> String {
        let alphabet = Array("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        var generator = SystemRandomNumberGenerator()
        return String((0..<length).map { _ in alphabet.randomElement(using: &generator)! })
    }
}

private extension Data {
    var base64URLEncoded: String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

enum Keychain {
    private static let service = "com.keyless.pato"

    static func save(_ value: String, for key: String) {
        delete(key)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: Data(value.utf8),
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    static func read(_ key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func delete(_ key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
