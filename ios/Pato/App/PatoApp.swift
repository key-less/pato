import SwiftUI

@main
struct PatoApp: App {
    @State private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .fontDesign(.rounded)
                .tint(Palette.coral)
                .preferredColorScheme(.light)
                .onChange(of: scenePhase, initial: true) { _, phase in
                    switch phase {
                    case .active:
                        Task { await model.appBecameActive() }
                    case .background:
                        model.appWentToBackground()
                    default:
                        break
                    }
                }
        }
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        Group {
            if model.local.onboarded {
                MainTabs()
            } else {
                OnboardingView()
            }
        }
        .alert("Cuac…", isPresented: Binding(get: { model.lastError != nil }, set: { if !$0 { model.lastError = nil } })) {
            Button("Entendido", role: .cancel) {}
        } message: {
            Text(model.lastError ?? "")
        }
    }
}

struct MainTabs: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Hoy", systemImage: "sun.max.fill") }
            MemoriesView()
                .tabItem { Label("Recuerdos", systemImage: "photo.on.rectangle.angled") }
            RiverMapView()
                .tabItem { Label("Río", systemImage: "water.waves") }
            MoodView()
                .tabItem { Label("Ánimo", systemImage: "face.smiling.inverse") }
            UsView()
                .tabItem { Label("Nosotros", systemImage: "heart.fill") }
        }
    }
}

struct OnboardingView: View {
    @Environment(AppModel.self) private var model
    @State private var name = ""
    @State private var hasDate = true
    @State private var metSince = Date()

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                DuckImage(name: "duck-pareja", size: 150)
                    .padding(.top, 40)
                Text("Bienvenido a Pato")
                    .font(.largeTitle.weight(.heavy))
                    .foregroundStyle(Palette.ink)
                Text("El estanque de ustedes dos: recuerdos, fechas, ánimo y qué tan lejos nadan.")
                    .font(.body)
                    .foregroundStyle(Palette.muted)
                    .multilineTextAlignment(.center)

                Card {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("¿Cómo te llamas?").font(.headline)
                        TextField("Tu nombre", text: $name)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.givenName)
                        Toggle("Ya tenemos fecha de inicio", isOn: $hasDate)
                        if hasDate {
                            DatePicker("Juntos desde", selection: $metSince, in: ...Date(), displayedComponents: .date)
                        }
                    }
                }

                Button {
                    model.completeOnboarding(name: name.trimmingCharacters(in: .whitespaces), metSince: hasDate ? metSince : nil)
                } label: {
                    Text("Entrar al estanque")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)

                Text("Después podrás vincularte con tu pareja desde la pestaña Nosotros.")
                    .font(.footnote)
                    .foregroundStyle(Palette.muted)
                    .multilineTextAlignment(.center)
            }
            .padding(24)
        }
        .background(Palette.cream.ignoresSafeArea())
    }
}
