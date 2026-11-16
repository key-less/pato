import SwiftUI
import MapKit
import PatoCore

struct RiverMapView: View {
    @Environment(AppModel.self) private var model
    @State private var position: MapCameraPosition = .automatic

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Map(position: $position) {
                    if let mine = model.me.coordinate {
                        Annotation("Yo", coordinate: mine.clLocation) {
                            DuckPin(asset: "duck-nadando-yo")
                        }
                    }
                    if let theirs = model.partner?.coordinate {
                        Annotation(model.partnerName, coordinate: theirs.clLocation) {
                            DuckPin(asset: "duck-nadando-pareja")
                        }
                    }
                }
                .mapStyle(.standard(pointsOfInterest: .excludingAll))
                .ignoresSafeArea(edges: .top)

                panel
                    .padding(14)
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var panel: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                if let meters = model.distanceMeters {
                    HStack(alignment: .firstTextBaseline) {
                        Text(River.distanceText(meters: meters))
                            .font(.title.weight(.heavy)).foregroundStyle(Palette.ink)
                        Text(River.phrase(meters: meters))
                            .font(.subheadline).foregroundStyle(Palette.muted)
                    }
                    if let seen = model.partner?.locationUpdatedAt {
                        Text("Última señal de \(model.partnerName): \(seen.relativeText)")
                            .font(.caption).foregroundStyle(Palette.muted)
                    }
                } else {
                    Text(model.isPaired ? "Esperando la ubicación de los dos patos" : "Vincúlate con tu pareja para ver el río")
                        .font(.headline).foregroundStyle(Palette.ink)
                }
                Toggle(isOn: Binding(get: { model.me.sharingLocation }, set: { model.setSharingLocation($0) })) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Compartir mi ubicación").font(.subheadline.weight(.semibold))
                        Text(sharingHint).font(.caption).foregroundStyle(Palette.muted)
                    }
                }
                .tint(Palette.waterDeep)
                if model.me.sharingLocation, model.locationStatus == .denied || model.locationStatus == .restricted {
                    Button("Abrir Ajustes para dar permiso") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .font(.footnote.weight(.semibold))
                }
            }
        }
    }

    private var sharingHint: String {
        if !model.me.sharingLocation { return "Apagado: tu pareja no ve dónde estás." }
        switch model.locationStatus {
        case .authorizedAlways: return "Encendido, también con la app cerrada. Puedes pausarlo aquí."
        case .authorizedWhenInUse: return "Encendido solo mientras usas Pato. Elige “Siempre” en Ajustes para el widget."
        case .denied, .restricted: return "Pato no tiene permiso de ubicación."
        default: return "Solo tu pareja puede verla. Puedes pausarlo aquí."
        }
    }
}

private struct DuckPin: View {
    let asset: String

    var body: some View {
        DuckImage(name: asset, size: 46)
            .padding(6)
            .background(.white, in: Circle())
            .shadow(color: .black.opacity(0.18), radius: 4, y: 2)
    }
}

extension GeoPoint {
    var clLocation: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}
