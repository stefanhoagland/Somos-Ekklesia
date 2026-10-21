-- Iglesias, usuarios y sesiones.
-- Cada usuario pertenece a una iglesia (salvo el superadministrador)
-- y solo ve los datos de su iglesia.

create table iglesias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  -- Código que comparte el administrador para que los miembros se unan.
  codigo text not null unique,
  creado_en timestamptz not null default now()
);

create type rol as enum ('admin', 'lider', 'miembro');

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null default '',
  clave_hash text not null,
  es_superadmin boolean not null default false,
  iglesia_id uuid references iglesias (id) on delete cascade,
  rol rol not null default 'miembro',
  creado_en timestamptz not null default now(),
  -- Todo usuario normal tiene iglesia.
  check (es_superadmin or iglesia_id is not null)
);

create index usuarios_iglesia on usuarios (iglesia_id);

create table sesiones (
  -- Guardamos el hash del token, nunca el token.
  token_hash text primary key,
  usuario_id uuid not null references usuarios (id) on delete cascade,
  expira_en timestamptz not null
);

create index sesiones_usuario on sesiones (usuario_id);
