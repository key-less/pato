-- Test de aislamiento entre parejas
--
-- Esto es lo que decide si la Fase 1 puede tocar datos reales. No basta con que la
-- interfaz no muestre los recuerdos de otra pareja: hay que comprobar que la base
-- los niega cuando alguien pregunta por ellos a proposito.
--
-- Ejecutar contra un proyecto de pruebas, NUNCA contra produccion:
--
--   supabase start
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" \
--     -f supabase/tests/rls_aislamiento.sql
--
-- Todo corre dentro de una transaccion que se revierte al final.

begin;

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function pg_temp.como(usuario uuid) returns void
language plpgsql as $$
begin
  execute 'set local role authenticated';
  execute format('set local request.jwt.claims = %L', json_build_object('sub', usuario, 'role', 'authenticated')::text);
end $$;

create or replace function pg_temp.como_admin() returns void
language plpgsql as $$
begin
  execute 'set local role postgres';
  execute 'set local request.jwt.claims = ''''';
end $$;

create or replace function pg_temp.exige(condicion boolean, mensaje text) returns void
language plpgsql as $$
begin
  if not condicion then
    raise exception 'FALLO: %', mensaje;
  end if;
  raise notice 'ok — %', mensaje;
end $$;

-- ---------------------------------------------------------------------------
-- Tres personas: Ana y Beto son pareja; Caro es de fuera
-- ---------------------------------------------------------------------------

select pg_temp.como_admin();

insert into auth.users (id, email, instance_id, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.local',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'caro@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'dani@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

-- ---------------------------------------------------------------------------
-- 1. Ana crea su pareja y guarda una cita
-- ---------------------------------------------------------------------------

select pg_temp.como('11111111-1111-1111-1111-111111111111');

select set_config('test.couple_ana', public.create_couple('Ana'), false);

insert into public.citas (couple_id, date, note, lugar)
values (current_setting('test.couple_ana'), current_date, 'Primera cita', 'El parque');

select pg_temp.exige(
  (select count(*) from public.citas) = 1,
  'Ana ve su propia cita'
);

select pg_temp.exige(
  (select count(*) from public.app_state) = 1,
  'create_couple sembro el estado inicial'
);

-- ---------------------------------------------------------------------------
-- 2. Caro, desde fuera, no puede leer nada de Ana
-- ---------------------------------------------------------------------------

select pg_temp.como('33333333-3333-3333-3333-333333333333');

select pg_temp.exige(
  (select count(*) from public.citas) = 0,
  'Caro no ve ninguna cita sin tener pareja'
);

-- Y tampoco preguntando explicitamente por el couple_id de Ana.
select pg_temp.exige(
  (select count(*) from public.citas where couple_id = current_setting('test.couple_ana')) = 0,
  'Caro no ve las citas de Ana pidiendolas por su couple_id'
);

select pg_temp.exige(
  (select count(*) from public.couples) = 0,
  'Caro no ve la pareja de Ana'
);

select pg_temp.exige(
  (select count(*) from public.app_state) = 0,
  'Caro no ve el estado de la pareja de Ana'
);

-- ---------------------------------------------------------------------------
-- 3. La prueba del `with check`: Caro no puede ESCRIBIR en el espacio de Ana
-- ---------------------------------------------------------------------------
--
-- Este es el fallo mas comun al escribir RLS. Con solo `using`, este insert pasa.

do $$
begin
  insert into public.citas (couple_id, date, note)
  values (current_setting('test.couple_ana'), current_date, 'Inyectada por Caro');
  raise exception 'FALLO: Caro pudo insertar una cita en la pareja de Ana';
exception
  when insufficient_privilege or check_violation then
    raise notice 'ok — Caro no puede insertar en la pareja de Ana';
end $$;

do $$
begin
  insert into public.media (couple_id, type, storage_path, mime_type)
  values (current_setting('test.couple_ana'), 'photo', 'robada.jpg', 'image/jpeg');
  raise exception 'FALLO: Caro pudo insertar media en la pareja de Ana';
exception
  when insufficient_privilege or check_violation then
    raise notice 'ok — Caro no puede insertar media en la pareja de Ana';
end $$;

-- Un UPDATE ciego tampoco alcanza nada.
update public.citas set note = 'modificada' where couple_id = current_setting('test.couple_ana');
select pg_temp.exige(
  (select count(*) from public.citas where note = 'modificada') = 0,
  'Caro no puede modificar las citas de Ana'
);

-- ---------------------------------------------------------------------------
-- 4. La tabla de invitaciones no es legible por nadie
-- ---------------------------------------------------------------------------

select pg_temp.como('11111111-1111-1111-1111-111111111111');
select set_config('test.token', (select token from public.create_invite()), false);

select pg_temp.exige(
  (select count(*) from public.couple_invites) = 0,
  'Ni la propia Ana puede leer la tabla de hashes de invitacion'
);

select pg_temp.como_admin();
select pg_temp.exige(
  (select count(*) from public.couple_invites where token_hash = current_setting('test.token')) = 0,
  'El token nunca se guarda en claro'
);

-- ---------------------------------------------------------------------------
-- 5. Beto canjea la invitacion y entonces si ve los recuerdos
-- ---------------------------------------------------------------------------

select pg_temp.como('22222222-2222-2222-2222-222222222222');

select pg_temp.exige(
  (select count(*) from public.citas) = 0,
  'Beto no ve nada antes de canjear'
);

select public.redeem_invite(current_setting('test.token'), 'Beto');

select pg_temp.exige(
  (select count(*) from public.citas) = 1,
  'Beto ve la cita despues de unirse'
);

select pg_temp.exige(
  (select count(*) from public.couple_members) = 2,
  'Beto ve a los dos miembros de la pareja'
);

-- ---------------------------------------------------------------------------
-- 6. El token es de un solo uso
-- ---------------------------------------------------------------------------

select pg_temp.como('33333333-3333-3333-3333-333333333333');

do $$
begin
  perform public.redeem_invite(current_setting('test.token'), 'Caro');
  raise exception 'FALLO: el token se pudo canjear dos veces';
exception
  when raise_exception then
    if position('FALLO' in sqlerrm) > 0 then raise; end if;
    raise notice 'ok — el token no se puede canjear dos veces';
end $$;

-- ---------------------------------------------------------------------------
-- 7. No entra una tercera persona
-- ---------------------------------------------------------------------------

select pg_temp.como('11111111-1111-1111-1111-111111111111');

do $$
begin
  perform public.create_invite();
  raise exception 'FALLO: se pudo invitar con la pareja ya completa';
exception
  when raise_exception then
    if position('FALLO' in sqlerrm) > 0 then raise; end if;
    raise notice 'ok — no se puede invitar con la pareja completa';
end $$;

-- Ni forzando la insercion como administrador: el trigger la frena.
select pg_temp.como_admin();
do $$
begin
  insert into public.couple_members (couple_id, user_id, slot)
  values (current_setting('test.couple_ana'), '44444444-4444-4444-4444-444444444444', 0);
  raise exception 'FALLO: entro un tercer miembro';
exception
  when raise_exception or unique_violation then
    if position('FALLO' in sqlerrm) > 0 then raise; end if;
    raise notice 'ok — el trigger frena a un tercer miembro';
end $$;

-- ---------------------------------------------------------------------------
-- 8. Irse no borra los recuerdos de quien se queda
-- ---------------------------------------------------------------------------

select pg_temp.como('22222222-2222-2222-2222-222222222222');
select public.delete_my_account();

select pg_temp.como('11111111-1111-1111-1111-111111111111');
select pg_temp.exige(
  (select count(*) from public.citas) = 1,
  'Ana conserva sus recuerdos despues de que Beto borre su cuenta'
);

-- ---------------------------------------------------------------------------

select pg_temp.como_admin();
\echo ''
\echo '================================================'
\echo '  Aislamiento verificado. Ninguna fuga entre parejas.'
\echo '================================================'

rollback;
