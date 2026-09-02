# Seguridad — de localStorage a iOS

Arquitectura de seguridad para las Fases 1 y 2. Se escribe **antes** de implementar
porque cada decisión de aquí condiciona el esquema de la base de datos, y un esquema
mal planteado no se arregla después sin migrar datos que no se pueden perder.

Contexto que importa: Pato guarda material íntimo de dos personas concretas. El modelo
de amenaza no es un atacante con recursos de estado; es que **una tercera persona pueda
ver los recuerdos de una pareja**. Todo lo de abajo sirve a eso.

---

## 0. Estado actual (lo que hay que cerrar)

| Problema | Dónde | Cierra en |
|---|---|---|
| Sin autenticación: cualquiera con la URL ve todo | toda la app | Fase 1 |
| Tokens de Spotify en variables globales del servidor | `server/index.js:314`, `:508` | Fase 1 |
| `VITE_API_SECRET` va inlineada en el bundle público | `playlistApi.js:25` | Fase 1 |
| Rutas OAuth exentas del chequeo de API key | `server/index.js:64-79` | Fase 1 |

Sobre `VITE_API_SECRET`: Vite sustituye toda variable `VITE_*` por su valor literal en
el build. La cabecera `x-api-key` que manda el frontend se lee abriendo DevTools. **No
autentica nada.** Se elimina en la Fase 1; la autenticación real será el JWT de sesión.

Nota de contraste: la `anon key` de Supabase **sí** es pública por diseño y no es el
mismo caso. Es un identificador de proyecto; quien protege los datos es RLS, no la clave.

---

## 1. Autenticación

**Proveedor:** Supabase Auth. No se implementan contraseñas propias — ni hashing, ni
recuperación, ni rotación. Es el componente donde más fácil es equivocarse y menos
aporta escribirlo a mano.

**Métodos:**
- Sign in with Apple (nativo en iOS, sin salir de la app)
- Magic link por correo como alternativa

**Reglas no negociables:**

1. **Flujo PKCE** (`flowType: 'pkce'` en el cliente de Supabase). En una app nativa el
   redirect URI puede ser interceptado por otra app registrada para el mismo scheme;
   PKCE es lo que hace que un código robado no sirva. Es lo que exige la RFC 8252 para
   clientes públicos.
2. **El refresh token nunca en `localStorage`.** En el WebView, `localStorage` es
   accesible desde cualquier JavaScript que llegue a ejecutarse. Va al Keychain vía
   `@capacitor/preferences`, con accesibilidad `WhenUnlockedThisDeviceOnly` para que no
   se sincronice a iCloud ni sobreviva a un backup restaurado en otro dispositivo.
3. **Sin secretos de cliente en la app.** Un `client_secret` embebido en un binario que
   se distribuye no es un secreto. Los flujos que lo requieran (Spotify) se quedan en el
   servidor.

**Face ID** es un cerrojo local, no autenticación. Bloquea la app ya abierta; no
sustituye la sesión ni concede permisos en el servidor. Útil porque el teléfono a veces
se presta, pero no cuenta como control de acceso a los datos.

---

## 2. Base de datos: el modelo es la defensa

La regla central: **un usuario solo ve filas de su pareja, y eso lo impone Postgres, no
el código de la app.** Si mañana hay un bug en el frontend, o alguien llama a la API
directamente con curl, la base de datos sigue diciendo que no.

### Esquema base

```sql
create table couples (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table couple_members (
  couple_id uuid not null references couples(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- Una pareja son dos personas. Que lo garantice la base, no la UI.
create or replace function enforce_couple_size()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'Una pareja no puede tener mas de dos miembros';
  end if;
  return new;
end $$;

create trigger couple_members_limit
  before insert on couple_members
  for each row execute function enforce_couple_size();
```

Cada tabla de contenido (`media`, `citas`, `letters`, `sent_letter_logs`,
`partner_profiles`, `playlists`, `activity_events`, `app_state`) lleva
`couple_id uuid not null references couples(id) on delete cascade`.

### La función auxiliar, y por qué hace falta

```sql
create or replace function public.auth_couple_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select couple_id from public.couple_members where user_id = auth.uid()
$$;

revoke all on function public.auth_couple_ids() from public, anon;
grant execute on function public.auth_couple_ids() to authenticated;
```

Sin esta función, la política sobre `couple_members` se consulta a sí misma y Postgres
aborta con *infinite recursion detected in policy*. `security definer` corta la
recursión porque la función se ejecuta con los permisos de su dueño y no vuelve a pasar
por RLS. El `set search_path = ''` es obligatorio en cualquier `security definer`: sin
él, un `search_path` manipulado puede hacer que la función resuelva otra tabla distinta
de la que se pretendía.

### Política, aplicada igual a cada tabla

```sql
alter table citas enable row level security;

create policy citas_de_mi_pareja on citas
  for all
  to authenticated
  using      (couple_id in (select public.auth_couple_ids()))
  with check (couple_id in (select public.auth_couple_ids()));
```

**`with check` no es opcional.** `using` filtra lo que se lee; sin `with check`, un
usuario autenticado puede *insertar* filas con el `couple_id` de otra pareja, o *mover*
una fila suya al espacio de otra con un UPDATE. Es el fallo más común al escribir RLS.

`to authenticated` deja fuera al rol `anon` explícitamente.

### Checklist de verificación

- [ ] `alter table ... enable row level security` en **todas** las tablas, incluidas las
      que parezcan inofensivas
- [ ] Toda política tiene `using` **y** `with check`
- [ ] Ninguna tabla concede permisos a `anon`
- [ ] La `service_role key` no aparece en el bundle del cliente, ni en variables `VITE_*`,
      ni en el repositorio (es un bypass total de RLS)
- [ ] Test de integración con dos usuarios reales: el usuario B pide explícitamente el
      `couple_id` de A y recibe cero filas — no basta con que la UI no lo muestre

---

## 3. Fotos y videos

Bucket **privado**. Nunca público, en ningún momento del desarrollo: un bucket público
es una URL adivinable a material íntimo, y una vez indexada no se retira.

Convención de rutas: `<couple_id>/<media_id>.<ext>`. El primer segmento es lo que la
política usa para decidir.

```sql
create policy media_de_mi_pareja on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1]::uuid in (select public.auth_couple_ids())
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1]::uuid in (select public.auth_couple_ids())
  );
```

Acceso por **signed URLs de corta duración** (una hora basta para ver un álbum). El
cliente pide la URL firmada al abrir la foto; no se guardan URLs firmadas en la base ni
en la caché.

Límites en el servidor, no solo en el input: tamaño máximo por archivo y lista blanca de
tipos MIME. El `accept` del `<input type="file">` es una sugerencia al usuario, no un
control.

---

## 4. Emparejar a las dos personas

Es el punto más delicado de todo el sistema: el mecanismo por el que una segunda persona
entra a ver **todos** los recuerdos. Un código débil aquí anula el resto del documento.

- Token de **32 bytes** de `gen_random_bytes`, no un número corto ni un UUID adivinable
- En la base se guarda **solo el hash** (`sha256`), nunca el token en claro; quien lea la
  tabla no puede usarlo
- **Un solo uso** y **expiración corta** (24 horas)
- El canje ocurre dentro de una función `security definer` que valida, inserta el
  miembro y marca el token como consumido **en una sola transacción**; si se hace en
  pasos separados desde el cliente, dos canjes simultáneos pueden colarse
- El trigger de tamaño máximo de la sección 2 es la última red: aunque el canje falle,
  no entra un tercero

---

## 5. Requisitos de Apple

Estos no son buenas prácticas: son condiciones para que la app pase revisión.

| Requisito | Qué implica en Pato |
|---|---|
| **Privacy Manifest** (`PrivacyInfo.xcprivacy`) | Obligatorio. Declarar las *required reason APIs* que se usan — `UserDefaults` entra con el motivo `CA92.1` — y las categorías de datos recogidos (fotos, correo, identificadores) |
| **Nutrition labels** en App Store Connect | Deben coincidir con el manifest. Fotos y videos, correo, y datos de uso si se añade analítica |
| **Borrado de cuenta dentro de la app** | Obligatorio si hay registro. No vale un enlace a un correo: tiene que ser una opción en la app que borre de verdad la cuenta y el contenido |
| **Sign in with Apple** | Si se ofrece login social de terceros, hay que ofrecer también una opción equivalente en privacidad. Sign in with Apple la cumple |
| **ATS** | Todo el tráfico por HTTPS. Sin `NSAllowsArbitraryLoads`, ni siquiera "temporalmente para probar" |
| **Permisos con texto real** | `NSPhotoLibraryUsageDescription` y `NSCameraUsageDescription` explicando el uso concreto. Un texto genérico se rechaza |
| **Export compliance** | `ITSAppUsesNonExemptEncryption = false` si solo se usa HTTPS estándar |
| **Sin código remoto** | Capacitor debe servir desde el bundle. **No** apuntar `server.url` a un host remoto en producción: es motivo de rechazo (guideline 2.5.2) y abre la puerta a un MITM que sustituya la app entera |

---

## 6. Endurecer el WebView

- **CSP estricta** en `index.html`. Hoy no hay ninguna: cualquier script inyectado se
  ejecuta con acceso completo al almacenamiento y a la sesión
- `allowNavigation` en `capacitor.config` limitado a los dominios propios de Supabase y
  del proveedor de OAuth; sin comodines
- Depuración del WebView desactivada en builds de release
- Todo el contenido que escribe una persona — cartas, notas, nombres — se renderiza como
  texto por React. No introducir inyección de HTML crudo en ninguna de esas rutas

---

## 7. Backend Express

Tras la Fase 1 casi todo desaparece: el correo lo sustituye una notificación push, y los
datos van directos a Supabase desde el cliente con RLS. Lo único que justifica seguir
teniendo un servidor es Spotify, porque su flujo necesita un `client_secret`.

Lo que queda debe cumplir:

- Verificar el **JWT de Supabase** en cada petición y derivar el usuario de él. Nunca
  aceptar un `user_id` que venga en el cuerpo o en la query
- Tokens de Spotify **por usuario**, cifrados en reposo, en `couple_members` o en una
  tabla propia con su RLS. Se acaban las variables globales de módulo
- Rate limiting por usuario autenticado, no solo por IP
- CORS restringido al origen de producción y al scheme de la app

---

## 8. Orden de implementación

1. Esquema, RLS y los tests de aislamiento entre dos usuarios — **antes** de mover un
   solo dato real
2. Autenticación y emparejamiento
3. Migración de datos desde localStorage e IndexedDB, con la copia de seguridad de la
   Fase 0 como red
4. Retirar `VITE_API_SECRET` y los tokens globales del servidor
5. Empaquetado con Capacitor y el checklist de Apple

El paso 1 va primero por una razón concreta: escribir las políticas con las tablas ya
llenas obliga a probarlas sobre datos que no se pueden perder.
