import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { exigirLider } from "@/lib/permisos";
import { botonSecundario } from "@/lib/estilos";
import type { Miembro } from "@/lib/miembros";
import { FormularioMiembro } from "../Formulario";
import { borrarMiembro } from "../acciones";
import { BotonConfirmar } from "@/app/BotonConfirmar";

export default async function EditarMiembro({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirLider();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [m] = await sql<Miembro[]>`
    select id, nombre, apellidos, email, telefono, direccion, estado, notas,
           to_char(fecha_nacimiento, 'YYYY-MM-DD') as fecha_nacimiento
    from miembros where id = ${id} and iglesia_id = ${u.iglesiaId}
  `;
  if (!m) notFound();

  const asistencias = await sql<{ nombre: string; fecha: string }[]>`
    select e.nombre, to_char(e.fecha, 'DD/MM/YYYY') as fecha
    from asistencias a join eventos e on e.id = a.evento_id
    where a.miembro_id = ${id}
    order by e.fecha desc limit 10
  `;

  return (
    <>
      <Link href="/panel/miembros" className="text-sm underline">← Miembros</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">{m.nombre} {m.apellidos}</h1>
      <FormularioMiembro miembro={m} />

      <h2 className="mb-2 mt-10 text-lg font-semibold">Últimas asistencias</h2>
      {asistencias.length === 0 ? (
        <p className="text-stone-500">Todavía no tiene asistencias.</p>
      ) : (
        <ul className="text-sm">
          {asistencias.map((a, i) => <li key={i}>{a.fecha} · {a.nombre}</li>)}
        </ul>
      )}

      {u.rol === "admin" && (
        <form action={borrarMiembro} className="mt-10">
          <input type="hidden" name="id" value={m.id} />
          <BotonConfirmar
            mensaje={`¿Borrar a ${m.nombre}? También se borra su historial de asistencia.`}
            className={`${botonSecundario} text-red-700`}
          >
            Borrar miembro
          </BotonConfirmar>
        </form>
      )}
    </>
  );
}
