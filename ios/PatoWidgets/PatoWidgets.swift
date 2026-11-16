import WidgetKit
import SwiftUI
import PatoCore

struct PatoEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
    let isEmpty: Bool
}

struct PatoProvider: TimelineProvider {
    func placeholder(in context: Context) -> PatoEntry {
        PatoEntry(date: Date(), snapshot: .preview, isEmpty: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (PatoEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : current())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PatoEntry>) -> Void) {
        // La app refresca el widget cuando llegan datos nuevos; además se
        // vuelve a dibujar cada 30 min para mantener el contador de días al día.
        completion(Timeline(entries: [current()], policy: .after(Date().addingTimeInterval(30 * 60))))
    }

    private func current() -> PatoEntry {
        if let snapshot = WidgetSnapshot.load() {
            return PatoEntry(date: Date(), snapshot: snapshot, isEmpty: false)
        }
        return PatoEntry(date: Date(), snapshot: WidgetSnapshot(), isEmpty: true)
    }
}

// MARK: - Río

struct RiverWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: PatoEntry

    var body: some View {
        let meters = entry.snapshot.distanceMeters
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(meters.map(River.distanceText(meters:)) ?? "Sin señal")
                    .font(.system(family == .systemSmall ? .title3 : .title2, design: .rounded).weight(.bold))
                    .foregroundStyle(Palette.ink)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Spacer(minLength: 0)
                if family != .systemSmall, let mood = entry.snapshot.partnerMood {
                    DuckImage(name: mood.assetName, size: 30)
                }
            }
            Text(meters.map(River.phrase(meters:)) ?? "Abre Pato para vincularte")
                .font(.system(.caption, design: .rounded).weight(.medium))
                .foregroundStyle(Palette.muted)
                .lineLimit(1)
            RiverStrip(meters: meters, duckSize: family == .systemSmall ? 36 : 44)
                .frame(maxHeight: .infinity)
            if family != .systemSmall, let song = entry.snapshot.partnerSong {
                Label(song, systemImage: "music.note")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundStyle(Palette.muted)
                    .lineLimit(1)
            }
        }
        .containerBackground(Palette.cream, for: .widget)
    }
}

struct RiverWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PatoRiver", provider: PatoProvider()) { entry in
            RiverWidgetView(entry: entry)
        }
        .configurationDisplayName("El río")
        .description("Qué tan lejos nadan tus patos.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Días juntos

struct DaysWidgetView: View {
    let entry: PatoEntry

    var body: some View {
        VStack(spacing: 2) {
            DuckImage(name: "duck-pareja", size: 54)
            if let since = entry.snapshot.metSince {
                Text("\(Together.days(since: since, now: entry.date))")
                    .font(.system(size: 34, weight: .heavy, design: .rounded))
                    .foregroundStyle(Palette.ink)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text("días juntos")
                    .font(.system(.caption, design: .rounded).weight(.semibold))
                    .foregroundStyle(Palette.muted)
            } else {
                Text("Agrega su fecha en Pato")
                    .font(.system(.caption, design: .rounded).weight(.semibold))
                    .foregroundStyle(Palette.muted)
                    .multilineTextAlignment(.center)
            }
        }
        .containerBackground(Palette.cream, for: .widget)
    }
}

struct DaysWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PatoDays", provider: PatoProvider()) { entry in
            DaysWidgetView(entry: entry)
        }
        .configurationDisplayName("Días juntos")
        .description("El contador de su relación.")
        .supportedFamilies([.systemSmall])
    }
}

@main
struct PatoWidgetBundle: WidgetBundle {
    var body: some Widget {
        RiverWidget()
        DaysWidget()
    }
}
