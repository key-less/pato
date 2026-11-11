import Foundation

/// Lo que la app deja en el App Group para que los widgets lo dibujen.
public struct WidgetSnapshot: Codable, Equatable, Sendable {
    public static let appGroup = "group.com.keyless.pato"
    public static let defaultsKey = "widget.snapshot"

    public var myName: String
    public var partnerName: String
    public var metSince: Date?
    public var distanceMeters: Double?
    public var distanceUpdatedAt: Date?
    public var partnerMood: Mood?
    public var partnerSong: String?
    public var nextDateTitle: String?
    public var nextDate: Date?

    public init(myName: String = "", partnerName: String = "", metSince: Date? = nil, distanceMeters: Double? = nil,
                distanceUpdatedAt: Date? = nil, partnerMood: Mood? = nil, partnerSong: String? = nil,
                nextDateTitle: String? = nil, nextDate: Date? = nil) {
        self.myName = myName
        self.partnerName = partnerName
        self.metSince = metSince
        self.distanceMeters = distanceMeters
        self.distanceUpdatedAt = distanceUpdatedAt
        self.partnerMood = partnerMood
        self.partnerSong = partnerSong
        self.nextDateTitle = nextDateTitle
        self.nextDate = nextDate
    }

    public static let preview = WidgetSnapshot(myName: "Kevin", partnerName: "Mi pato",
                                               metSince: Date(timeIntervalSinceNow: -86_400 * 432),
                                               distanceMeters: 3_400, distanceUpdatedAt: Date(),
                                               partnerMood: .enamorado, partnerSong: "Nuestra canción",
                                               nextDateTitle: "Aniversario", nextDate: Date(timeIntervalSinceNow: 86_400 * 12))

    public static func load(defaults: UserDefaults? = UserDefaults(suiteName: appGroup)) -> WidgetSnapshot? {
        guard let data = defaults?.data(forKey: defaultsKey) else { return nil }
        return try? PatoJSON.decoder.decode(WidgetSnapshot.self, from: data)
    }

    public func save(defaults: UserDefaults? = UserDefaults(suiteName: appGroup)) {
        guard let data = try? PatoJSON.encoder.encode(self) else { return }
        defaults?.set(data, forKey: WidgetSnapshot.defaultsKey)
    }
}
