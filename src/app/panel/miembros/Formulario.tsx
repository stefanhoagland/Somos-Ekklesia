import { campo, boton } from "@/lib/estilos";
import { NOMBRE_ESTADO, type Estado, type Miembro } from "@/lib/miembros";
import { guardarMiembro } from "./acciones";

export function FormularioMiembro({ miembro }: { miembro?: Miembro }) {
  const m = miembro;
  return (
    <form action={guardarMiembro} className="grid gap-3 sm:grid-cols-2">
      {m && <input type="hidden" name="id" value={m.id} />}
      <label className="flex flex-col gap-1">Nombre *<input name="nombre" required defaultValue={m?.nombre} className={campo} /></label>
      <label className="flex flex-col gap-1">Apellidos<input name="apellidos" defaultValue={m?.apellidos} className={campo} /></label>
      <label className="flex flex-col gap-1">Correo<input name="email" type="email" defaultValue={m?.email} className={campo} /></label>
      <label className="flex flex-col gap-1">Teléfono<input name="telefono" type="tel" defaultValue={m?.telefono} className={campo} /></label>
      <label className="flex flex-col gap-1">Fecha de nacimiento<input name="fechaNacimiento" type="date" defaultValue={m?.fechaNacimiento ?? ""} className={campo} /></label>
      <label className="flex flex-col gap-1">
        Estado
        <select name="estado" defaultValue={m?.estado ?? "miembro"} className={campo}>
          {(Object.keys(NOMBRE_ESTADO) as Estado[]).map((e) => (
            <option key={e} value={e}>{NOMBRE_ESTADO[e]}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">Dirección<input name="direccion" defaultValue={m?.direccion} className={campo} /></label>
      <label className="flex flex-col gap-1 sm:col-span-2">Notas<textarea name="notas" rows={3} defaultValue={m?.notas} className={campo} /></label>
      <div className="sm:col-span-2"><button className={boton}>Guardar</button></div>
    </form>
  );
}
