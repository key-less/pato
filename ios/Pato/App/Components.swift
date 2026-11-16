import SwiftUI

struct Card<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background(Palette.card, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Palette.ink.opacity(0.06), radius: 12, y: 4)
    }
}

struct SectionTitle: View {
    let text: String
    var duck: String?

    var body: some View {
        HStack(spacing: 8) {
            if let duck { DuckImage(name: duck, size: 30) }
            Text(text)
                .font(.title3.weight(.bold))
                .foregroundStyle(Palette.ink)
            Spacer()
        }
    }
}

struct EmptyState: View {
    let duck: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 10) {
            DuckImage(name: duck, size: 110)
            Text(title)
                .font(.headline)
                .foregroundStyle(Palette.ink)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Palette.muted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
    }
}

/// Fondo crema común a todas las pantallas con scroll.
struct PondScreen<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                content
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
        }
        .background(Palette.cream.ignoresSafeArea())
    }
}

extension Date {
    var shortText: String {
        formatted(.dateTime.day().month(.abbreviated).year())
    }

    var relativeText: String {
        formatted(.relative(presentation: .named))
    }
}
