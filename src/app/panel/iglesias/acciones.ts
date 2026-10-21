"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
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
