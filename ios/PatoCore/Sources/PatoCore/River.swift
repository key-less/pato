import Foundation

public struct GeoPoint: Codable, Equatable, Sendable {
    public var latitude: Double
    public var longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    /// Distancia en metros (fórmula de haversine).
    public func distance(to other: GeoPoint) -> Double {
        let radius = 6_371_000.0
        let lat1 = latitude * .pi / 180
        let lat2 = other.latitude * .pi / 180
        let dLat = lat2 - lat1
        let dLon = (other.longitude - longitude) * .pi / 180
        let a = sin(dLat / 2) * sin(dLat / 2) + cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2)
        return radius * 2 * atan2(sqrt(a), sqrt(1 - a))
    }
}

/// Traduce la distancia real a "qué tan lejos nadan los patos en el río".
public enum River {
    public static let togetherThreshold = 80.0
    private static let farthest = 20_000_000.0

    /// 0 = juntitos, 1 = al otro lado del mundo. Escala logarítmica para que
    /// tanto 500 m como 5.000 km se vean distintos en un widget pequeño.
    public static func separation(meters: Double) -> Double {
        guard meters > togetherThreshold else { return 0 }
        let value = log10(meters / togetherThreshold) / log10(farthest / togetherThreshold)
        return min(1, max(0, value))
    }

    public static func distanceText(meters: Double) -> String {
        if meters < togetherThreshold { return "Juntitos" }
        if meters < 1000 { return "\(Int((meters / 10).rounded() * 10)) m" }
        let km = meters / 1000
        if km < 10 { return String(format: "%.1f km", km).replacingOccurrences(of: ".", with: ",") }
        return "\(grouped(Int(km.rounded()))) km"
    }

    public static func phrase(meters: Double) -> String {
        switch meters {
        case ..<togetherThreshold: return "Nadando juntos"
        case ..<1000: return "A un chapuzón"
        case ..<10_000: return "En el mismo estanque"
        case ..<100_000: return "Río abajo"
        case ..<1_000_000: return "En otro lago"
        default: return "Al otro lado del mundo"
        }
    }

    private static func grouped(_ value: Int) -> String {
        var digits = String(value)
        var parts: [String] = []
        while digits.count > 3 {
            parts.insert(String(digits.suffix(3)), at: 0)
            digits = String(digits.dropLast(3))
        }
        parts.insert(digits, at: 0)
        return parts.joined(separator: ".")
    }
}

/// Contadores de la relación.
public enum Together {
    public static func days(since start: Date, now: Date = Date(), calendar: Calendar = .current) -> Int {
        let from = calendar.startOfDay(for: start)
        let to = calendar.startOfDay(for: now)
        return max(0, calendar.dateComponents([.day], from: from, to: to).day ?? 0)
    }

    public static func breakdown(since start: Date, now: Date = Date(), calendar: Calendar = .current) -> (years: Int, months: Int, days: Int) {
        let parts = calendar.dateComponents([.year, .month, .day], from: calendar.startOfDay(for: start), to: calendar.startOfDay(for: now))
        return (max(0, parts.year ?? 0), max(0, parts.month ?? 0), max(0, parts.day ?? 0))
    }

    /// Próxima vez que ocurre la fecha (la misma si no se repite y aún no pasa).
    public static func nextOccurrence(of special: SpecialDate, now: Date = Date(), calendar: Calendar = .current) -> Date? {
        let today = calendar.startOfDay(for: now)
        let day = calendar.startOfDay(for: special.date)
        if !special.repeatsYearly { return day >= today ? day : nil }
        var parts = calendar.dateComponents([.month, .day], from: day)
        parts.year = calendar.component(.year, from: today)
        guard let thisYear = calendar.date(from: parts) else { return nil }
        if thisYear >= today { return thisYear }
        parts.year = (parts.year ?? 0) + 1
        return calendar.date(from: parts)
    }

    public static func upcoming(_ dates: [SpecialDate], now: Date = Date(), calendar: Calendar = .current) -> [(date: SpecialDate, when: Date, daysLeft: Int)] {
        let today = calendar.startOfDay(for: now)
        return dates.compactMap { item -> (date: SpecialDate, when: Date, daysLeft: Int)? in
            guard let when = nextOccurrence(of: item, now: now, calendar: calendar) else { return nil }
            let left = calendar.dateComponents([.day], from: today, to: when).day ?? 0
            return (item, when, left)
        }
        .sorted { $0.when < $1.when }
    }
}
