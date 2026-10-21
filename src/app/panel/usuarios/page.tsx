import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirUsuario, NOMBRE_ROL, type Rol } from "@/lib/sesion";
import { botonSecundario } from "@/lib/estilos";
import { cambiarRol } from "./acciones";

type Fila = { id: string; nombre: string; email: string; rol: Rol };

export default async function Usuarios() {
  const yo = await exigirUsuario();
  if (!yo.iglesiaId || yo.rol !== "admin") redirect("/panel");

  const [iglesia] = await sql<{ codigo: string }[]>`select codigo from iglesias where id = ${yo.iglesiaId}`;
  const usuarios = await sql<Fila[]>`
    select id, nombre, email, rol from usuarios
    where iglesia_id = ${yo.iglesiaId} order by nombre
  `;

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Usuarios</h1>
      <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
        Para que alguien se una, comparte el código{" "}
        <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">{iglesia.codigo}</span>.
        Aquí puedes hacer a alguien líder o miembro. Los líderes ven miembros, asistencia y planificación. Para nombrar o quitar administradores, habla con el superadministrador.
      </p>
      <ul className="divide-y divide-stone-200 dark:divide-stone-800">
        {usuarios.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <div className="font-medium">{u.nombre || "Sin nombre"}</div>
              <div className="text-sm text-stone-500">{u.email}</div>
            </div>
            {u.id === yo.id ? (
              <span className="text-sm">{NOMBRE_ROL[u.rol]} (tú)</span>
            ) : u.rol === "admin" ? (
              <span className="text-sm">{NOMBRE_ROL[u.rol]}</span>
            ) : (
              <form action={cambiarRol} className="flex gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select
                  name="rol"
                  defaultValue={u.rol}
                  className="rounded-lg border border-stone-300 bg-transparent px-2 py-1 dark:border-stone-700"
                >
                  {(["lider", "miembro"] as Rol[]).map((r) => (
                    <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
                  ))}
                </select>
                <button className={botonSecundario}>Guardar</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
