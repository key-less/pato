import Foundation

/// Registro de un periodo. Vive solo en el dispositivo de quien lo registra:
/// a la pareja únicamente se le comparte un `CycleSummary`, y solo si se activa.
public struct PeriodLog: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var start: Date

    public init(id: UUID = UUID(), start: Date) {
        self.id = id
        self.start = start
    }
}

public enum CyclePhase: String, Codable, CaseIterable, Sendable {
    case menstrual, folicular, ovulacion, lutea, premenstrual

    public var label: String {
        switch self {
        case .menstrual: return "Menstruación"
        case .folicular: return "Fase folicular"
        case .ovulacion: return "Ovulación"
        case .lutea: return "Fase lútea"
        case .premenstrual: return "Días premenstruales"
        }
    }

    public var partnerTip: String {
        switch self {
        case .menstrual: return "Puede haber cólicos y cansancio. Calorcito, antojos y cero presión."
        case .folicular: return "Suele subir la energía: buen momento para planes y citas."
        case .ovulacion: return "Energía y ánimo en su punto más alto."
        case .lutea: return "La energía empieza a bajar. Planes tranquilos."
        case .premenstrual: return "Puede haber más sensibilidad. Paciencia, mimos y su snack favorito."
        }
    }
}

public enum CycleShareLevel: String, Codable, CaseIterable, Sendable {
    case nada, fase, detalle

    public var label: String {
        switch self {
        case .nada: return "No compartir"
        case .fase: return "Solo la fase"
        case .detalle: return "Fase y días"
        }
    }
}

public struct CycleSettings: Codable, Equatable, Sendable {
    public var trackingEnabled: Bool
    public var shareLevel: CycleShareLevel
    public var defaultCycleLength: Int
    public var periodLength: Int

    public init(trackingEnabled: Bool = false, shareLevel: CycleShareLevel = .nada,
                defaultCycleLength: Int = 28, periodLength: Int = 5) {
        self.trackingEnabled = trackingEnabled
        self.shareLevel = shareLevel
        self.defaultCycleLength = defaultCycleLength
        self.periodLength = periodLength
    }
}

/// Lo único del ciclo que viaja al teléfono de la pareja.
public struct CycleSummary: Codable, Equatable, Sendable {
    public var phase: CyclePhase
    public var dayOfCycle: Int?
    public var daysUntilNextPeriod: Int?

    public init(phase: CyclePhase, dayOfCycle: Int? = nil, daysUntilNextPeriod: Int? = nil) {
        self.phase = phase
        self.dayOfCycle = dayOfCycle
        self.daysUntilNextPeriod = daysUntilNextPeriod
    }
}

public struct CycleStatus: Equatable, Sendable {
    public var phase: CyclePhase
    public var dayOfCycle: Int
    public var cycleLength: Int
    public var nextPeriod: Date
    public var daysUntilNextPeriod: Int
}

/// Estimación sencilla basada en promedios. Es orientativa: no sirve como
/// método anticonceptivo ni sustituye consejo médico.
public enum CyclePredictor {
    public static func averageCycleLength(logs: [PeriodLog], fallback: Int, calendar: Calendar = .current) -> Int {
        let starts = logs.map { calendar.startOfDay(for: $0.start) }.sorted()
        guard starts.count >= 2 else { return fallback }
        var gaps: [Int] = []
        for index in 1..<starts.count {
            let days = calendar.dateComponents([.day], from: starts[index - 1], to: starts[index]).day ?? 0
            if (15...60).contains(days) { gaps.append(days) }
        }
        let recent = gaps.suffix(6)
        guard !recent.isEmpty else { return fallback }
        return Int((Double(recent.reduce(0, +)) / Double(recent.count)).rounded())
    }

    public static func status(logs: [PeriodLog], settings: CycleSettings, on date: Date = Date(),
                              calendar: Calendar = .current) -> CycleStatus? {
        let today = calendar.startOfDay(for: date)
        let starts = logs.map { calendar.startOfDay(for: $0.start) }.filter { $0 <= today }.sorted()
        guard let last = starts.last else { return nil }
        let length = max(15, averageCycleLength(logs: logs, fallback: settings.defaultCycleLength, calendar: calendar))
        let elapsed = calendar.dateComponents([.day], from: last, to: today).day ?? 0
        // Si pasó más de un ciclo sin registro, proyectamos los ciclos siguientes.
        let dayOfCycle = (elapsed % length) + 1
        let daysUntil = length - dayOfCycle + 1
        let next = calendar.date(byAdding: .day, value: daysUntil, to: today) ?? today
        return CycleStatus(phase: phase(day: dayOfCycle, cycleLength: length, periodLength: settings.periodLength),
                           dayOfCycle: dayOfCycle, cycleLength: length, nextPeriod: next, daysUntilNextPeriod: daysUntil)
    }

    public static func phase(day: Int, cycleLength: Int, periodLength: Int) -> CyclePhase {
        let ovulation = cycleLength - 14
        if day <= periodLength { return .menstrual }
        if day > cycleLength - 5 { return .premenstrual }
        if abs(day - ovulation) <= 1 { return .ovulacion }
        if day < ovulation { return .folicular }
        return .lutea
    }

    public static func summary(logs: [PeriodLog], settings: CycleSettings, on date: Date = Date(),
                               calendar: Calendar = .current) -> CycleSummary? {
        guard settings.trackingEnabled, settings.shareLevel != .nada,
              let status = status(logs: logs, settings: settings, on: date, calendar: calendar) else { return nil }
        switch settings.shareLevel {
        case .nada: return nil
        case .fase: return CycleSummary(phase: status.phase)
        case .detalle: return CycleSummary(phase: status.phase, dayOfCycle: status.dayOfCycle,
                                           daysUntilNextPeriod: status.daysUntilNextPeriod)
        }
    }
}
