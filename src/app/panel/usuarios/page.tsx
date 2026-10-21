import { redirect } from "next/navigation";
import { perfilActual, NOMBRE_ROL, type Perfil, type Rol } from "@/lib/perfil";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cambiarRol } from "./actions";

export default async function Usuarios() {
  const yo = await perfilActual();
  if (yo.rol !== "admin") redirect("/panel");

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol")
    .order("nombre");
  const usuarios = (data ?? []) as Perfil[];

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Usuarios</h1>
      <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
        Elige qué puede hacer cada persona. Los líderes ven la base de datos de
        miembros y la planificación; los administradores además gestionan usuarios.
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
            ) : (
              <form action={cambiarRol} className="flex gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select
                  name="rol"
                  defaultValue={u.rol}
                  className="rounded-lg border border-stone-300 bg-transparent px-2 py-1 dark:border-stone-700"
                >
                  {(Object.keys(NOMBRE_ROL) as Rol[]).map((r) => (
                    <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
                  ))}
                </select>
                <button className="rounded-lg border border-stone-300 px-3 py-1 text-sm dark:border-stone-700">
                  Guardar
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
