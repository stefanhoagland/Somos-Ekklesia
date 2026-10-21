import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/sesion";
import { variablesQueFaltan } from "@/lib/correo";
import { FormularioInvitar } from "./Formulario";

export default async function Invitar() {
  const yo = await exigirUsuario();
  if (!yo.iglesiaId || yo.rol !== "admin") redirect("/panel");

  const faltan = variablesQueFaltan();
  const [{ n }] = await sql<{ n: number }[]>`
    select count(distinct m.email)::int as n from miembros m
    where m.iglesia_id = ${yo.iglesiaId} and m.email <> '' and m.estado <> 'inactivo'
      and not exists (select 1 from usuarios u where u.email = m.email)
      and not exists (select 1 from invitaciones i where i.iglesia_id = m.iglesia_id and i.email = m.email)
  `;
  const recientes = await sql<{ email: string; fecha: string; registrado: boolean }[]>`
    select i.email, to_char(i.enviado_en, 'DD/MM/YYYY') as fecha,
           exists (select 1 from usuarios u where u.email = i.email) as registrado
    from invitaciones i where i.iglesia_id = ${yo.iglesiaId}
    order by i.enviado_en desc limit 50
  `;

  return (
    <>
      <Link href="/panel/usuarios" className="text-sm underline">← Usuarios</Link>
      <h1 className="mb-2 mt-2 text-2xl font-bold">Invitar por correo</h1>
      <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
        Cada persona recibe un correo con un enlace para crear su cuenta en {yo.iglesiaNombre}.
      </p>

      {faltan.length > 0 ? (
        <div className="rounded-lg bg-amber-100 p-4 text-amber-900">
          <p className="font-semibold">El envío de correo todavía no está configurado.</p>
          <p className="mt-1 text-sm">
            El superadministrador debe añadir estas variables al contenedor en Unraid:{" "}
            <span className="font-mono">{faltan.join(", ")}</span>. Los pasos están en el README.
          </p>
        </div>
      ) : (
        <FormularioInvitar miembrosSinCuenta={n} />
      )}

      {recientes.length > 0 && (
        <>
          <h2 className="mb-2 mt-10 font-semibold">Invitaciones enviadas</h2>
          <ul className="divide-y divide-stone-200 text-sm dark:divide-stone-800">
            {recientes.map((r) => (
              <li key={r.email} className="flex justify-between gap-3 py-2">
                <span>{r.email}</span>
                <span className="text-stone-500">{r.registrado ? "Ya se registró" : `Enviada ${r.fecha}`}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
