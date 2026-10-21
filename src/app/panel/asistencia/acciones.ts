"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirAdmin, exigirLider } from "@/lib/permisos";
import { normalizarFecha } from "@/lib/miembros";

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function crearEvento(f: FormData) {
  const u = await exigirLider();
  const nombre = texto(f, "nombre");
  const fecha = normalizarFecha(texto(f, "fecha"));
  if (!nombre || !fecha) redirect("/panel/asistencia?error=" + encodeURIComponent("Pon un nombre y una fecha."));
  const [e] = await sql<{ id: string }[]>`
    insert into eventos (iglesia_id, nombre, fecha)
    values (${u.iglesiaId}, ${nombre}, ${fecha})
    returning id
  `;
  redirect(`/panel/asistencia/${e.id}`);
}

// Guarda la lista completa de asistentes de un evento.
export async function guardarAsistencia(f: FormData) {
  const u = await exigirLider();
  const eventoId = texto(f, "eventoId");
  const ids = f.getAll("presente").map(String);

  await sql.begin(async (tx) => {
    const [e] = await tx`select 1 from eventos where id = ${eventoId} and iglesia_id = ${u.iglesiaId}`;
    if (!e) return;
    await tx`delete from asistencias where evento_id = ${eventoId}`;
    if (ids.length) {
      // Solo miembros de la misma iglesia.
      await tx`
        insert into asistencias (evento_id, miembro_id)
        select ${eventoId}, id from miembros
        where iglesia_id = ${u.iglesiaId} and id = any(${ids}::uuid[])
      `;
    }
  });
  revalidatePath(`/panel/asistencia/${eventoId}`);
  redirect(`/panel/asistencia/${eventoId}?aviso=` + encodeURIComponent(`Asistencia guardada: ${ids.length} personas.`));
}

// Añade a alguien nuevo como visitante y lo marca presente.
export async function anadirVisitante(f: FormData) {
  const u = await exigirLider();
  const eventoId = texto(f, "eventoId");
  const nombre = texto(f, "nombre");
  if (!nombre) redirect(`/panel/asistencia/${eventoId}`);
  await sql.begin(async (tx) => {
    const [e] = await tx`select 1 from eventos where id = ${eventoId} and iglesia_id = ${u.iglesiaId}`;
    if (!e) return;
    const [m] = await tx<{ id: string }[]>`
      insert into miembros (iglesia_id, nombre, apellidos, telefono, estado)
      values (${u.iglesiaId}, ${nombre}, ${texto(f, "apellidos")}, ${texto(f, "telefono")}, 'visitante')
      returning id
    `;
    await tx`insert into asistencias (evento_id, miembro_id) values (${eventoId}, ${m.id})`;
  });
  revalidatePath(`/panel/asistencia/${eventoId}`);
  redirect(`/panel/asistencia/${eventoId}?aviso=` + encodeURIComponent(`${nombre} añadido como visitante.`));
}

export async function borrarEvento(f: FormData) {
  const u = await exigirAdmin();
  await sql`delete from eventos where id = ${texto(f, "eventoId")} and iglesia_id = ${u.iglesiaId}`;
  revalidatePath("/panel/asistencia");
  redirect("/panel/asistencia?aviso=" + encodeURIComponent("Evento borrado."));
}
