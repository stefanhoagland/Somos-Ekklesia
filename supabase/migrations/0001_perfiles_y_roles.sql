-- Perfiles de usuario y roles (administrador, líder, miembro).
-- Ejecuta este archivo una vez en Supabase: SQL Editor > New query > pegar > Run.

create type public.rol as enum ('admin', 'lider', 'miembro');

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  email text not null,
  rol public.rol not null default 'miembro',
  creado_en timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- Devuelve el rol del usuario que hace la consulta.
create or replace function public.mi_rol()
returns public.rol
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

-- Cada persona ve su propio perfil; líderes y administradores ven todos.
create policy "ver perfiles" on public.perfiles
  for select using (id = auth.uid() or public.mi_rol() in ('admin', 'lider'));

-- Cada persona puede cambiar su nombre.
create policy "editar mi perfil" on public.perfiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and rol = public.mi_rol());

-- Solo los administradores pueden cambiar roles de otros.
create policy "admin edita perfiles" on public.perfiles
  for update using (public.mi_rol() = 'admin');

-- Crea el perfil al registrarse. La primera persona registrada es administrador.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    new.email,
    case when exists (select 1 from public.perfiles) then 'miembro'::public.rol else 'admin'::public.rol end
  );
  return new;
end;
$$;

create trigger al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil();
