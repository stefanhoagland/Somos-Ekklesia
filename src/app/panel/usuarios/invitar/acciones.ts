"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/sesion";
import { correoInvitacion, enviarCorreo, variablesQueFaltan } from "@/lib/correo";

export type ResultadoInvitar = {
  enviados: string[];
  yaTienenCuenta: string[];
  invalidos: string[];
  fallidos: string[];
  error?: string;
};

const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const MAXIMO = 300;

// Envía invitaciones por correo. Acepta correos separados por comas, espacios o líneas,
// y opcionalmente invita a los miembros con correo que aún no tienen cuenta.
export async function invitar(_previo: ResultadoInvitar | null, f: FormData): Promise<ResultadoInvitar> {
  const yo = await exigirUsuario();
  const vacio: ResultadoInvitar = { enviados: [], yaTienenCuenta: [], invalidos: [], fallidos: [] };
  if (!yo.iglesiaId || yo.rol !== "admin") return { ...vacio, error: "Solo los administradores pueden invitar." };
  const faltan = variablesQueFaltan();
  if (faltan.length) return { ...vacio, error: `Falta configurar el correo: ${faltan.join(", ")}.` };

  const escritos = String(f.get("correos") ?? "")
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  let deMiembros: string[] = [];
  if (f.get("miembrosSinCuenta") === "1") {
    const filas = await sql<{ email: string }[]>`
      select distinct m.email from miembros m
      where m.iglesia_id = ${yo.iglesiaId} and m.email <> '' and m.estado <> 'inactivo'
        and not exists (select 1 from usuarios u where u.email = m.email)
        and not exists (select 1 from invitaciones i where i.iglesia_id = m.iglesia_id and i.email = m.email)
    `;
    deMiembros = filas.map((r) => r.email);
  }

  const todos = [...new Set([...escritos, ...deMiembros])];
  const invalidos = todos.filter((e) => !EMAIL.test(e));
  let validos = todos.filter((e) => EMAIL.test(e));
  if (validos.length > MAXIMO) {
    return { ...vacio, invalidos, error: `Como máximo ${MAXIMO} correos cada vez.` };
  }

  const conCuenta = validos.length
    ? (await sql<{ email: string }[]>`select email from usuarios where email = any(${validos})`).map((r) => r.email)
    : [];
  validos = validos.filter((e) => !conCuenta.includes(e));

  const [iglesia] = await sql<{ nombre: string; codigo: string }[]>`
    select nombre, codigo from iglesias where id = ${yo.iglesiaId}
  `;
  const quien = yo.nombre || yo.email;
  const enviados: string[] = [];
  const fallidos: string[] = [];
  for (const email of validos) {
    try {
      await enviarCorreo({ para: email, ...correoInvitacion(iglesia.nombre, iglesia.codigo, email, quien) });
      await sql`
        insert into invitaciones (iglesia_id, email, enviado_por) values (${yo.iglesiaId}, ${email}, ${yo.id})
        on conflict (iglesia_id, email) do update set enviado_en = now(), enviado_por = excluded.enviado_por
      `;
      enviados.push(email);
    } catch (e) {
      console.error("No se pudo enviar la invitación a", email, e);
      fallidos.push(email);
    }
  }

  revalidatePath("/panel/usuarios/invitar");
  return { enviados, yaTienenCuenta: conCuenta, invalidos, fallidos };
}
