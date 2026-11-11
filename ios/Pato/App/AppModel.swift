import Foundation
import CoreLocation
import Observation
import WidgetKit
import PatoCore

/// Estado local que no se comparte tal cual con la pareja.
struct LocalState: Codable {
    var onboarded = false
    var myProfileID = UUID()
    var cycle = CycleSettings()
    var periodLogs: [PeriodLog] = []
    var myPresence = Presence()
    var partnerPresence: Presence?
    var coupleID: UUID?
    var inviteCode: String?
    var uploadedMedia: Set<String> = []
}

@MainActor
@Observable
final class AppModel {
    private(set) var store = ItemStore()
    private(set) var local = LocalState()
    private(set) var signedInEmail: String?
    private(set) var isSyncing = false
    private(set) var spotifyConnected = false
    private(set) var locationStatus: CLAuthorizationStatus = .notDetermined
    var lastError: String?

    @ObservationIgnored let backend = Backend.makeFromBundle()
    @ObservationIgnored let spotify = SpotifyService.makeFromBundle()
    @ObservationIgnored private let location = LocationService()
    @ObservationIgnored private var liveTask: Task<Void, Never>?
    @ObservationIgnored private var pollTask: Task<Void, Never>?
    @ObservationIgnored private var syncRequestedAgain = false
    @ObservationIgnored private var lastPublishedLocation: CLLocation?

    init() {
        load()
        signedInEmail = backend?.email
        spotifyConnected = spotify?.isConnected ?? false
        locationStatus = location.status
        location.onLocation = { [weak self] place in
            Task { @MainActor in self?.handle(location: place) }
        }
        location.onAuthorizationChange = { [weak self] status in
            Task { @MainActor in self?.locationStatus = status }
        }
        if local.myPresence.sharingLocation {
            location.start()
        }
    }

    // MARK: - Lecturas

    var hasBackend: Bool { backend != nil }
    var isPaired: Bool { local.coupleID != nil }

    var memories: [Memory] {
        store.all(Memory.self, kind: .memory).sorted { $0.date > $1.date }
    }

    var specialDates: [SpecialDate] {
        store.all(SpecialDate.self, kind: .specialDate).sorted { $0.date > $1.date }
    }

    var letters: [Letter] {
        store.all(Letter.self, kind: .letter).sorted { $0.createdAt > $1.createdAt }
    }

    var couple: CoupleInfo {
        store.get(CoupleInfo.self, id: CoupleInfo.recordID) ?? CoupleInfo()
    }

    var myProfile: PartnerProfile {
        store.get(PartnerProfile.self, id: local.myProfileID) ?? PartnerProfile(id: local.myProfileID)
    }

    var partnerProfile: PartnerProfile? {
        store.all(PartnerProfile.self, kind: .profile).first { $0.id != local.myProfileID }
    }

    var partnerName: String {
        let name = partnerProfile?.name ?? local.partnerPresence?.displayName ?? ""
        return name.isEmpty ? "Tu pato" : name
    }

    var partner: Presence? { local.partnerPresence }
    var me: Presence { local.myPresence }

    var distanceMeters: Double? {
        guard let mine = local.myPresence.coordinate, let theirs = local.partnerPresence?.coordinate else { return nil }
        return mine.distance(to: theirs)
    }

    var cycleStatus: CycleStatus? {
        guard local.cycle.trackingEnabled else { return nil }
        return CyclePredictor.status(logs: local.periodLogs, settings: local.cycle)
    }

    var upcomingDates: [(date: SpecialDate, when: Date, daysLeft: Int)] {
        Together.upcoming(specialDates)
    }

    // MARK: - Escrituras compartidas

    func completeOnboarding(name: String, metSince: Date?) {
        var profile = myProfile
        profile.name = name
        store.put(profile, id: profile.id, kind: .profile)
        if let metSince {
            var info = couple
            info.metSince = metSince
            store.put(info, id: CoupleInfo.recordID, kind: .couple)
        }
        local.onboarded = true
        local.myPresence.displayName = name
        changed()
    }

    func save(profile: PartnerProfile) {
        store.put(profile, id: profile.id, kind: .profile)
        if profile.id == local.myProfileID {
            local.myPresence.displayName = profile.name
        }
        changed()
    }

    func save(couple info: CoupleInfo) {
        store.put(info, id: CoupleInfo.recordID, kind: .couple)
        changed()
    }

    func addPhoto(data: Data, date: Date = Date()) {
        guard let fileName = MediaStore.save(imageData: data) else {
            lastError = "No se pudo guardar la foto."
            return
        }
        let memory = Memory(fileName: fileName, date: date)
        store.put(memory, id: memory.id, kind: .memory)
        changed()
    }

    func save(memory: Memory) {
        store.put(memory, id: memory.id, kind: .memory)
        changed()
    }

    func delete(memory: Memory) {
        store.remove(id: memory.id)
        MediaStore.delete(memory.fileName)
        changed()
    }

    func save(date: SpecialDate) {
        store.put(date, id: date.id, kind: .specialDate)
        changed()
    }

    func delete(date: SpecialDate) {
        store.remove(id: date.id)
        changed()
    }

    func save(letter: Letter) {
        var copy = letter
        if copy.authorProfileID == nil { copy.authorProfileID = local.myProfileID }
        store.put(copy, id: copy.id, kind: .letter)
        changed()
    }

    func delete(letter: Letter) {
        store.remove(id: letter.id)
        changed()
    }

    // MARK: - Ánimo y ciclo

    func setMood(_ mood: Mood?, note: String) {
        local.myPresence.mood = mood
        local.myPresence.moodNote = note
        local.myPresence.moodUpdatedAt = mood == nil ? nil : Date()
        changed()
    }

    func updateCycle(_ settings: CycleSettings) {
        local.cycle = settings
        refreshCycleSummary()
        changed()
    }

    func logPeriod(start: Date) {
        let day = Calendar.current.startOfDay(for: start)
        guard !local.periodLogs.contains(where: { Calendar.current.isDate($0.start, inSameDayAs: day) }) else { return }
        local.periodLogs.append(PeriodLog(start: day))
        local.periodLogs.sort { $0.start < $1.start }
        refreshCycleSummary()
        changed()
    }

    func deletePeriod(_ log: PeriodLog) {
        local.periodLogs.removeAll { $0.id == log.id }
        refreshCycleSummary()
        changed()
    }

    func importPeriodsFromHealth() async {
        do {
            let starts = try await HealthCycleImporter.periodStarts()
            if starts.isEmpty {
                lastError = "Salud no tiene periodos registrados o no diste permiso de lectura."
            }
            for start in starts { logPeriod(start: start) }
        } catch {
            lastError = "No se pudo leer Salud: \(error.localizedDescription)"
        }
    }

    private func refreshCycleSummary() {
        local.myPresence.cycle = CyclePredictor.summary(logs: local.periodLogs, settings: local.cycle)
    }

    // MARK: - Ubicación

    func setSharingLocation(_ enabled: Bool) {
        local.myPresence.sharingLocation = enabled
        if enabled {
            location.start()
        } else {
            location.stop()
            local.myPresence.latitude = nil
            local.myPresence.longitude = nil
            local.myPresence.locationUpdatedAt = nil
            lastPublishedLocation = nil
        }
        changed()
    }

    private func handle(location place: CLLocation) {
        guard local.myPresence.sharingLocation else { return }
        if let last = lastPublishedLocation, place.distance(from: last) < 60,
           place.timestamp.timeIntervalSince(last.timestamp) < 300 { return }
        lastPublishedLocation = place
        local.myPresence.latitude = place.coordinate.latitude
        local.myPresence.longitude = place.coordinate.longitude
        local.myPresence.locationUpdatedAt = place.timestamp
        saveToDisk()
        refreshWidget()
        // Un cambio de ubicación despierta la app en segundo plano: aprovechamos
        // para refrescar también música y datos de la pareja.
        Task { await refreshLive() }
    }

    // MARK: - Música

    func connectSpotify() async {
        guard let spotify else { return }
        do {
            try await spotify.connect()
            spotifyConnected = true
            await refreshLive()
        } catch {
            lastError = "No se pudo conectar Spotify."
        }
    }

    func disconnectSpotify() {
        spotify?.disconnect()
        spotifyConnected = false
        local.myPresence.nowPlaying = nil
        changed()
    }

    // MARK: - Cuenta y pareja

    func sendLoginCode(email: String) async -> Bool {
        guard let backend else { return false }
        do {
            try await backend.sendCode(to: email)
            return true
        } catch {
            lastError = "No se pudo enviar el código: \(error.localizedDescription)"
            return false
        }
    }

    func verifyLogin(email: String, code: String) async {
        guard let backend else { return }
        do {
            try await backend.verify(email: email, code: code)
            signedInEmail = backend.email
            try await refreshCouple()
            await syncNow()
        } catch {
            lastError = "Código incorrecto o vencido."
        }
    }

    func signOut() async {
        await backend?.signOut()
        signedInEmail = nil
        local.coupleID = nil
        local.inviteCode = nil
        local.partnerPresence = nil
        stopLive()
        changed()
    }

    func createCouple() async {
        guard let backend else { return }
        do {
            try await backend.createCouple()
            try await refreshCouple()
            await syncNow()
        } catch {
            lastError = "No se pudo crear el estanque: \(error.localizedDescription)"
        }
    }

    func joinCouple(code: String) async {
        guard let backend else { return }
        do {
            try await backend.joinCouple(code: code.trimmingCharacters(in: .whitespacesAndNewlines))
            try await refreshCouple()
            await syncNow()
        } catch {
            lastError = "Ese código no existe o el estanque ya tiene dos patos."
        }
    }

    func leaveCouple() async {
        guard let backend else { return }
        do {
            try await backend.leaveCouple()
            local.coupleID = nil
            local.inviteCode = nil
            local.partnerPresence = nil
            stopLive()
            changed()
        } catch {
            lastError = "No se pudo salir del estanque."
        }
    }

    private func refreshCouple() async throws {
        guard let backend else { return }
        let previous = local.coupleID
        local.coupleID = try await backend.currentCoupleID()
        if let coupleID = local.coupleID {
            local.inviteCode = try await backend.inviteCode(coupleID: coupleID)
            if previous != coupleID {
                // Estanque nuevo: todo lo local se sube de nuevo.
                store.markAllDirty()
                local.uploadedMedia = []
            }
        } else {
            local.inviteCode = nil
        }
        saveToDisk()
    }

    // MARK: - Sincronización

    /// Se llama al abrir la app y al volver a primer plano.
    func appBecameActive() async {
        refreshCycleSummary()
        if backend != nil, signedInEmail != nil {
            try? await refreshCouple()
        }
        await syncNow()
        startLive()
    }

    func appWentToBackground() {
        stopLive()
    }

    func syncNow() async {
        guard !isSyncing else {
            syncRequestedAgain = true
            return
        }
        isSyncing = true
        repeat {
            syncRequestedAgain = false
            await syncItems()
            await refreshLive()
        } while syncRequestedAgain
        isSyncing = false
    }

    private func syncItems() async {
        guard let backend, signedInEmail != nil, let coupleID = local.coupleID else { return }
        do {
            // 1. Fotos pendientes de subir.
            for memory in memories where !local.uploadedMedia.contains(memory.fileName) {
                guard let data = MediaStore.data(for: memory.fileName) else { continue }
                try await backend.uploadMedia(fileName: memory.fileName, data: data, coupleID: coupleID)
                local.uploadedMedia.insert(memory.fileName)
            }
            // 2. Subir cambios locales.
            let pending = store.dirtyRecords
            try await backend.push(pending, coupleID: coupleID)
            store.markClean(pending)
            // 3. Traer lo de la pareja (gana la última escritura).
            store.merge(remote: try await backend.pull(coupleID: coupleID))
            // 4. Descargar fotos que aún no están en este teléfono.
            for memory in memories where !MediaStore.exists(memory.fileName) {
                if let data = try? await backend.downloadMedia(fileName: memory.fileName, coupleID: coupleID) {
                    MediaStore.write(data, fileName: memory.fileName)
                    local.uploadedMedia.insert(memory.fileName)
                }
            }
        } catch {
            lastError = "Sin conexión con el estanque. Tus cambios se guardan aquí y se suben después."
        }
    }

    /// Publica mi presencia y lee la de mi pareja.
    func refreshLive() async {
        if let spotify, spotifyConnected {
            local.myPresence.nowPlaying = await spotify.nowPlaying()
        }
        if let backend, signedInEmail != nil, let coupleID = local.coupleID {
            try? await backend.publish(local.myPresence, coupleID: coupleID)
            if let theirs = try? await backend.partnerPresence(coupleID: coupleID) {
                local.partnerPresence = theirs
            }
        }
        saveToDisk()
        refreshWidget()
    }

    private func startLive() {
        guard liveTask == nil, let backend, signedInEmail != nil, local.coupleID != nil else { return }
        liveTask = Task { [weak self] in
            for await _ in backend.presenceChanges() {
                await self?.readPartner()
            }
        }
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(30))
                if Task.isCancelled { break }
                await self?.refreshLive()
            }
        }
    }

    private func stopLive() {
        liveTask?.cancel()
        liveTask = nil
        pollTask?.cancel()
        pollTask = nil
    }

    private func readPartner() async {
        guard let backend, let coupleID = local.coupleID,
              let theirs = try? await backend.partnerPresence(coupleID: coupleID) else { return }
        local.partnerPresence = theirs
        saveToDisk()
        refreshWidget()
    }

    private func changed() {
        saveToDisk()
        refreshWidget()
        Task { await syncNow() }
    }

    // MARK: - Widget

    private func refreshWidget() {
        let next = upcomingDates.first
        let song = local.partnerPresence?.nowPlaying.map { "\($0.title) · \($0.artist)" }
        let snapshot = WidgetSnapshot(myName: myProfile.name, partnerName: partnerName, metSince: couple.metSince,
                                      distanceMeters: distanceMeters,
                                      distanceUpdatedAt: local.partnerPresence?.locationUpdatedAt,
                                      partnerMood: local.partnerPresence?.mood, partnerSong: song,
                                      nextDateTitle: next?.date.title, nextDate: next?.when)
        guard snapshot != WidgetSnapshot.load() else { return }
        snapshot.save()
        WidgetCenter.shared.reloadAllTimelines()
    }

    // MARK: - Disco

    private static var folder: URL {
        let url = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    private func load() {
        if let data = try? Data(contentsOf: Self.folder.appendingPathComponent("items.json")),
           let saved = try? PatoJSON.decoder.decode(ItemStore.self, from: data) {
            store = saved
        }
        if let data = try? Data(contentsOf: Self.folder.appendingPathComponent("local.json")),
           let saved = try? PatoJSON.decoder.decode(LocalState.self, from: data) {
            local = saved
        }
    }

    private func saveToDisk() {
        if let data = try? PatoJSON.encoder.encode(store) {
            try? data.write(to: Self.folder.appendingPathComponent("items.json"), options: .atomic)
        }
        if let data = try? PatoJSON.encoder.encode(local) {
            try? data.write(to: Self.folder.appendingPathComponent("local.json"), options: .atomic)
        }
    }
}
