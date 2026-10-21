-- Base de datos de miembros y control de asistencia, separada por iglesia.

create type estado_miembro as enum ('miembro', 'visitante', 'inactivo');

create table miembros (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references iglesias (id) on delete cascade,
  nombre text not null,
  apellidos text not null default '',
  email text not null default '',
  telefono text not null default '',
  fecha_nacimiento date,
  direccion text not null default '',
  estado estado_miembro not null default 'miembro',
  notas text not null default '',
  creado_en timestamptz not null default now()
);

create index miembros_iglesia on miembros (iglesia_id, apellidos, nombre);

-- Un culto, reunión de grupo o actividad en la que se pasa lista.
create table eventos (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references iglesias (id) on delete cascade,
  nombre text not null,
  fecha date not null,
  creado_en timestamptz not null default now()
);

create index eventos_iglesia on eventos (iglesia_id, fecha desc);

create table asistencias (
  evento_id uuid not null references eventos (id) on delete cascade,
  miembro_id uuid not null references miembros (id) on delete cascade,
  primary key (evento_id, miembro_id)
);

create index asistencias_miembro on asistencias (miembro_id);
