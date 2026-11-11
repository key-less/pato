import Foundation
import HealthKit

/// Lee de Salud (Apple Health) los días de sangrado del último año y devuelve
/// el inicio de cada periodo. Flo, Clue y la app Salud escriben ahí si la
/// persona activa esa sincronización en su teléfono.
enum HealthCycleImporter {
    static var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    static func periodStarts() async throws -> [Date] {
        let store = HKHealthStore()
        let type = HKCategoryType(.menstrualFlow)
        try await store.requestAuthorization(toShare: [], read: [type])
        let calendar = Calendar.current
        let from = calendar.date(byAdding: .year, value: -1, to: Date())
        let predicate = HKQuery.predicateForSamples(withStart: from, end: Date())
        let samples: [HKCategorySample] = try await withCheckedThrowingContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit,
                                      sortDescriptors: [sort]) { _, results, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: (results as? [HKCategorySample]) ?? [])
                }
            }
            store.execute(query)
        }
        // El valor 5 significa "sin sangrado"; un hueco de más de 10 días
        // entre muestras marca el inicio de un periodo nuevo.
        var starts: [Date] = []
        var previous: Date?
        for sample in samples where sample.value != 5 {
            let day = calendar.startOfDay(for: sample.startDate)
            if let previous, (calendar.dateComponents([.day], from: previous, to: day).day ?? 0) <= 10 {
                // mismo periodo
            } else {
                starts.append(day)
            }
            previous = day
        }
        return starts
    }
}
