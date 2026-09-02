-- Fase 1 — Row Level Security
--
-- Regla central: una persona solo ve filas de su pareja, y lo impone Postgres.
-- Si el frontend tiene un bug, o alguien llama a la API con curl, la base sigue
-- diciendo que no.
--
-- Toda politica lleva `using` Y `with check`. `using` filtra lo que se lee; sin
-- `with check` un usuario autenticado puede INSERTAR filas con el couple_id de otra
-- pareja, o mover una fila suya al espacio de otra con un UPDATE.

-- ---------------------------------------------------------------------------
-- Funcion auxiliar
-- ---------------------------------------------------------------------------
--
-- Sin ella, la politica sobre couple_members se consulta a si misma y Postgres
-- aborta con «infinite recursion detected in policy». `security definer` corta la
-- recursion: la funcion corre con los permisos de su dueno y no vuelve a pasar por
-- RLS. `set search_path = ''` es obligatorio en cualquier security definer, porque
-- un search_path manipulado haria que la funcion resuelva otra tabla distinta.

create or replace function public.auth_couple_ids()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select couple_id from public.couple_members where user_id = auth.uid()
$$;

revoke all on function public.auth_couple_ids() from public, anon;
grant execute on function public.auth_couple_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Pareja y miembros: solo lectura desde el cliente
-- ---------------------------------------------------------------------------
--
-- Crear una pareja o unirse a ella no puede ser un INSERT directo: en el primer
-- insert el usuario todavia no es miembro, asi que `with check` lo rechazaria.
-- Ese arranque va por funciones security definer (0003_pairing.sql).

alter table public.couples        enable row level security;
alter table public.couple_members enable row level security;

create policy couples_propia on public.couples
  for select to authenticated
  using (id in (select public.auth_couple_ids()));

create policy couple_members_propia on public.couple_members
  for select to authenticated
  using (couple_id in (select public.auth_couple_ids()));

-- ---------------------------------------------------------------------------
-- Contenido: misma politica en todas las tablas
-- ---------------------------------------------------------------------------

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'app_state',
    'citas',
    'letters',
    'sent_letter_logs',
    'partner_profiles',
    'playlists',
    'activity_events',
    'media'
  ] loop
    execute format('alter table public.%I enable row level security', tabla);

    execute format($f$
      create policy %I on public.%I
        for all
        to authenticated
        using      (couple_id in (select public.auth_couple_ids()))
        with check (couple_id in (select public.auth_couple_ids()))
    $f$, tabla || '_de_mi_pareja', tabla);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Nadie anonimo toca nada
-- ---------------------------------------------------------------------------

revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all sequences in schema public from anon;

alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on functions from anon;

-- ---------------------------------------------------------------------------
-- Storage: fotos y videos
-- ---------------------------------------------------------------------------
--
-- Bucket privado. Nunca publico, en ningun momento: un bucket publico es una URL
-- adivinable a material intimo, y una vez indexada no se retira.
--
-- Convencion de rutas: <couple_id>/<media_id>.<ext>. El primer segmento decide.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  209715200, -- 200 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_de_mi_pareja on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in (select public.auth_couple_ids())
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in (select public.auth_couple_ids())
  );
