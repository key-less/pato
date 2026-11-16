import SwiftUI
import PhotosUI
import PatoCore

struct MemoriesView: View {
    enum Section: String, CaseIterable {
        case album = "Álbum", dates = "Fechas", letters = "Cartas"
    }

    @State private var section: Section = .album

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Sección", selection: $section) {
                    ForEach(Section.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 18)
                .padding(.vertical, 10)

                switch section {
                case .album: AlbumView()
                case .dates: DatesView()
                case .letters: LettersView()
                }
            }
            .background(Palette.cream.ignoresSafeArea())
            .navigationTitle("Recuerdos")
        }
    }
}

// MARK: - Álbum

struct AlbumView: View {
    @Environment(AppModel.self) private var model
    @State private var picked: [PhotosPickerItem] = []
    @State private var selected: Memory?
    @State private var onlyFavorites = false

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 3)

    var body: some View {
        let items = model.memories.filter { !onlyFavorites || $0.isFavorite }
        ScrollView {
            HStack {
                PhotosPicker(selection: $picked, maxSelectionCount: 20, matching: .images) {
                    Label("Agregar fotos", systemImage: "plus")
                        .font(.subheadline.weight(.semibold))
                }
                .buttonStyle(.borderedProminent)
                Spacer()
                Toggle(isOn: $onlyFavorites) {
                    Image(systemName: "heart.fill")
                }
                .toggleStyle(.button)
                .accessibilityLabel("Solo favoritas")
            }
            .padding(.horizontal, 18)

            if items.isEmpty {
                EmptyState(duck: "duck-recuerdos", title: "Aún no hay fotos",
                           message: "Guarden aquí sus momentos. Cuando estén vinculados, las fotos aparecen en los dos teléfonos.")
            } else {
                LazyVGrid(columns: columns, spacing: 4) {
                    ForEach(items) { memory in
                        Button { selected = memory } label: {
                            MemoryThumb(memory: memory)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 4)
            }
        }
        .onChange(of: picked) { _, newItems in
            guard !newItems.isEmpty else { return }
            Task {
                for item in newItems {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        model.addPhoto(data: data)
                    }
                }
                picked = []
            }
        }
        .sheet(item: $selected) { memory in
            MemoryDetail(memory: memory)
        }
    }
}

private struct MemoryThumb: View {
    let memory: Memory

    var body: some View {
        Color.clear
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                if let image = MediaStore.image(for: memory.fileName) {
                    Image(uiImage: image).resizable().scaledToFill()
                } else {
                    ZStack {
                        Palette.water.opacity(0.25)
                        ProgressView()
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(alignment: .topTrailing) {
                if memory.isFavorite {
                    Image(systemName: "heart.fill")
                        .font(.caption)
                        .foregroundStyle(.white)
                        .padding(5)
                        .background(Palette.heart, in: Circle())
                        .padding(5)
                }
            }
            .accessibilityLabel(memory.caption.isEmpty ? "Foto del \(memory.date.shortText)" : memory.caption)
    }
}

private struct MemoryDetail: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State var memory: Memory

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let image = MediaStore.image(for: memory.fileName) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    }
                    TextField("Escribe algo sobre este momento", text: $memory.caption, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                    DatePicker("Fecha", selection: $memory.date, displayedComponents: .date)
                    Toggle("Favorita", isOn: $memory.isFavorite)
                        .tint(Palette.heart)
                    Button("Borrar foto", role: .destructive) {
                        model.delete(memory: memory)
                        dismiss()
                    }
                }
                .padding(18)
            }
            .background(Palette.cream.ignoresSafeArea())
            .navigationTitle("Recuerdo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        model.save(memory: memory)
                        dismiss()
                    }
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Fechas

struct DatesView: View {
    @Environment(AppModel.self) private var model
    @State private var editing: SpecialDate?

    var body: some View {
        let upcoming = model.upcomingDates
        let upcomingIDs = Set(upcoming.map(\.date.id))
        let past = model.specialDates.filter { !upcomingIDs.contains($0.id) }
        List {
            Section {
                Button {
                    editing = SpecialDate(title: "", date: Date())
                } label: {
                    Label("Nueva fecha o cita", systemImage: "plus.circle.fill")
                }
            }
            if upcoming.isEmpty && past.isEmpty {
                EmptyState(duck: "duck-fechas", title: "Sin fechas todavía",
                           message: "Aniversarios, cumpleaños, citas y momentos que no quieren olvidar.")
                    .listRowBackground(Color.clear)
            }
            if !upcoming.isEmpty {
                Section("Próximas") {
                    ForEach(upcoming, id: \.date.id) { entry in
                        DateRow(item: entry.date, when: entry.when,
                                badge: entry.daysLeft == 0 ? "Hoy" : "en \(entry.daysLeft) d")
                            .contentShape(Rectangle())
                            .onTapGesture { editing = entry.date }
                    }
                    .onDelete { offsets in
                        for index in offsets { model.delete(date: upcoming[index].date) }
                    }
                }
            }
            if !past.isEmpty {
                Section("Ya vividas") {
                    ForEach(past) { item in
                        DateRow(item: item, when: item.date, badge: nil)
                            .contentShape(Rectangle())
                            .onTapGesture { editing = item }
                    }
                    .onDelete { offsets in
                        for index in offsets { model.delete(date: past[index]) }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .sheet(item: $editing) { item in
            DateEditor(item: item)
        }
    }
}

private struct DateRow: View {
    let item: SpecialDate
    let when: Date
    let badge: String?

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.kind.symbol)
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Palette.coral, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title.isEmpty ? item.kind.label : item.title).font(.subheadline.weight(.semibold))
                Text([when.shortText, item.place].filter { !$0.isEmpty }.joined(separator: " · "))
                    .font(.footnote).foregroundStyle(Palette.muted)
            }
            Spacer()
            if let badge {
                Text(badge)
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Palette.duck.opacity(0.5), in: Capsule())
            }
        }
    }
}

private struct DateEditor: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State var item: SpecialDate

    var body: some View {
        NavigationStack {
            Form {
                TextField("Título (ej. Primera cita)", text: $item.title)
                Picker("Tipo", selection: $item.kind) {
                    ForEach(SpecialDateKind.allCases, id: \.self) { Text($0.label).tag($0) }
                }
                DatePicker("Fecha", selection: $item.date, displayedComponents: [.date, .hourAndMinute])
                Toggle("Se repite cada año", isOn: $item.repeatsYearly)
                TextField("Lugar", text: $item.place)
                TextField("Nota", text: $item.note, axis: .vertical)
            }
            .navigationTitle("Fecha")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: item.kind) { _, kind in
                if kind == .aniversario || kind == .cumple { item.repeatsYearly = true }
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        model.save(date: item)
                        dismiss()
                    }
                    .disabled(item.title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Cartas

struct LettersView: View {
    @Environment(AppModel.self) private var model
    @State private var editing: Letter?
    @State private var reading: Letter?

    var body: some View {
        List {
            Section {
                Button {
                    editing = Letter(title: "", body: "")
                } label: {
                    Label("Escribir una carta", systemImage: "square.and.pencil")
                }
            }
            if model.letters.isEmpty {
                EmptyState(duck: "duck-cartas", title: "Buzón vacío",
                           message: "Escríbele una carta. Puedes sellarla para que se abra en una fecha especial.")
                    .listRowBackground(Color.clear)
            }
            ForEach(model.letters) { letter in
                let mine = letter.authorProfileID == model.local.myProfileID
                let sealed = letter.isSealed() && !mine
                Button {
                    if !sealed { reading = letter }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: sealed ? "lock.fill" : "envelope.open.fill")
                            .foregroundStyle(sealed ? Palette.muted : Palette.coral)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(letter.title.isEmpty ? "Sin título" : letter.title)
                                .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
                            Text(subtitle(letter, mine: mine, sealed: sealed))
                                .font(.footnote).foregroundStyle(Palette.muted)
                        }
                    }
                }
                .swipeActions {
                    if mine {
                        Button("Borrar", role: .destructive) { model.delete(letter: letter) }
                        Button("Editar") { editing = letter }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .sheet(item: $editing) { LetterEditor(letter: $0) }
        .sheet(item: $reading) { LetterReader(letter: $0) }
    }

    private func subtitle(_ letter: Letter, mine: Bool, sealed: Bool) -> String {
        let who = mine ? "De ti" : "De \(model.partnerName)"
        if sealed, let openAt = letter.openAt { return "\(who) · se abre el \(openAt.shortText)" }
        return "\(who) · \(letter.createdAt.shortText)"
    }
}

private struct LetterReader: View {
    @Environment(\.dismiss) private var dismiss
    let letter: Letter

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    DuckImage(name: "duck-cartas", size: 80)
                        .frame(maxWidth: .infinity)
                    Text(letter.title).font(.title2.weight(.bold)).foregroundStyle(Palette.ink)
                    Text(letter.body).font(.body).foregroundStyle(Palette.ink)
                    Text(letter.createdAt.shortText).font(.footnote).foregroundStyle(Palette.muted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(22)
            }
            .background(Palette.cream.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { dismiss() } }
                ToolbarItem(placement: .primaryAction) {
                    ShareLink(item: "\(letter.title)\n\n\(letter.body)")
                }
            }
        }
    }
}

private struct LetterEditor: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State var letter: Letter
    @State private var sealed = false
    @State private var openAt = Date().addingTimeInterval(86_400 * 7)

    var body: some View {
        NavigationStack {
            Form {
                TextField("Título", text: $letter.title)
                Section("Carta") {
                    TextEditor(text: $letter.body)
                        .frame(minHeight: 220)
                }
                Section {
                    Toggle("Sellar hasta una fecha", isOn: $sealed)
                    if sealed {
                        DatePicker("Se abre el", selection: $openAt, in: Date()..., displayedComponents: .date)
                    }
                } footer: {
                    Text("Tu pareja verá que tiene una carta, pero no podrá abrirla antes de ese día.")
                }
            }
            .navigationTitle("Carta")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                if let date = letter.openAt {
                    sealed = true
                    openAt = date
                }
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        letter.openAt = sealed ? openAt : nil
                        model.save(letter: letter)
                        dismiss()
                    }
                    .disabled(letter.body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
            }
        }
    }
}
