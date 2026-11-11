import SwiftUI

/// Paleta "estanque": crema cálido, amarillo pato, agua y coral.
enum Palette {
    static let cream = Color(hex: 0xFFF8EA)
    static let card = Color.white
    static let duck = Color(hex: 0xFFD45C)
    static let duckDeep = Color(hex: 0xF4B63B)
    static let water = Color(hex: 0x7CCBDB)
    static let waterDeep = Color(hex: 0x4AA6BC)
    static let coral = Color(hex: 0xF0806A)
    static let heart = Color(hex: 0xF25C6E)
    static let ink = Color(hex: 0x4A3B36)
    static let muted = Color(hex: 0x8E7F7A)
}

extension Color {
    init(hex: UInt32) {
        self.init(red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255)
    }
}

struct DuckImage: View {
    let name: String
    var size: CGFloat = 56

    var body: some View {
        Image(name)
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}
