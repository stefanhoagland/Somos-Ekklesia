import Link from "next/link";
import { sql } from "@/lib/db";
import { exigirLider } from "@/lib/permisos";
import { campo, boton } from "@/lib/estilos";
import { Avisos } from "@/app/Avisos";
import { crearEvento } from "./acciones";

type Evento = { id: string; nombre: string; fecha: string; asistentes: number };

export default async function Asistencia({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; aviso?: string }>;
}) {
  const u = await exigirLider();
  const { error, aviso } = await searchParams;
  const eventos = await sql<Evento[]>`
    select e.id, e.nombre, to_char(e.fecha, 'DD/MM/YYYY') as fecha, count(a.miembro_id)::int as asistentes
    from eventos e left join asistencias a on a.evento_id = e.id
    where e.iglesia_id = ${u.iglesiaId}
    group by e.id order by e.fecha desc, e.creado_en desc
    limit 100
  `;
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: process.env.TZ || undefined });

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Asistencia</h1>
      <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
        Crea un culto, reunión o grupo y pasa lista.
      </p>
      <div className="mb-4 flex flex-col gap-2"><Avisos error={error} aviso={aviso} /></div>

      <form action={crearEvento} className="mb-8 flex flex-wrap gap-2">
        <input name="nombre" placeholder="Ej.: Culto dominical" required className={`${campo} min-w-48 flex-1`} />
        <input name="fecha" type="date" required defaultValue={hoy} className={`${campo} w-auto`} />
        <button className={boton}>Pasar lista</button>
      </form>

      {eventos.length === 0 ? (
        <p className="py-8 text-center text-stone-500">Todavía no hay eventos.</p>
      ) : (
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {eventos.map((e) => (
            <li key={e.id}>
              <Link href={`/panel/asistencia/${e.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-stone-100 dark:hover:bg-stone-900">
                <div>
                  <div className="font-medium">{e.nombre}</div>
                  <div className="text-sm text-stone-500">{e.fecha}</div>
                </div>
                <div className="text-sm">{e.asistentes} {e.asistentes === 1 ? "persona" : "personas"}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
