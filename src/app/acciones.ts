"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { hashClave, verificarClave } from "@/lib/clave";
import { cerrarSesion, crearSesion } from "@/lib/sesion";

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const errorEn = (ruta: string, msg: string) =>
  redirect(`${ruta}${ruta.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);

async function hayUsuarios() {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from usuarios`;
  return n > 0;
}

// Crea la cuenta de superadministrador. Solo funciona si no hay ningún usuario.
export async function instalar(f: FormData) {
  if (await hayUsuarios()) redirect("/login");
  const email = texto(f, "email").toLowerCase();
  const clave = String(f.get("clave") ?? "");
  if (clave.length < 8) errorEn("/instalar", "La contraseña debe tener al menos 8 caracteres.");
  const [u] = await sql<{ id: string }[]>`
    insert into usuarios (email, nombre, clave_hash, es_superadmin)
    values (${email}, ${texto(f, "nombre")}, ${await hashClave(clave)}, true)
    returning id
  `;
  await crearSesion(u.id);
  redirect("/panel/iglesias");
}

export async function iniciarSesion(f: FormData) {
  const email = texto(f, "email").toLowerCase();
  const [u] = await sql<{ id: string; claveHash: string }[]>`
    select id, clave_hash from usuarios where email = ${email}
  `;
  if (!u || !(await verificarClave(String(f.get("clave") ?? ""), u.claveHash))) {
    errorEn("/login", "Correo o contraseña incorrectos.");
  }
  await crearSesion(u.id);
  redirect("/panel");
}

// Registro con el código de la iglesia. La primera persona de cada iglesia es su administrador.
export async function registrarse(f: FormData) {
  const codigo = texto(f, "codigo").toUpperCase();
  const email = texto(f, "email").toLowerCase();
  const clave = String(f.get("clave") ?? "");
  const volver = `/registro?codigo=${encodeURIComponent(codigo)}`;
  if (clave.length < 8) errorEn(volver, "La contraseña debe tener al menos 8 caracteres.");

  const hash = await hashClave(clave);
  const resultado = await sql.begin(async (tx) => {
    const [iglesia] = await tx<{ id: string }[]>`
      select id from iglesias where codigo = ${codigo} for update
    `;
    if (!iglesia) return "codigo";
    const [existe] = await tx`select 1 from usuarios where email = ${email}`;
    if (existe) return "email";
    const [{ n }] = await tx<{ n: number }[]>`
      select count(*)::int as n from usuarios where iglesia_id = ${iglesia.id}
    `;
    const [u] = await tx<{ id: string }[]>`
      insert into usuarios (email, nombre, clave_hash, iglesia_id, rol)
      values (${email}, ${texto(f, "nombre")}, ${hash}, ${iglesia.id},
              ${n === 0 ? "admin" : "miembro"})
      returning id
    `;
    return { id: u.id };
  });

  if (resultado === "codigo") errorEn(volver, "No existe ninguna iglesia con ese código.");
  if (resultado === "email") errorEn(volver, "Ya hay una cuenta con ese correo.");
  await crearSesion((resultado as { id: string }).id);
  redirect("/panel");
}

export async function salir() {
  await cerrarSesion();
  redirect("/login");
}
