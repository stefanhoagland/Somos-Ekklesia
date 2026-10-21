"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirUsuario, type Rol } from "@/lib/sesion";

// El administrador de una iglesia solo reparte estos roles.
// Nombrar o quitar administradores es cosa del superadministrador (página Iglesias).
const ROLES_ADMIN: Rol[] = ["lider", "miembro"];

export async function cambiarRol(f: FormData) {
  const yo = await exigirUsuario();
  if (!yo.iglesiaId || yo.rol !== "admin") return;

  const id = String(f.get("id"));
  const rol = String(f.get("rol")) as Rol;
  if (!ROLES_ADMIN.includes(rol) || id === yo.id) return;

  // Solo dentro de la misma iglesia, y nunca sobre otro administrador.
  await sql`
    update usuarios set rol = ${rol}
    where id = ${id} and iglesia_id = ${yo.iglesiaId} and rol <> 'admin'
  `;
  revalidatePath("/panel/usuarios");
}
