-- Nube de invitados de synode.space: pago único por cuenta y una lista por cuenta.
-- El navegador solo puede leer su propio acceso. Únicamente el webhook de Stripe (service_role) lo activa.

create table public.nube_accesos (
  user_id uuid primary key references auth.users (id) on delete cascade,
  estado text not null check (estado in ('pagado', 'reembolsado', 'disputa')),
  session_id text not null,
  payment_intent text unique,
  monto_centavos integer not null check (monto_centavos > 0),
  livemode boolean not null,
  pagado_en timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table public.nube_listas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  datos jsonb not null check (jsonb_typeof(datos) = 'array' and octet_length(datos::text) <= 6000000),
  total integer not null check (total between 0 and 5000),
  actualizado timestamptz not null default now()
);

create table public.nube_eventos (
  event_id text primary key,
  tipo text not null,
  recibido timestamptz not null default now()
);

create function public.nube_tocar() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado := now();
  return new;
end $$;

create trigger nube_listas_tocar before insert or update on public.nube_listas
  for each row execute function public.nube_tocar();

alter table public.nube_accesos enable row level security;
alter table public.nube_listas enable row level security;
alter table public.nube_eventos enable row level security;

revoke all on public.nube_accesos, public.nube_listas, public.nube_eventos from anon, authenticated;
grant select on public.nube_accesos to authenticated;
grant select, insert, update, delete on public.nube_listas to authenticated;

create policy "ver mi acceso" on public.nube_accesos for select to authenticated
  using (user_id = (select auth.uid()));

-- Leer y borrar siguen permitidos tras un reembolso: la persona siempre puede recuperar o eliminar sus datos.
create policy "ver mi lista" on public.nube_listas for select to authenticated
  using (user_id = (select auth.uid()));
create policy "borrar mi lista" on public.nube_listas for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "crear mi lista pagada" on public.nube_listas for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.nube_accesos a where a.user_id = (select auth.uid()) and a.estado = 'pagado')
  );
create policy "cambiar mi lista pagada" on public.nube_listas for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.nube_accesos a where a.user_id = (select auth.uid()) and a.estado = 'pagado')
  );

-- Idempotente por event_id. Devuelve aplicado, repetido o sin-acceso.
create function public.nube_aplicar_evento(
  p_event_id text, p_tipo text, p_estado text, p_user_id uuid,
  p_session_id text, p_payment_intent text, p_monto integer, p_livemode boolean
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  filas integer;
begin
  if p_estado not in ('pagado', 'reembolsado', 'disputa') then
    raise exception 'estado inválido';
  end if;

  insert into public.nube_eventos (event_id, tipo) values (p_event_id, p_tipo)
    on conflict (event_id) do nothing;
  get diagnostics filas = row_count;
  if filas = 0 then
    return 'repetido';
  end if;

  if p_estado = 'pagado' then
    insert into public.nube_accesos (user_id, estado, session_id, payment_intent, monto_centavos, livemode)
    values (p_user_id, 'pagado', p_session_id, p_payment_intent, p_monto, p_livemode)
    on conflict (user_id) do update set
      estado = 'pagado', session_id = excluded.session_id, payment_intent = excluded.payment_intent,
      monto_centavos = excluded.monto_centavos, livemode = excluded.livemode,
      pagado_en = now(), actualizado = now();
    return 'aplicado';
  end if;

  update public.nube_accesos set estado = p_estado, actualizado = now()
    where payment_intent = p_payment_intent;
  get diagnostics filas = row_count;
  return case when filas = 0 then 'sin-acceso' else 'aplicado' end;
end $$;

revoke all on function public.nube_aplicar_evento(text, text, text, uuid, text, text, integer, boolean) from public, anon, authenticated;
grant execute on function public.nube_aplicar_evento(text, text, text, uuid, text, text, integer, boolean) to service_role;
