import Foundation

// MARK: - Recuerdos, fechas y cartas (se sincronizan entre la pareja)

public struct Memory: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var fileName: String
    public var caption: String
    public var date: Date
    public var isFavorite: Bool

    public init(id: UUID = UUID(), fileName: String, caption: String = "", date: Date = Date(), isFavorite: Bool = false) {
        self.id = id
        self.fileName = fileName
        self.caption = caption
        self.date = date
        self.isFavorite = isFavorite
    }
}

public enum SpecialDateKind: String, Codable, CaseIterable, Sendable {
    case cita, aniversario, cumple, hito

    public var label: String {
        switch self {
        case .cita: return "Cita"
        case .aniversario: return "Aniversario"
        case .cumple: return "Cumpleaños"
        case .hito: return "Momento especial"
        }
    }

    public var symbol: String {
        switch self {
        case .cita: return "fork.knife"
        case .aniversario: return "heart.fill"
        case .cumple: return "birthday.cake.fill"
        case .hito: return "star.fill"
        }
    }
}

public struct SpecialDate: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var title: String
    public var date: Date
    public var kind: SpecialDateKind
    public var place: String
    public var note: String
    public var repeatsYearly: Bool

    public init(id: UUID = UUID(), title: String, date: Date, kind: SpecialDateKind = .cita,
                place: String = "", note: String = "", repeatsYearly: Bool = false) {
        self.id = id
        self.title = title
        self.date = date
        self.kind = kind
        self.place = place
        self.note = note
        self.repeatsYearly = repeatsYearly
    }
}

public struct Letter: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var title: String
    public var body: String
    public var createdAt: Date
    public var authorProfileID: UUID?
    /// Si tiene fecha, la carta queda "sellada" hasta ese día (cápsula del tiempo).
    public var openAt: Date?

    public init(id: UUID = UUID(), title: String, body: String, createdAt: Date = Date(),
                authorProfileID: UUID? = nil, openAt: Date? = nil) {
        self.id = id
        self.title = title
        self.body = body
        self.createdAt = createdAt
        self.authorProfileID = authorProfileID
        self.openAt = openAt
    }

    public func isSealed(now: Date = Date()) -> Bool {
        guard let openAt else { return false }
        return openAt > now
    }
}

public struct PartnerProfile: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var birthday: Date?
    public var favoriteColor: String
    public var favoriteFood: String
    public var favoritePlace: String
    public var whatILoveMost: String

    public init(id: UUID = UUID(), name: String = "", birthday: Date? = nil, favoriteColor: String = "",
                favoriteFood: String = "", favoritePlace: String = "", whatILoveMost: String = "") {
        self.id = id
        self.name = name
        self.birthday = birthday
        self.favoriteColor = favoriteColor
        self.favoriteFood = favoriteFood
        self.favoritePlace = favoritePlace
        self.whatILoveMost = whatILoveMost
    }
}

public struct CoupleInfo: Codable, Equatable, Sendable {
    /// Identificador fijo: solo existe un registro de pareja por pareja.
    public static let recordID = UUID(uuidString: "00000000-0000-4000-8000-00000000C0DE")!

    public var metSince: Date?
    public var status: String

    public init(metSince: Date? = nil, status: String = "Somos pareja") {
        self.metSince = metSince
        self.status = status
    }

    public static let statuses = ["Conociéndonos", "Se va poniendo serio", "Ya casi", "Somos pareja", "Comprometidos", "Estamos casados"]
}

// MARK: - Estado de ánimo

public enum Mood: String, Codable, CaseIterable, Sendable {
    case feliz, enamorado, tranquilo, jugueton, cansado, triste, enojado, ansioso, enfermo, colicos, hambriento, estresado

    public var label: String {
        switch self {
        case .feliz: return "Feliz"
        case .enamorado: return "Enamorado"
        case .tranquilo: return "Tranquilo"
        case .jugueton: return "Juguetón"
        case .cansado: return "Cansado"
        case .triste: return "Triste"
        case .enojado: return "Enojado"
        case .ansioso: return "Ansioso"
        case .enfermo: return "Enfermo"
        case .colicos: return "Con cólicos"
        case .hambriento: return "Con hambre"
        case .estresado: return "Estresado"
        }
    }

    public var assetName: String { "duck-mood-\(rawValue)" }

    /// Sugerencia que ve la pareja cuando el otro publica este estado.
    public var partnerTip: String {
        switch self {
        case .feliz: return "Está de buenas: buen momento para planear algo juntos."
        case .enamorado: return "Te tiene en la cabeza. Mándale algo bonito."
        case .tranquilo: return "Todo en calma en el estanque."
        case .jugueton: return "Anda con ganas de bromear. Síguele el juego."
        case .cansado: return "Necesita descanso. Ofrece ayuda con algo pequeño."
        case .triste: return "Un mensaje cariñoso o una llamada puede ayudar mucho."
        case .enojado: return "Dale espacio y escucha antes de responder."
        case .ansioso: return "Acompaña con calma; pregunta qué necesita."
        case .enfermo: return "Pregunta si necesita medicina, sopa o compañía."
        case .colicos: return "Calorcito, su snack favorito y mucha paciencia."
        case .hambriento: return "Hora de comer. ¿Le pides algo?"
        case .estresado: return "Quítale un pendiente de encima si puedes."
        }
    }
}

// MARK: - Presencia (lo que cada quien comparte en vivo)

public struct NowPlaying: Codable, Equatable, Sendable {
    public var title: String
    public var artist: String
    public var artworkURL: String?
    public var source: String
    public var isPlaying: Bool

    public init(title: String, artist: String, artworkURL: String? = nil, source: String = "spotify", isPlaying: Bool = true) {
        self.title = title
        self.artist = artist
        self.artworkURL = artworkURL
        self.source = source
        self.isPlaying = isPlaying
    }
}

public struct Presence: Codable, Equatable, Sendable {
    public var latitude: Double?
    public var longitude: Double?
    public var locationUpdatedAt: Date?
    public var sharingLocation: Bool
    public var mood: Mood?
    public var moodNote: String
    public var moodUpdatedAt: Date?
    public var nowPlaying: NowPlaying?
    public var cycle: CycleSummary?
    public var displayName: String

    public init(latitude: Double? = nil, longitude: Double? = nil, locationUpdatedAt: Date? = nil,
                sharingLocation: Bool = false, mood: Mood? = nil, moodNote: String = "", moodUpdatedAt: Date? = nil,
                nowPlaying: NowPlaying? = nil, cycle: CycleSummary? = nil, displayName: String = "") {
        self.latitude = latitude
        self.longitude = longitude
        self.locationUpdatedAt = locationUpdatedAt
        self.sharingLocation = sharingLocation
        self.mood = mood
        self.moodNote = moodNote
        self.moodUpdatedAt = moodUpdatedAt
        self.nowPlaying = nowPlaying
        self.cycle = cycle
        self.displayName = displayName
    }

    public var coordinate: GeoPoint? {
        guard sharingLocation, let latitude, let longitude else { return nil }
        return GeoPoint(latitude: latitude, longitude: longitude)
    }
}
