import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirLider } from "@/lib/permisos";
import { campo, botonSecundario } from "@/lib/estilos";
import { Avisos } from "@/app/Avisos";
import { BotonConfirmar } from "@/app/BotonConfirmar";
import { anadirVisitante, borrarEvento, guardarAsistencia } from "../acciones";
import { ListaAsistencia } from "./ListaAsistencia";

export default async function PasarLista({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const u = await exigirLider();
  const { id } = await params;
  const { aviso } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [evento] = await sql<{ nombre: string; fecha: string }[]>`
    select nombre, to_char(fecha, 'DD/MM/YYYY') as fecha
    from eventos where id = ${id} and iglesia_id = ${u.iglesiaId}
  `;
  if (!evento) notFound();

  const personas = await sql<{ id: string; nombre: string; presente: boolean }[]>`
    select m.id, trim(m.nombre || ' ' || m.apellidos) as nombre, (a.miembro_id is not null) as presente
    from miembros m
    left join asistencias a on a.miembro_id = m.id and a.evento_id = ${id}
    where m.iglesia_id = ${u.iglesiaId} and (m.estado <> 'inactivo' or a.miembro_id is not null)
    order by m.nombre, m.apellidos
  `;

  return (
    <>
      <Link href="/panel/asistencia" className="text-sm underline">← Asistencia</Link>
      <h1 className="mt-2 text-2xl font-bold">{evento.nombre}</h1>
      <p className="mb-4 text-stone-500">{evento.fecha}</p>
      <div className="mb-4 flex flex-col gap-2"><Avisos aviso={aviso} /></div>

      {personas.length === 0 ? (
        <p className="mb-6 text-stone-500">
          Todavía no hay miembros. <Link href="/panel/miembros/nuevo" className="underline">Añade</Link> o{" "}
          <Link href="/panel/miembros/importar" className="underline">importa</Link> tu lista.
        </p>
      ) : (
        <ListaAsistencia key={aviso ?? ""} eventoId={id} personas={[...personas]} accion={guardarAsistencia} />
      )}

      <h2 className="mb-2 mt-8 font-semibold">¿Vino alguien nuevo?</h2>
      <form action={anadirVisitante} className="flex flex-wrap gap-2">
        <input type="hidden" name="eventoId" value={id} />
        <input name="nombre" placeholder="Nombre" required className={`${campo} min-w-32 flex-1`} />
        <input name="apellidos" placeholder="Apellidos" className={`${campo} min-w-32 flex-1`} />
        <input name="telefono" placeholder="Teléfono" type="tel" className={`${campo} min-w-32 flex-1`} />
        <button className={botonSecundario}>Añadir visitante</button>
      </form>

      {u.rol === "admin" && (
        <form action={borrarEvento} className="mt-10">
          <input type="hidden" name="eventoId" value={id} />
          <BotonConfirmar mensaje="¿Borrar este evento y su lista de asistencia?" className={`${botonSecundario} text-red-700`}>
            Borrar evento
          </BotonConfirmar>
        </form>
      )}
    </>
  );
}
