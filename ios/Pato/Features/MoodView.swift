import SwiftUI
import PatoCore

struct MoodView: View {
    @Environment(AppModel.self) private var model
    @State private var note = ""
    @State private var periodDate = Date()
    @State private var importing = false

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 4)

    var body: some View {
        NavigationStack {
            PondScreen {
                moodCard
                if let partner = model.partner, let mood = partner.mood {
                    Card {
                        HStack(spacing: 12) {
                            DuckImage(name: mood.assetName, size: 70)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("\(model.partnerName) está: \(mood.label.lowercased())")
                                    .font(.headline).foregroundStyle(Palette.ink)
                                if !partner.moodNote.isEmpty {
                                    Text("“\(partner.moodNote)”").font(.subheadline).foregroundStyle(Palette.ink)
                                }
                                Text(mood.partnerTip).font(.footnote).foregroundStyle(Palette.muted)
                            }
                        }
                    }
                }
                cycleCard
            }
            .navigationTitle("Ánimo")
            .onAppear { note = model.me.moodNote }
        }
    }

    private var moodCard: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(text: "¿Cómo está tu pato hoy?", duck: "duck-animo")
                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(Mood.allCases, id: \.self) { mood in
                        let selected = model.me.mood == mood
                        Button {
                            withAnimation(.spring(duration: 0.3)) {
                                model.setMood(selected ? nil : mood, note: note)
                            }
                        } label: {
                            VStack(spacing: 4) {
                                DuckImage(name: mood.assetName, size: 54)
                                    .scaleEffect(selected ? 1.12 : 1)
                                Text(mood.label)
                                    .font(.caption2.weight(.semibold))
                                    .foregroundStyle(Palette.ink)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(selected ? Palette.duck.opacity(0.35) : Palette.cream,
                                        in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(selected ? Palette.duckDeep : .clear, lineWidth: 2))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(mood.label)
                        .accessibilityAddTraits(selected ? .isSelected : [])
                    }
                }
                HStack {
                    TextField("Cuéntale por qué (opcional)", text: $note)
                        .textFieldStyle(.roundedBorder)
                        .submitLabel(.send)
                        .onSubmit { model.setMood(model.me.mood, note: note) }
                    if note != model.me.moodNote, model.me.mood != nil {
                        Button("Enviar") { model.setMood(model.me.mood, note: note) }
                            .buttonStyle(.borderedProminent)
                    }
                }
                Text(model.isPaired ? "Tu pareja lo ve al instante en su Pato." : "Cuando se vinculen, tu pareja lo verá en su Pato.")
                    .font(.caption).foregroundStyle(Palette.muted)
            }
        }
    }

    // MARK: Ciclo

    private var cycleCard: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(text: "Ciclo", duck: "duck-ciclo")
                Toggle("Llevar mi ciclo en Pato", isOn: cycleBinding(\.trackingEnabled))
                    .tint(Palette.heart)
                if model.local.cycle.trackingEnabled {
                    cycleStatus
                    Divider()
                    DatePicker("Inicio de periodo", selection: $periodDate, in: ...Date(), displayedComponents: .date)
                    HStack {
                        Button("Registrar") { model.logPeriod(start: periodDate) }
                            .buttonStyle(.borderedProminent)
                            .tint(Palette.heart)
                        if HealthCycleImporter.isAvailable {
                            Button {
                                importing = true
                                Task {
                                    await model.importPeriodsFromHealth()
                                    importing = false
                                }
                            } label: {
                                Label(importing ? "Leyendo…" : "Traer de Salud", systemImage: "heart.text.square")
                            }
                            .buttonStyle(.bordered)
                            .disabled(importing)
                        }
                    }
                    Text("“Traer de Salud” lee los periodos que Flo, Clue o la app Salud hayan guardado en Apple Health.")
                        .font(.caption).foregroundStyle(Palette.muted)
                    if !model.local.periodLogs.isEmpty {
                        ForEach(model.local.periodLogs.suffix(4).reversed()) { log in
                            HStack {
                                Image(systemName: "drop.fill").foregroundStyle(Palette.heart)
                                Text(log.start.shortText).font(.subheadline)
                                Spacer()
                                Button(role: .destructive) { model.deletePeriod(log) } label: {
                                    Image(systemName: "trash")
                                }
                                .buttonStyle(.borderless)
                                .accessibilityLabel("Borrar registro del \(log.start.shortText)")
                            }
                        }
                    }
                    Divider()
                    Picker("Compartir con mi pareja", selection: cycleBinding(\.shareLevel)) {
                        ForEach(CycleShareLevel.allCases, id: \.self) { level in
                            Text(level.label).tag(level)
                        }
                    }
                    Stepper("Duración del periodo: \(model.local.cycle.periodLength) días",
                            value: cycleBinding(\.periodLength), in: 2...10)
                    Text("Tus fechas se quedan en este teléfono. A tu pareja solo le llega lo que elijas arriba. Es una estimación: no sirve como anticonceptivo ni reemplaza a tu médico.")
                        .font(.caption).foregroundStyle(Palette.muted)
                } else {
                    Text("Actívalo solo si quieres llevar tu ciclo. Tú decides si tu pareja ve la fase en la que estás para que sepa cómo acompañarte.")
                        .font(.footnote).foregroundStyle(Palette.muted)
                }
            }
        }
    }

    @ViewBuilder
    private var cycleStatus: some View {
        if let status = model.cycleStatus {
            HStack(spacing: 14) {
                ZStack {
                    Circle().stroke(Palette.cream, lineWidth: 9)
                    Circle()
                        .trim(from: 0, to: CGFloat(status.dayOfCycle) / CGFloat(status.cycleLength))
                        .stroke(Palette.heart, style: StrokeStyle(lineWidth: 9, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("\(status.dayOfCycle)").font(.title2.weight(.heavy)).foregroundStyle(Palette.ink)
                        Text("día").font(.caption2).foregroundStyle(Palette.muted)
                    }
                }
                .frame(width: 78, height: 78)
                VStack(alignment: .leading, spacing: 3) {
                    Text(status.phase.label).font(.headline).foregroundStyle(Palette.ink)
                    Text("Próximo periodo: \(status.nextPeriod.shortText) (en \(status.daysUntilNextPeriod) d)")
                        .font(.footnote).foregroundStyle(Palette.muted)
                    Text("Ciclo promedio: \(status.cycleLength) días")
                        .font(.footnote).foregroundStyle(Palette.muted)
                }
            }
        } else {
            Text("Registra el inicio de tu último periodo para empezar.")
                .font(.footnote).foregroundStyle(Palette.muted)
        }
    }

    private func cycleBinding<Value>(_ keyPath: WritableKeyPath<CycleSettings, Value>) -> Binding<Value> {
        Binding(get: { model.local.cycle[keyPath: keyPath] },
                set: { newValue in
                    var settings = model.local.cycle
                    settings[keyPath: keyPath] = newValue
                    model.updateCycle(settings)
                })
    }
}
