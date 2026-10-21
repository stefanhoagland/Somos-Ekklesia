import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/sesion";
import { campo, boton, botonSecundario } from "@/lib/estilos";
import { crearIglesia, unirmeComoAdmin } from "./acciones";

type Iglesia = { id: string; nombre: string; codigo: string; miembros: number; admins: string | null };

export default async function Iglesias() {
  const u = await exigirUsuario();
  if (!u.esSuperadmin) redirect("/panel");

  const iglesias = await sql<Iglesia[]>`
    select i.id, i.nombre, i.codigo, count(us.id)::int as miembros,
           string_agg(coalesce(nullif(us.nombre, ''), us.email), ', ' order by us.nombre)
             filter (where us.rol = 'admin') as admins
    from iglesias i left join usuarios us on us.iglesia_id = i.id
    group by i.id order by i.nombre
  `;

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Iglesias</h1>
      <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
        Da de alta una iglesia y comparte su código. La primera persona que se
        registre con ese código será el administrador de esa iglesia. Pulsa el
        nombre de una iglesia para ver a su gente y nombrar o quitar administradores.
      </p>

      <form action={crearIglesia} className="mb-8 flex gap-2">
        <input name="nombre" placeholder="Nombre de la iglesia" required className={campo} />
        <button className={`${boton} shrink-0`}>Añadir</button>
      </form>

      <ul className="divide-y divide-stone-200 dark:divide-stone-800">
        {iglesias.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <Link href={`/panel/iglesias/${i.id}`} className="font-medium underline">{i.nombre}</Link>
              <div className="text-sm text-stone-500">
                Código <span className="font-mono font-semibold">{i.codigo}</span> · {i.miembros}{" "}
                {i.miembros === 1 ? "persona" : "personas"}
              </div>
              <div className="text-sm text-stone-500">
                Administradores: {i.admins ?? "ninguno todavía"}
              </div>
            </div>
            {u.iglesiaId === i.id ? (
              <span className="text-sm">Tu iglesia</span>
            ) : (
              <form action={unirmeComoAdmin}>
                <input type="hidden" name="id" value={i.id} />
                <button className={botonSecundario}>Entrar como administrador</button>
              </form>
            )}
          </li>
        ))}
        {iglesias.length === 0 && <li className="py-3 text-stone-500">Todavía no hay iglesias.</li>}
      </ul>
    </>
  );
}
