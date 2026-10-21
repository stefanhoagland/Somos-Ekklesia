import Link from "next/link";
import { sql } from "@/lib/db";
import { exigirLider } from "@/lib/permisos";
import { campo, boton, botonSecundario } from "@/lib/estilos";
import { NOMBRE_ESTADO, type Estado } from "@/lib/miembros";
import { Avisos } from "@/app/Avisos";

type Fila = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  estado: Estado;
  ultimaAsistencia: string | null;
};

export default async function Miembros({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; error?: string; aviso?: string }>;
}) {
  const u = await exigirLider();
  const { q = "", estado = "", error, aviso } = await searchParams;
  const busca = `%${q.trim()}%`;

  const miembros = await sql<Fila[]>`
    select m.id, m.nombre, m.apellidos, m.email, m.telefono, m.estado,
           to_char(max(e.fecha), 'DD/MM/YYYY') as ultima_asistencia
    from miembros m
    left join asistencias a on a.miembro_id = m.id
    left join eventos e on e.id = a.evento_id
    where m.iglesia_id = ${u.iglesiaId}
      and (${q.trim() === ""} or m.nombre || ' ' || m.apellidos || ' ' || m.email || ' ' || m.telefono ilike ${busca})
      and (${estado === ""} or m.estado::text = ${estado})
    group by m.id
    order by m.apellidos, m.nombre
  `;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Miembros <span className="text-stone-400">({miembros.length})</span></h1>
        <div className="flex gap-2">
          <Link href="/panel/miembros/importar" className={botonSecundario}>Importar Excel</Link>
          <Link href="/panel/miembros/nuevo" className={boton}>Añadir</Link>
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-2"><Avisos error={error} aviso={aviso} /></div>

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, correo o teléfono" className={`${campo} flex-1`} />
        <select name="estado" defaultValue={estado} className={`${campo} w-auto`}>
          <option value="">Todos</option>
          {(Object.keys(NOMBRE_ESTADO) as Estado[]).map((e) => (
            <option key={e} value={e}>{NOMBRE_ESTADO[e]}</option>
          ))}
        </select>
        <button className={botonSecundario}>Buscar</button>
      </form>

      {miembros.length === 0 ? (
        <p className="py-8 text-center text-stone-500">
          {q || estado ? "No hay resultados." : "Todavía no hay miembros. Añade uno o importa tu Excel."}
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {miembros.map((m) => (
            <li key={m.id}>
              <Link href={`/panel/miembros/${m.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-stone-100 dark:hover:bg-stone-900">
                <div>
                  <div className="font-medium">{m.nombre} {m.apellidos}</div>
                  <div className="text-sm text-stone-500">{[m.telefono, m.email].filter(Boolean).join(" · ") || "Sin contacto"}</div>
                </div>
                <div className="text-right text-sm">
                  <div>{NOMBRE_ESTADO[m.estado]}</div>
                  <div className="text-stone-500">{m.ultimaAsistencia ? `Última asistencia ${m.ultimaAsistencia}` : "Sin asistencias"}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
