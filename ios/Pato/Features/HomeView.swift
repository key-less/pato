import SwiftUI
import PatoCore

struct HomeView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        NavigationStack {
            PondScreen {
                header
                counterCard
                riverCard
                partnerCard
                nextDateCard
            }
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await model.syncNow() }
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            DuckImage(name: "duck-logo", size: 52)
            VStack(alignment: .leading, spacing: 2) {
                Text("Hola, \(model.myProfile.name.isEmpty ? "pato" : model.myProfile.name)")
                    .font(.title2.weight(.heavy))
                    .foregroundStyle(Palette.ink)
                Text(Date().formatted(.dateTime.weekday(.wide).day().month(.wide)))
                    .font(.subheadline)
                    .foregroundStyle(Palette.muted)
            }
            Spacer()
        }
        .padding(.top, 6)
    }

    @ViewBuilder
    private var counterCard: some View {
        Card {
            if let since = model.couple.metSince {
                let parts = Together.breakdown(since: since)
                HStack(alignment: .center, spacing: 14) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(Together.days(since: since))")
                            .font(.system(size: 52, weight: .heavy, design: .rounded))
                            .foregroundStyle(Palette.coral)
                            .contentTransition(.numericText())
                        Text("días juntos")
                            .font(.headline)
                            .foregroundStyle(Palette.ink)
                        Text("\(parts.years) a · \(parts.months) m · \(parts.days) d  ·  \(model.couple.status)")
                            .font(.footnote)
                            .foregroundStyle(Palette.muted)
                    }
                    Spacer()
                    DuckImage(name: "duck-pareja", size: 92)
                }
            } else {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("¿Desde cuándo están juntos?").font(.headline).foregroundStyle(Palette.ink)
                        Text("Agrega la fecha en Nosotros para ver su contador.")
                            .font(.subheadline).foregroundStyle(Palette.muted)
                    }
                    Spacer()
                    DuckImage(name: "duck-pareja", size: 72)
                }
            }
        }
    }

    private var riverCard: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                SectionTitle(text: "El río", duck: "duck-rio")
                RiverStrip(meters: model.distanceMeters, duckSize: 54)
                    .frame(height: 96)
                if let meters = model.distanceMeters {
                    HStack(alignment: .firstTextBaseline) {
                        Text(River.distanceText(meters: meters))
                            .font(.title2.weight(.heavy))
                            .foregroundStyle(Palette.ink)
                        Text(River.phrase(meters: meters))
                            .font(.subheadline)
                            .foregroundStyle(Palette.muted)
                        Spacer()
                    }
                    if let seen = model.partner?.locationUpdatedAt {
                        Text("\(model.partnerName) actualizó \(seen.relativeText)")
                            .font(.caption)
                            .foregroundStyle(Palette.muted)
                    }
                } else {
                    Text(riverHint)
                        .font(.subheadline)
                        .foregroundStyle(Palette.muted)
                }
            }
        }
    }

    private var riverHint: String {
        if !model.isPaired { return "Vincúlate con tu pareja en Nosotros para ver qué tan lejos nadan." }
        if !model.me.sharingLocation { return "Activa compartir ubicación en la pestaña Río." }
        return "\(model.partnerName) todavía no comparte su ubicación."
    }

    @ViewBuilder
    private var partnerCard: some View {
        if let partner = model.partner {
            Card {
                VStack(alignment: .leading, spacing: 12) {
                    SectionTitle(text: model.partnerName)
                    if let mood = partner.mood {
                        HStack(spacing: 12) {
                            DuckImage(name: mood.assetName, size: 64)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(mood.label).font(.headline).foregroundStyle(Palette.ink)
                                if !partner.moodNote.isEmpty {
                                    Text("“\(partner.moodNote)”").font(.subheadline).foregroundStyle(Palette.ink)
                                }
                                Text(mood.partnerTip).font(.footnote).foregroundStyle(Palette.muted)
                            }
                        }
                    }
                    if let song = partner.nowPlaying {
                        NowPlayingRow(song: song, caption: "Está escuchando")
                    }
                    if let cycle = partner.cycle {
                        HStack(spacing: 10) {
                            DuckImage(name: "duck-ciclo", size: 44)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(cycleTitle(cycle)).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
                                Text(cycle.phase.partnerTip).font(.footnote).foregroundStyle(Palette.muted)
                            }
                        }
                    }
                    if partner.mood == nil, partner.nowPlaying == nil, partner.cycle == nil {
                        Text("Sin novedades por ahora. El estanque está tranquilo.")
                            .font(.subheadline).foregroundStyle(Palette.muted)
                    }
                }
            }
        }
    }

    private func cycleTitle(_ cycle: CycleSummary) -> String {
        var text = cycle.phase.label
        if let day = cycle.dayOfCycle { text += " · día \(day)" }
        if let left = cycle.daysUntilNextPeriod, cycle.phase != .menstrual { text += " · faltan \(left) d" }
        return text
    }

    @ViewBuilder
    private var nextDateCard: some View {
        if let next = model.upcomingDates.first {
            Card {
                HStack(spacing: 12) {
                    DuckImage(name: "duck-fechas", size: 56)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(next.daysLeft == 0 ? "¡Es hoy!" : "Faltan \(next.daysLeft) días")
                            .font(.headline).foregroundStyle(Palette.coral)
                        Text(next.date.title).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
                        Text(next.when.shortText).font(.footnote).foregroundStyle(Palette.muted)
                    }
                    Spacer()
                }
            }
        }
    }
}

struct NowPlayingRow: View {
    let song: NowPlaying
    let caption: String

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: song.artworkURL.flatMap(URL.init(string:))) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                DuckImage(name: "duck-musica", size: 44)
            }
            .frame(width: 48, height: 48)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(caption).font(.caption).foregroundStyle(Palette.muted)
                Text(song.title).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink).lineLimit(1)
                Text(song.artist).font(.footnote).foregroundStyle(Palette.muted).lineLimit(1)
            }
            Spacer()
            Image(systemName: "waveform")
                .foregroundStyle(Palette.coral)
                .symbolEffect(.variableColor.iterative)
        }
    }
}
