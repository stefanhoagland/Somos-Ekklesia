"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirAdmin, exigirLider } from "@/lib/permisos";
import { normalizarFecha, type Estado, type FilaImportar } from "@/lib/miembros";

const ESTADOS: Estado[] = ["miembro", "visitante", "inactivo"];
const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function datosDelFormulario(f: FormData) {
  const estado = texto(f, "estado") as Estado;
  return {
    nombre: texto(f, "nombre"),
    apellidos: texto(f, "apellidos"),
    email: texto(f, "email").toLowerCase(),
    telefono: texto(f, "telefono"),
    fecha_nacimiento: normalizarFecha(texto(f, "fechaNacimiento")),
    direccion: texto(f, "direccion"),
    estado: ESTADOS.includes(estado) ? estado : "miembro",
    notas: texto(f, "notas"),
  };
}

// Crea o actualiza un miembro. Siempre dentro de la iglesia del usuario.
export async function guardarMiembro(f: FormData) {
  const u = await exigirLider();
  const datos = datosDelFormulario(f);
  if (!datos.nombre) redirect("/panel/miembros?error=" + encodeURIComponent("El nombre es obligatorio."));

  const id = texto(f, "id");
  if (id) {
    await sql`
      update miembros set ${sql(datos)}
      where id = ${id} and iglesia_id = ${u.iglesiaId}
    `;
  } else {
    await sql`insert into miembros ${sql({ ...datos, iglesia_id: u.iglesiaId })}`;
  }
  revalidatePath("/panel/miembros");
  redirect("/panel/miembros?aviso=" + encodeURIComponent("Guardado."));
}

export async function borrarMiembro(f: FormData) {
  const u = await exigirAdmin();
  await sql`delete from miembros where id = ${texto(f, "id")} and iglesia_id = ${u.iglesiaId}`;
  revalidatePath("/panel/miembros");
  redirect("/panel/miembros?aviso=" + encodeURIComponent("Miembro borrado."));
}

// Importa filas ya leídas del Excel en el navegador. Devuelve cuántas se crearon.
export async function importarMiembros(
  filas: FilaImportar[],
): Promise<{ creados: number; omitidos: number }> {
  const u = await exigirLider();
  const limpias = filas
    .slice(0, 5000)
    .map((r) => ({
      iglesia_id: u.iglesiaId,
      nombre: (r.nombre ?? "").trim().slice(0, 200),
      apellidos: (r.apellidos ?? "").trim().slice(0, 200),
      email: (r.email ?? "").trim().toLowerCase().slice(0, 200),
      telefono: (r.telefono ?? "").trim().slice(0, 50),
      fecha_nacimiento: normalizarFecha(r.fechaNacimiento),
      direccion: (r.direccion ?? "").trim().slice(0, 500),
      notas: (r.notas ?? "").trim().slice(0, 2000),
    }))
    .filter((r) => r.nombre);

  // Todo o nada: si algo falla, no se guarda ninguna fila.
  await sql.begin(async (tx) => {
    for (let i = 0; i < limpias.length; i += 500) {
      await tx`insert into miembros ${tx(limpias.slice(i, i + 500))}`;
    }
  });
  revalidatePath("/panel/miembros");
  return { creados: limpias.length, omitidos: filas.length - limpias.length };
}
