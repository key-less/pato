-- Cartas con fecha
--
-- Una carta puede quedar sellada hasta un dia: un aniversario, un cumpleanos, el
-- lunes que sabes que va a ser duro.
--
-- El sellado se impone en la base, no en la interfaz. Si solo lo hiciera la
-- interfaz, bastaria con abrir las herramientas del navegador para adelantarse, y
-- entonces la funcion no seria una sorpresa sino un adorno.

alter table public.letters
  add column unlocks_at date,
  add column author_id  uuid default auth.uid() references auth.users(id) on delete set null;

create index letters_selladas_idx
  on public.letters (couple_id, unlocks_at)
  where unlocks_at is not null;

-- ---------------------------------------------------------------------------
-- Politicas por comando
-- ---------------------------------------------------------------------------
--
-- La politica generica de 0002 valia para todo por igual. Las cartas necesitan
-- distinguir leer de escribir, asi que se sustituye.

drop policy if exists letters_de_mi_pareja on public.letters;

-- Leer: la pareja ve todo menos una carta sellada que escribio la otra persona.
create policy letters_lectura on public.letters
  for select to authenticated
  using (
    couple_id in (select public.auth_couple_ids())
    and (
      unlocks_at is null
      or unlocks_at <= current_date
      or author_id is not distinct from auth.uid()
    )
  );

create policy letters_insercion on public.letters
  for insert to authenticated
  with check (couple_id in (select public.auth_couple_ids()));

-- Editar y borrar: sobre lo que se puede leer. Como una carta sellada ajena no se
-- puede leer, tampoco se puede desellar quitandole la fecha.
create policy letters_edicion on public.letters
  for update to authenticated
  using (
    couple_id in (select public.auth_couple_ids())
    and (
      unlocks_at is null
      or unlocks_at <= current_date
      or author_id is not distinct from auth.uid()
    )
  )
  with check (couple_id in (select public.auth_couple_ids()));

create policy letters_borrado on public.letters
  for delete to authenticated
  using (
    couple_id in (select public.auth_couple_ids())
    and (
      unlocks_at is null
      or unlocks_at <= current_date
      or author_id is not distinct from auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Que se sepa que llega, sin poder leerla
-- ---------------------------------------------------------------------------
--
-- Sin esto la carta sellada seria invisible y se perderia lo mejor: la espera.
-- Devuelve solo el id y el dia. Ni el asunto, para que la sorpresa sea entera.

create or replace function public.cartas_selladas()
returns table (id text, unlocks_at date)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.unlocks_at
  from public.letters l
  where l.couple_id in (select public.auth_couple_ids())
    and l.unlocks_at is not null
    and l.unlocks_at > current_date
    and l.author_id is distinct from auth.uid()
$$;

revoke all on function public.cartas_selladas() from public, anon;
grant execute on function public.cartas_selladas() to authenticated;
