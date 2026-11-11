-- Pato iOS: parejas, registros compartidos, presencia en vivo y fotos.
-- Ejecuta este archivo en el SQL Editor de tu proyecto de Supabase.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- Cada usuario pertenece como máximo a una pareja.
create table if not exists public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index if not exists members_couple_idx on public.members (couple_id);

-- Recuerdos, fechas, cartas, perfiles y datos de la relación.
-- `payload` es el JSON que escribe la app; `updated_at` son segundos Unix
-- del teléfono que hizo el cambio (gana la última escritura).
create table if not exists public.items (
  couple_id uuid not null references public.couples (id) on delete cascade,
  id uuid not null,
  kind text not null check (kind in ('memory', 'specialDate', 'letter', 'profile', 'couple')),
  payload jsonb not null,
  updated_at double precision not null,
  deleted boolean not null default false,
  primary key (couple_id, id)
);

-- Lo que cada persona comparte en vivo: ubicación, ánimo, música y resumen de ciclo.
create table if not exists public.presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  data jsonb not null,
  updated_at double precision not null
);
create index if not exists presence_couple_idx on public.presence (couple_id);

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.members where user_id = auth.uid();
$$;

create or replace function public.create_couple()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select c.invite_code into new_code
    from public.couples c join public.members m on m.couple_id = c.id
    where m.user_id = auth.uid();
  if new_code is not null then
    return new_code;
  end if;
  loop
    -- 6 caracteres sin letras/números confusos (0, O, 1, I).
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(gen_random_bytes(1), 0) % 32), 1), '')
      into new_code from generate_series(1, 6);
    begin
      insert into public.couples (invite_code) values (new_code) returning id into new_id;
      exit;
    exception when unique_violation then
      -- código repetido: se intenta con otro
    end;
  end loop;
  insert into public.members (user_id, couple_id) values (auth.uid(), new_id);
  return new_code;
end;
$$;

create or replace function public.join_couple(invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  current_members int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into target from public.couples where invite_code = upper(trim(invite)) for update;
  if target is null then
    raise exception 'invalid invite code';
  end if;
  select count(*) into current_members from public.members where couple_id = target and user_id <> auth.uid();
  if current_members >= 2 then
    raise exception 'couple is full';
  end if;
  if exists (select 1 from public.members where couple_id = target and user_id = auth.uid()) then
    return target;
  end if;
  delete from public.presence where user_id = auth.uid();
  delete from public.members where user_id = auth.uid();
  insert into public.members (user_id, couple_id) values (auth.uid(), target);
  return target;
end;
$$;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.presence where user_id = auth.uid();
  delete from public.members where user_id = auth.uid();
end;
$$;

revoke all on function public.my_couple_id() from public, anon;
revoke all on function public.create_couple() from public, anon;
revoke all on function public.join_couple(text) from public, anon;
revoke all on function public.leave_couple() from public, anon;
grant execute on function public.my_couple_id() to authenticated;
grant execute on function public.create_couple() to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.leave_couple() to authenticated;

-- ---------------------------------------------------------------------------
-- Seguridad a nivel de fila: solo los dos miembros de la pareja ven sus datos
-- ---------------------------------------------------------------------------

alter table public.couples enable row level security;
alter table public.members enable row level security;
alter table public.items enable row level security;
alter table public.presence enable row level security;

drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples for select to authenticated
  using (id = public.my_couple_id());

drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated
  using (user_id = auth.uid() or couple_id = public.my_couple_id());

drop policy if exists items_all on public.items;
create policy items_all on public.items for all to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

drop policy if exists presence_select on public.presence;
create policy presence_select on public.presence for select to authenticated
  using (couple_id = public.my_couple_id());

drop policy if exists presence_insert on public.presence;
create policy presence_insert on public.presence for insert to authenticated
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());

drop policy if exists presence_update on public.presence;
create policy presence_update on public.presence for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- ---------------------------------------------------------------------------
-- Tiempo real para la presencia
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'presence') then
    alter publication supabase_realtime add table public.presence;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fotos: bucket privado, una carpeta por pareja
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

drop policy if exists media_select on storage.objects;
create policy media_select on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.my_couple_id()::text);

drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = public.my_couple_id()::text);

drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.my_couple_id()::text);

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = public.my_couple_id()::text);
