-- Fase 1 — Esquema base
--
-- Los ids son `text`, no `uuid`, a proposito: los datos que hay hoy en el navegador
-- usan ids como `media-1700000000000-abc` y `sent_letter_logs.letter_id` apunta a
-- ellos. Con `text` la migracion es uno a uno y no hay que remapear referencias.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Pareja y miembros
-- ---------------------------------------------------------------------------

create table public.couples (
  id         text primary key default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id    text not null references public.couples(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text,
  slot         smallint not null check (slot in (0, 1)),
  joined_at    timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- Una persona pertenece como maximo a una pareja. Sin esto, `auth_couple_ids()`
-- devolveria varias filas y el aislamiento dejaria de ser una relacion 1:1.
create unique index couple_members_one_couple_per_user
  on public.couple_members (user_id);

-- Cada lado de la pareja ocupa un hueco distinto.
create unique index couple_members_unique_slot
  on public.couple_members (couple_id, slot);

-- Una pareja son dos personas. Lo garantiza la base, no la interfaz.
create or replace function public.enforce_couple_size()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'Una pareja no puede tener mas de dos miembros';
  end if;
  return new;
end $$;

create trigger couple_members_limit
  before insert on public.couple_members
  for each row execute function public.enforce_couple_size();

-- ---------------------------------------------------------------------------
-- Contenido
-- ---------------------------------------------------------------------------

create table public.app_state (
  couple_id                       text primary key references public.couples(id) on delete cascade,
  met_since                       date,
  current_relationship_status_id  text default '',
  relationship_statuses           jsonb not null default '[]'::jsonb,
  show_couple_summary             boolean not null default true,
  updated_at                      timestamptz not null default now()
);

create table public.citas (
  id             text primary key default gen_random_uuid()::text,
  couple_id      text not null references public.couples(id) on delete cascade,
  date           date,
  note           text not null default '',
  lugar          text not null default '',
  hora_encuentro text not null default '',
  created_at     timestamptz not null default now()
);

create table public.letters (
  id         text primary key default gen_random_uuid()::text,
  couple_id  text not null references public.couples(id) on delete cascade,
  subject    text not null default '',
  body       text not null default '',
  created_at timestamptz not null default now()
);

create table public.sent_letter_logs (
  id           text primary key default gen_random_uuid()::text,
  couple_id    text not null references public.couples(id) on delete cascade,
  letter_id    text,
  subject      text not null default '',
  body_preview text not null default '',
  sent_at      timestamptz not null default now()
);

create table public.partner_profiles (
  couple_id                     text not null references public.couples(id) on delete cascade,
  slot                          smallint not null check (slot in (0, 1)),
  nombre                        text not null default '',
  apellido                      text not null default '',
  fecha_nacimiento              text not null default '',
  color_favorito                text not null default '',
  comida_favorita               text not null default '',
  lo_que_mas_le_encanta_del_otro text not null default '',
  lugar_favorito                text not null default '',
  deporte_favorito              text not null default '',
  que_los_hace_unicos           text not null default '',
  profile_photo_path            text,
  updated_at                    timestamptz not null default now(),
  primary key (couple_id, slot)
);

create table public.playlists (
  id         text primary key default gen_random_uuid()::text,
  couple_id  text not null references public.couples(id) on delete cascade,
  platform   text not null default 'spotify',
  url        text not null default '',
  name       text not null default '',
  created_by text not null default '',
  image_url  text,
  added_at   timestamptz not null default now()
);

create table public.activity_events (
  id            text primary key default gen_random_uuid()::text,
  couple_id     text not null references public.couples(id) on delete cascade,
  type          text not null default 'generic',
  description   text not null default '',
  profile_index smallint not null default 0,
  created_at    timestamptz not null default now()
);

-- El binario vive en Storage; aqui solo la ruta y los metadatos.
create table public.media (
  id                      text primary key default gen_random_uuid()::text,
  couple_id               text not null references public.couples(id) on delete cascade,
  type                    text not null check (type in ('photo', 'video')),
  storage_path            text not null,
  thumbnail_path          text,
  mime_type               text not null default 'application/octet-stream',
  size                    bigint not null default 0,
  date                    date,
  relationship_status_id  text,
  caption                 text not null default '',
  show_on_landing         boolean not null default false,
  created_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indices de lectura: toda consulta filtra por pareja
-- ---------------------------------------------------------------------------

create index citas_couple_date_idx            on public.citas (couple_id, date desc);
create index letters_couple_created_idx       on public.letters (couple_id, created_at desc);
create index sent_letter_logs_couple_idx      on public.sent_letter_logs (couple_id, sent_at desc);
create index playlists_couple_idx             on public.playlists (couple_id, added_at desc);
create index activity_events_couple_idx       on public.activity_events (couple_id, created_at desc);
create index media_couple_created_idx         on public.media (couple_id, created_at);
create index media_couple_landing_idx         on public.media (couple_id) where show_on_landing;
