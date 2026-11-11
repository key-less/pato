import XCTest
@testable import PatoCore

final class PatoCoreTests: XCTestCase {
    private var calendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar
    }()

    private func day(_ year: Int, _ month: Int, _ day: Int) -> Date {
        calendar.date(from: DateComponents(year: year, month: month, day: day, hour: 12))!
    }

    // MARK: Río

    func testDistanceBetweenKnownCities() {
        let santoDomingo = GeoPoint(latitude: 18.4861, longitude: -69.9312)
        let madrid = GeoPoint(latitude: 40.4168, longitude: -3.7038)
        let km = santoDomingo.distance(to: madrid) / 1000
        XCTAssertEqual(km, 6700, accuracy: 120)
    }

    func testSeparationIsMonotonicAndBounded() {
        XCTAssertEqual(River.separation(meters: 10), 0)
        XCTAssertEqual(River.separation(meters: 50_000_000), 1)
        let near = River.separation(meters: 500)
        let mid = River.separation(meters: 50_000)
        let far = River.separation(meters: 5_000_000)
        XCTAssertTrue(0 < near && near < mid && mid < far && far < 1)
    }

    func testDistanceText() {
        XCTAssertEqual(River.distanceText(meters: 20), "Juntitos")
        XCTAssertEqual(River.distanceText(meters: 348), "350 m")
        XCTAssertEqual(River.distanceText(meters: 3_400), "3,4 km")
        XCTAssertEqual(River.distanceText(meters: 6_701_000), "6.701 km")
        XCTAssertEqual(River.phrase(meters: 20), "Nadando juntos")
        XCTAssertEqual(River.phrase(meters: 6_701_000), "Al otro lado del mundo")
    }

    // MARK: Contadores

    func testDaysTogether() {
        XCTAssertEqual(Together.days(since: day(2025, 1, 1), now: day(2025, 1, 31), calendar: calendar), 30)
        XCTAssertEqual(Together.days(since: day(2026, 1, 1), now: day(2025, 1, 1), calendar: calendar), 0)
        let parts = Together.breakdown(since: day(2024, 2, 14), now: day(2026, 5, 20), calendar: calendar)
        XCTAssertEqual(parts.years, 2)
        XCTAssertEqual(parts.months, 3)
        XCTAssertEqual(parts.days, 6)
    }

    func testYearlyDateRollsToNextYear() {
        let anniversary = SpecialDate(title: "Aniversario", date: day(2022, 3, 10), kind: .aniversario, repeatsYearly: true)
        XCTAssertEqual(Together.nextOccurrence(of: anniversary, now: day(2026, 3, 1), calendar: calendar),
                       calendar.startOfDay(for: day(2026, 3, 10)))
        XCTAssertEqual(Together.nextOccurrence(of: anniversary, now: day(2026, 3, 11), calendar: calendar),
                       calendar.startOfDay(for: day(2027, 3, 10)))
        let past = SpecialDate(title: "Cita", date: day(2020, 1, 1))
        XCTAssertNil(Together.nextOccurrence(of: past, now: day(2026, 1, 1), calendar: calendar))
        let upcoming = Together.upcoming([anniversary, past], now: day(2026, 3, 1), calendar: calendar)
        XCTAssertEqual(upcoming.count, 1)
        XCTAssertEqual(upcoming.first?.daysLeft, 9)
    }

    // MARK: Ciclo

    func testAverageCycleLengthIgnoresOutliers() {
        let logs = [day(2026, 1, 1), day(2026, 1, 31), day(2026, 3, 2), day(2026, 6, 20)].map { PeriodLog(start: $0) }
        // 30 y 30 días; el salto de 110 días se descarta.
        XCTAssertEqual(CyclePredictor.averageCycleLength(logs: logs, fallback: 28, calendar: calendar), 30)
        XCTAssertEqual(CyclePredictor.averageCycleLength(logs: [], fallback: 28, calendar: calendar), 28)
    }

    func testPhases() {
        let settings = CycleSettings(trackingEnabled: true, shareLevel: .detalle)
        let logs = [PeriodLog(start: day(2026, 5, 1))]
        func phase(_ date: Date) -> CyclePhase? {
            CyclePredictor.status(logs: logs, settings: settings, on: date, calendar: calendar)?.phase
        }
        XCTAssertEqual(phase(day(2026, 5, 1)), .menstrual)
        XCTAssertEqual(phase(day(2026, 5, 5)), .menstrual)
        XCTAssertEqual(phase(day(2026, 5, 8)), .folicular)
        XCTAssertEqual(phase(day(2026, 5, 14)), .ovulacion)
        XCTAssertEqual(phase(day(2026, 5, 19)), .lutea)
        XCTAssertEqual(phase(day(2026, 5, 26)), .premenstrual)
        XCTAssertEqual(phase(day(2026, 5, 29)), .menstrual, "día 29 = día 1 del ciclo proyectado")

        let status = CyclePredictor.status(logs: logs, settings: settings, on: day(2026, 5, 20), calendar: calendar)
        XCTAssertEqual(status?.dayOfCycle, 20)
        XCTAssertEqual(status?.daysUntilNextPeriod, 9)
        XCTAssertNil(CyclePredictor.status(logs: [], settings: settings, on: day(2026, 5, 20), calendar: calendar))
    }

    func testCycleSummaryRespectsShareLevel() {
        let logs = [PeriodLog(start: day(2026, 5, 1))]
        let date = day(2026, 5, 3)
        var settings = CycleSettings(trackingEnabled: true, shareLevel: .nada)
        XCTAssertNil(CyclePredictor.summary(logs: logs, settings: settings, on: date, calendar: calendar))
        settings.shareLevel = .fase
        let phaseOnly = CyclePredictor.summary(logs: logs, settings: settings, on: date, calendar: calendar)
        XCTAssertEqual(phaseOnly?.phase, .menstrual)
        XCTAssertNil(phaseOnly?.dayOfCycle)
        settings.shareLevel = .detalle
        XCTAssertEqual(CyclePredictor.summary(logs: logs, settings: settings, on: date, calendar: calendar)?.dayOfCycle, 3)
        settings.trackingEnabled = false
        XCTAssertNil(CyclePredictor.summary(logs: logs, settings: settings, on: date, calendar: calendar))
    }

    // MARK: Almacén

    func testStoreRoundTripAndSoftDelete() {
        var store = ItemStore()
        let letter = Letter(title: "Hola", body: "Te quiero")
        store.put(letter, id: letter.id, kind: .letter)
        XCTAssertEqual(store.all(Letter.self, kind: .letter).first?.body, "Te quiero")
        XCTAssertEqual(store.dirtyRecords.count, 1)
        store.markClean(store.dirtyRecords)
        XCTAssertTrue(store.dirtyRecords.isEmpty)
        store.remove(id: letter.id)
        XCTAssertTrue(store.all(Letter.self, kind: .letter).isEmpty)
        XCTAssertEqual(store.dirtyRecords.first?.deleted, true)
    }

    func testMergeLastWriteWins() {
        var store = ItemStore()
        let id = UUID()
        let old = Date(timeIntervalSince1970: 1_000)
        let new = Date(timeIntervalSince1970: 2_000)
        store.put(Letter(id: id, title: "local", body: ""), id: id, kind: .letter, now: new)

        let stale = SyncRecord(id: id, kind: .letter, payload: try! PatoJSON.encoder.encode(Letter(id: id, title: "viejo", body: "")), updatedAt: old)
        XCTAssertFalse(store.merge(remote: [stale]))
        XCTAssertEqual(store.get(Letter.self, id: id)?.title, "local")

        let fresh = SyncRecord(id: id, kind: .letter, payload: try! PatoJSON.encoder.encode(Letter(id: id, title: "remoto", body: "")), updatedAt: new.addingTimeInterval(5))
        XCTAssertTrue(store.merge(remote: [fresh]))
        XCTAssertEqual(store.get(Letter.self, id: id)?.title, "remoto")
        XCTAssertTrue(store.dirtyRecords.isEmpty)
    }

    func testSealedLetter() {
        let now = day(2026, 1, 1)
        XCTAssertTrue(Letter(title: "", body: "", openAt: day(2026, 2, 14)).isSealed(now: now))
        XCTAssertFalse(Letter(title: "", body: "", openAt: day(2025, 2, 14)).isSealed(now: now))
        XCTAssertFalse(Letter(title: "", body: "").isSealed(now: now))
    }
}
