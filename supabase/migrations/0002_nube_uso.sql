-- Registro de uso Premium para la política de reembolso (7 días, no aplica si hubo exportaciones o uso Premium).
-- Solo se agrega: la persona puede ver sus propios registros, pero no cambiarlos ni borrarlos.
create table public.nube_uso (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  accion text not null check (accion in ('exportar-respaldo', 'exportar-csv', 'importar-contactos', 'subir-nube', 'mesas', 'enlaces', 'plantilla')),
  en timestamptz not null default now()
);
create index nube_uso_usuario on public.nube_uso (user_id, en);

alter table public.nube_uso enable row level security;
revoke all on public.nube_uso from anon, authenticated;
grant select, insert on public.nube_uso to authenticated;
grant usage on sequence public.nube_uso_id_seq to authenticated;

create policy "ver mi uso" on public.nube_uso for select to authenticated
  using (user_id = (select auth.uid()));
create policy "registrar mi uso" on public.nube_uso for insert to authenticated
  with check (user_id = (select auth.uid()) and en > now() - interval '1 minute');

-- Para atender una solicitud de reembolso (SQL Editor, como propietario):
-- select a.pagado_en, u.accion, u.en from public.nube_accesos a
--   left join public.nube_uso u on u.user_id = a.user_id and u.en >= a.pagado_en
--   where a.user_id = (select id from auth.users where email = '<correo>') order by u.en;
