-- Registro de invitaciones enviadas por correo, para no repetirlas sin querer.
create table invitaciones (
  iglesia_id uuid not null references iglesias (id) on delete cascade,
  email text not null,
  enviado_en timestamptz not null default now(),
  enviado_por uuid references usuarios (id) on delete set null,
  primary key (iglesia_id, email)
);
