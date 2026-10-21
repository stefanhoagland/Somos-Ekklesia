"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/sesion";

// Sin letras que se confunden (O/0, I/1).
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nuevoCodigo = () => Array.from({ length: 6 }, () => LETRAS[randomInt(LETRAS.length)]).join("");

export async function crearIglesia(f: FormData) {
  const u = await exigirUsuario();
  if (!u.esSuperadmin) return;
  const nombre = String(f.get("nombre") ?? "").trim();
  if (!nombre) return;
  await sql`insert into iglesias (nombre, codigo) values (${nombre}, ${nuevoCodigo()})`;
  revalidatePath("/panel/iglesias");
}

// El superadministrador entra en una iglesia como su administrador.
export async function unirmeComoAdmin(f: FormData) {
  const u = await exigirUsuario();
  if (!u.esSuperadmin) return;
  await sql`
    update usuarios set iglesia_id = ${String(f.get("id"))}, rol = 'admin'
    where id = ${u.id}
  `;
  revalidatePath("/panel", "layout");
}

// El superadministrador cambia el rol de cualquier persona de cualquier iglesia.
// No deja una iglesia sin administradores.
export async function cambiarRolEnIglesia(
  f: FormData,
): Promise<void> {
  const u = await exigirUsuario();
  if (!u.esSuperadmin) return;
  const id = String(f.get("id"));
  const iglesiaId = String(f.get("iglesiaId"));
  const rol = String(f.get("rol"));
  if (!["admin", "lider", "miembro"].includes(rol) || id === u.id) return;

  const quedaSinAdmin = await sql.begin(async (tx) => {
    // Bloquea la iglesia para que dos cambios a la vez no la dejen sin administradores.
    await tx`select 1 from iglesias where id = ${iglesiaId} for update`;
    const [{ otros }] = await tx<{ otros: number }[]>`
      select count(*)::int as otros from usuarios
      where iglesia_id = ${iglesiaId} and rol = 'admin' and id <> ${id}
    `;
    if (rol !== "admin" && otros === 0) return true;
    await tx`update usuarios set rol = ${rol} where id = ${id} and iglesia_id = ${iglesiaId}`;
    return false;
  });

  revalidatePath(`/panel/iglesias/${iglesiaId}`);
  revalidatePath("/panel/iglesias");
  if (quedaSinAdmin) {
    redirect(
      `/panel/iglesias/${iglesiaId}?error=` +
        encodeURIComponent("Cada iglesia necesita al menos un administrador. Nombra a otro primero."),
    );
  }
}
