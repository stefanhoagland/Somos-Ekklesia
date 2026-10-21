import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirUsuario, NOMBRE_ROL, type Rol } from "@/lib/sesion";
import { botonSecundario } from "@/lib/estilos";
import { Avisos } from "@/app/Avisos";
import { cambiarRolEnIglesia } from "../acciones";

type Fila = { id: string; nombre: string; email: string; rol: Rol };

const ORDEN: Record<Rol, number> = { admin: 0, lider: 1, miembro: 2 };

export default async function Iglesia({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const yo = await exigirUsuario();
  if (!yo.esSuperadmin) redirect("/panel");
  const { id } = await params;
  const { error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [iglesia] = await sql<{ nombre: string; codigo: string }[]>`
    select nombre, codigo from iglesias where id = ${id}
  `;
  if (!iglesia) notFound();

  const usuarios = (
    await sql<Fila[]>`
      select id, nombre, email, rol from usuarios where iglesia_id = ${id} order by nombre
    `
  ).sort((a, b) => ORDEN[a.rol] - ORDEN[b.rol]);

  return (
    <>
      <Link href="/panel/iglesias" className="text-sm underline">← Iglesias</Link>
      <h1 className="mt-2 text-2xl font-bold">{iglesia.nombre}</h1>
      <p className="mb-6 text-sm text-stone-500">
        Código <span className="font-mono font-semibold">{iglesia.codigo}</span> · {usuarios.length}{" "}
        {usuarios.length === 1 ? "persona" : "personas"}
      </p>
      <div className="mb-4 flex flex-col gap-2"><Avisos error={error} /></div>

      {usuarios.length === 0 ? (
        <p className="text-stone-500">
          Todavía no se ha registrado nadie. La primera persona que use el código será administrador.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {usuarios.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <div className="font-medium">{u.nombre || "Sin nombre"}</div>
                <div className="text-sm text-stone-500">{u.email}</div>
              </div>
              {u.id === yo.id ? (
                <span className="text-sm">{NOMBRE_ROL[u.rol]} (tú)</span>
              ) : (
                <form action={cambiarRolEnIglesia} className="flex gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="iglesiaId" value={id} />
                  <select
                    name="rol"
                    defaultValue={u.rol}
                    className="rounded-lg border border-stone-300 bg-transparent px-2 py-1 dark:border-stone-700"
                  >
                    {(Object.keys(NOMBRE_ROL) as Rol[]).map((r) => (
                      <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
                    ))}
                  </select>
                  <button className={botonSecundario}>Guardar</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
