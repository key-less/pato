import SwiftUI
import PatoCore

struct UsView: View {
    @Environment(AppModel.self) private var model
    @State private var profile = PartnerProfile()
    @State private var hasBirthday = false
    @State private var birthday = Date()

    var body: some View {
        NavigationStack {
            Form {
                Section("Nuestra relación") {
                    DatePicker("Juntos desde",
                               selection: Binding(get: { model.couple.metSince ?? Date() },
                                                  set: { value in
                                                      var info = model.couple
                                                      info.metSince = value
                                                      model.save(couple: info)
                                                  }),
                               in: ...Date(), displayedComponents: .date)
                    Picker("Estado", selection: Binding(get: { model.couple.status },
                                                        set: { value in
                                                            var info = model.couple
                                                            info.status = value
                                                            model.save(couple: info)
                                                        })) {
                        ForEach(CoupleInfo.statuses, id: \.self) { Text($0).tag($0) }
                    }
                }

                Section("Mi perfil") {
                    TextField("Nombre", text: $profile.name)
                    Toggle("Mostrar mi cumpleaños", isOn: $hasBirthday)
                    if hasBirthday {
                        DatePicker("Cumpleaños", selection: $birthday, in: ...Date(), displayedComponents: .date)
                    }
                    TextField("Color favorito", text: $profile.favoriteColor)
                    TextField("Comida favorita", text: $profile.favoriteFood)
                    TextField("Lugar favorito", text: $profile.favoritePlace)
                    TextField("Lo que más me encanta de ti", text: $profile.whatILoveMost, axis: .vertical)
                    Button("Guardar perfil") {
                        profile.birthday = hasBirthday ? birthday : nil
                        model.save(profile: profile)
                    }
                    .disabled(!hasProfileChanges)
                }

                if let partner = model.partnerProfile {
                    Section(partner.name.isEmpty ? "Mi pareja" : partner.name) {
                        if let date = partner.birthday { LabeledContent("Cumpleaños", value: date.shortText) }
                        fact("Color favorito", partner.favoriteColor)
                        fact("Comida favorita", partner.favoriteFood)
                        fact("Lugar favorito", partner.favoritePlace)
                        if !partner.whatILoveMost.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Lo que más le encanta de ti").font(.caption).foregroundStyle(Palette.muted)
                                Text(partner.whatILoveMost)
                            }
                        }
                    }
                }

                PairingSection()
                MusicSection()

                Section {
                    HStack {
                        DuckImage(name: "duck-logo", size: 40)
                        VStack(alignment: .leading) {
                            Text("Pato para iOS").font(.subheadline.weight(.semibold))
                            Text("Hecho con cariño para dos.").font(.caption).foregroundStyle(Palette.muted)
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Palette.cream.ignoresSafeArea())
            .navigationTitle("Nosotros")
            .onAppear(perform: loadProfile)
        }
    }

    private var hasProfileChanges: Bool {
        var edited = profile
        edited.birthday = hasBirthday ? birthday : nil
        return edited != model.myProfile
    }

    @ViewBuilder
    private func fact(_ label: String, _ value: String) -> some View {
        if !value.isEmpty { LabeledContent(label, value: value) }
    }

    private func loadProfile() {
        profile = model.myProfile
        hasBirthday = profile.birthday != nil
        birthday = profile.birthday ?? Date()
    }
}

// MARK: - Vinculación

private struct PairingSection: View {
    @Environment(AppModel.self) private var model
    @State private var email = ""
    @State private var code = ""
    @State private var codeSent = false
    @State private var invite = ""
    @State private var busy = false
    @State private var confirmLeave = false

    var body: some View {
        Section {
            if !model.hasBackend {
                Label("Modo local: esta copia no está conectada a un servidor, así que los datos viven solo en este teléfono.",
                      systemImage: "iphone")
                    .font(.footnote)
            } else if model.signedInEmail == nil {
                TextField("Tu correo", text: $email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if codeSent {
                    TextField("Código de 6 dígitos", text: $code)
                        .keyboardType(.numberPad)
                        .textContentType(.oneTimeCode)
                    Button("Entrar") {
                        run { await model.verifyLogin(email: email, code: code) }
                    }
                    .disabled(code.count < 6 || busy)
                }
                Button(codeSent ? "Reenviar código" : "Enviarme un código") {
                    run { codeSent = await model.sendLoginCode(email: email) || codeSent }
                }
                .disabled(!email.contains("@") || busy)
            } else if model.isPaired {
                LabeledContent("Cuenta", value: model.signedInEmail ?? "")
                if let inviteCode = model.local.inviteCode {
                    LabeledContent("Código del estanque") {
                        Text(inviteCode).font(.body.monospaced().weight(.bold)).textSelection(.enabled)
                    }
                    if model.partnerProfile == nil {
                        ShareLink("Invitar a mi pareja", item: "Únete a mi estanque en Pato con el código \(inviteCode)")
                    }
                }
                Button("Sincronizar ahora") { run { await model.syncNow() } }
                    .disabled(busy || model.isSyncing)
                Button("Salir del estanque", role: .destructive) { confirmLeave = true }
                Button("Cerrar sesión") { run { await model.signOut() } }
            } else {
                LabeledContent("Cuenta", value: model.signedInEmail ?? "")
                Button("Crear nuestro estanque") { run { await model.createCouple() } }
                    .disabled(busy)
                TextField("Código de tu pareja", text: $invite)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                Button("Unirme con código") { run { await model.joinCouple(code: invite) } }
                    .disabled(invite.count < 6 || busy)
                Button("Cerrar sesión") { run { await model.signOut() } }
            }
        } header: {
            Text("Vincular pareja")
        } footer: {
            if model.hasBackend, !model.isPaired {
                Text("Uno crea el estanque y comparte el código; el otro se une con ese código. Solo caben dos patos.")
            }
        }
        .confirmationDialog("¿Salir del estanque?", isPresented: $confirmLeave, titleVisibility: .visible) {
            Button("Salir", role: .destructive) { run { await model.leaveCouple() } }
        } message: {
            Text("Dejarás de compartir ubicación, ánimo y recuerdos. Lo guardado en este teléfono no se borra.")
        }
    }

    @MainActor
    private func run(_ action: @escaping @MainActor () async -> Void) {
        busy = true
        Task {
            await action()
            busy = false
        }
    }
}

// MARK: - Música

private struct MusicSection: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        Section {
            if model.spotify == nil {
                Label("Spotify no está configurado en esta copia de la app.", systemImage: "music.note")
                    .font(.footnote)
            } else if model.spotifyConnected {
                if let song = model.me.nowPlaying {
                    NowPlayingRow(song: song, caption: "Estás escuchando")
                } else {
                    Text("Conectado. Cuando pongas música, tu pareja lo verá.")
                        .font(.footnote).foregroundStyle(Palette.muted)
                }
                Button("Desconectar Spotify", role: .destructive) { model.disconnectSpotify() }
            } else {
                Button {
                    Task { await model.connectSpotify() }
                } label: {
                    Label("Conectar Spotify", systemImage: "music.note")
                }
            }
        } header: {
            Text("Música")
        } footer: {
            Text("Cada quien conecta su cuenta en su teléfono. Se actualiza mientras Pato está abierto o cuando cambia tu ubicación.")
        }
    }
}
