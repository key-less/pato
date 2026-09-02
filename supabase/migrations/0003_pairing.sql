-- Fase 1 — Crear pareja, invitar, unirse, borrar cuenta
--
-- Este es el punto mas delicado del sistema: el mecanismo por el que una segunda
-- persona pasa a ver TODOS los recuerdos. Un codigo debil aqui anula el resto de
-- las politicas.
--
-- El token nunca se guarda en claro: en la tabla vive solo su sha256. Quien lea la
-- tabla no puede usarlo. Un solo uso, 24 horas, y el canje entero ocurre dentro de
-- una transaccion con la fila bloqueada, para que dos canjes simultaneos no se
-- cuelen los dos.

create table public.couple_invites (
  token_hash  text primary key,
  couple_id   text not null references public.couples(id) on delete cascade,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references auth.users(id)
);

create index couple_invites_couple_idx on public.couple_invites (couple_id);

-- RLS activo y sin ninguna politica: la tabla de hashes no es legible ni escribible
-- desde el cliente bajo ninguna circunstancia. Todo pasa por las funciones de abajo.
alter table public.couple_invites enable row level security;

-- ---------------------------------------------------------------------------
-- Crear pareja
-- ---------------------------------------------------------------------------
--
-- No puede ser un INSERT directo: en ese momento el usuario todavia no es miembro,
-- asi que el `with check` de couple_members lo rechazaria.

create or replace function public.create_couple(display_name text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo_id text;
begin
  if auth.uid() is null then
    raise exception 'Hay que iniciar sesion';
  end if;

  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'Ya perteneces a una pareja';
  end if;

  insert into public.couples default values returning id into nuevo_id;

  insert into public.couple_members (couple_id, user_id, display_name, slot)
  values (nuevo_id, auth.uid(), display_name, 0);

  insert into public.app_state (couple_id, met_since, current_relationship_status_id, relationship_statuses)
  values (
    nuevo_id,
    current_date,
    'conociendose',
    '[{"id":"conociendose","label":"Conociendonos","order":1},
      {"id":"poniendose_serio","label":"Se va poniendo serio","order":2},
      {"id":"ya_casi","label":"Ya casi","order":3},
      {"id":"somos_pareja","label":"Somos pareja","order":4},
      {"id":"casados","label":"Estamos casados","order":5}]'::jsonb
  );

  return nuevo_id;
end $$;

-- ---------------------------------------------------------------------------
-- Crear invitacion
-- ---------------------------------------------------------------------------
--
-- Devuelve el token en claro UNA sola vez. No se puede volver a consultar.

create or replace function public.create_invite()
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  mi_couple text;
  miembros  int;
  nuevo     text;
  caduca    timestamptz;
begin
  select couple_id into mi_couple
  from public.couple_members
  where user_id = auth.uid();

  if mi_couple is null then
    raise exception 'Todavia no tienes una pareja creada';
  end if;

  select count(*) into miembros from public.couple_members where couple_id = mi_couple;
  if miembros >= 2 then
    raise exception 'Esta pareja ya esta completa';
  end if;

  -- 32 bytes de entropia. Ni un numero corto ni un uuid adivinable.
  nuevo  := encode(extensions.gen_random_bytes(32), 'hex');
  caduca := now() + interval '24 hours';

  -- Una invitacion viva por pareja: crear una nueva invalida la anterior.
  delete from public.couple_invites where couple_id = mi_couple and consumed_at is null;

  insert into public.couple_invites (token_hash, couple_id, created_by, expires_at)
  values (encode(extensions.digest(nuevo, 'sha256'), 'hex'), mi_couple, auth.uid(), caduca);

  return query select nuevo, caduca;
end $$;

-- ---------------------------------------------------------------------------
-- Canjear invitacion
-- ---------------------------------------------------------------------------

create or replace function public.redeem_invite(token text, display_name text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitacion public.couple_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Hay que iniciar sesion';
  end if;

  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'Ya perteneces a una pareja';
  end if;

  -- `for update` serializa dos canjes simultaneos del mismo token.
  select * into invitacion
  from public.couple_invites
  where token_hash = encode(extensions.digest(token, 'sha256'), 'hex')
    and consumed_at is null
    and expires_at > now()
  for update;

  if invitacion.token_hash is null then
    raise exception 'Esa invitacion no vale: puede haber caducado o haberse usado ya';
  end if;

  if invitacion.created_by = auth.uid() then
    raise exception 'No puedes usar tu propia invitacion';
  end if;

  -- El trigger de tamano maximo es la ultima red si algo de lo anterior falla.
  insert into public.couple_members (couple_id, user_id, display_name, slot)
  values (invitacion.couple_id, auth.uid(), display_name, 1);

  update public.couple_invites
  set consumed_at = now(), consumed_by = auth.uid()
  where token_hash = invitacion.token_hash;

  return invitacion.couple_id;
end $$;

-- ---------------------------------------------------------------------------
-- Borrar la cuenta
-- ---------------------------------------------------------------------------
--
-- Apple lo exige dentro de la app para cualquier app con registro (guideline
-- 5.1.1(v)). No vale un enlace a un correo.
--
-- Si queda la otra persona, la pareja y su contenido siguen en pie: irse no puede
-- borrar los recuerdos de alguien mas. Solo cuando no queda nadie se borra todo.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mi_couple text;
  quedan    int;
begin
  if auth.uid() is null then
    raise exception 'Hay que iniciar sesion';
  end if;

  select couple_id into mi_couple
  from public.couple_members
  where user_id = auth.uid();

  delete from public.couple_members where user_id = auth.uid();

  if mi_couple is not null then
    select count(*) into quedan from public.couple_members where couple_id = mi_couple;

    if quedan = 0 then
      -- Borrar la fila de storage.objects borra tambien el archivo.
      delete from storage.objects
      where bucket_id = 'media' and (storage.foldername(name))[1] = mi_couple;

      -- El resto del contenido cae por ON DELETE CASCADE.
      delete from public.couples where id = mi_couple;
    end if;
  end if;

  delete from auth.users where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------

revoke all on function public.create_couple(text)          from public, anon;
revoke all on function public.create_invite()              from public, anon;
revoke all on function public.redeem_invite(text, text)    from public, anon;
revoke all on function public.delete_my_account()          from public, anon;

grant execute on function public.create_couple(text)       to authenticated;
grant execute on function public.create_invite()           to authenticated;
grant execute on function public.redeem_invite(text, text) to authenticated;
grant execute on function public.delete_my_account()       to authenticated;
