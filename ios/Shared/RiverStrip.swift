import SwiftUI
import PatoCore

/// El río: dos patos que se acercan o se alejan según la distancia real.
struct RiverStrip: View {
    /// Metros entre los dos. `nil` = todavía no sabemos dónde está el otro.
    let meters: Double?
    var duckSize: CGFloat = 46

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            let separation = meters.map(River.separation(meters:)) ?? 1
            let together = meters.map { $0 < River.togetherThreshold } ?? false
            let reach = max(0, width / 2 - duckSize * 0.75)
            let offset = together ? duckSize * 0.42 : max(duckSize * 0.62, reach * separation)

            ZStack {
                RoundedRectangle(cornerRadius: height / 2.4, style: .continuous)
                    .fill(LinearGradient(colors: [Palette.water.opacity(0.55), Palette.water], startPoint: .top, endPoint: .bottom))
                WaveLine()
                    .stroke(Color.white.opacity(0.55), style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .frame(height: 8)
                    .padding(.horizontal, 14)
                    .offset(y: height * 0.28)
                if together {
                    Image(systemName: "heart.fill")
                        .font(.system(size: duckSize * 0.32))
                        .foregroundStyle(Palette.heart)
                        .offset(y: -duckSize * 0.62)
                }
                DuckImage(name: "duck-nadando-yo", size: duckSize)
                    .offset(x: -offset, y: -2)
                DuckImage(name: "duck-nadando-pareja", size: duckSize)
                    .scaleEffect(x: -1, y: 1)
                    .offset(x: offset, y: -2)
                    .opacity(meters == nil ? 0.45 : 1)
            }
            .frame(width: width, height: height)
        }
        .accessibilityElement()
        .accessibilityLabel(meters.map { "Distancia: \(River.distanceText(meters: $0))" } ?? "Distancia desconocida")
    }
}

struct WaveLine: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let step: CGFloat = 22
        path.move(to: CGPoint(x: rect.minX, y: rect.midY))
        var x = rect.minX
        var up = true
        while x < rect.maxX {
            let next = min(x + step, rect.maxX)
            path.addQuadCurve(to: CGPoint(x: next, y: rect.midY),
                              control: CGPoint(x: (x + next) / 2, y: up ? rect.minY : rect.maxY))
            x = next
            up.toggle()
        }
        return path
    }
}
