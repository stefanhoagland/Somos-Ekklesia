import Link from "next/link";
import { exigirUsuario, type Rol } from "@/lib/sesion";

const SECCIONES: { titulo: string; texto: string; roles: Rol[] }[] = [
  { titulo: "App para miembros", texto: "Grupos, mensajes, sermones y ofrendas.", roles: ["admin", "lider", "miembro"] },
  { titulo: "Miembros", texto: "Base de datos de miembros y control de asistencia.", roles: ["admin", "lider"] },
  { titulo: "Registro de niños", texto: "Registro con etiquetas de identificación y recogida.", roles: ["admin", "lider"] },
  { titulo: "Planificación del culto", texto: "Planes de servicio, canciones y voluntarios.", roles: ["admin", "lider"] },
];

export default async function Panel() {
  const u = await exigirUsuario();

  if (!u.iglesiaId) {
    return (
      <>
        <h1 className="mb-4 text-2xl font-bold">Hola{u.nombre ? `, ${u.nombre}` : ""}</h1>
        <p>
          Eres superadministrador. Empieza dando de alta una iglesia en{" "}
          <Link href="/panel/iglesias" className="underline">Iglesias</Link>.
        </p>
      </>
    );
  }

  const visibles = SECCIONES.filter((s) => s.roles.includes(u.rol));
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Hola{u.nombre ? `, ${u.nombre}` : ""}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {visibles.map((s) => (
          <div key={s.titulo} className="rounded-xl border border-stone-200 p-5 dark:border-stone-800">
            <h2 className="font-semibold">{s.titulo}</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{s.texto}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-stone-400">Próximamente</p>
          </div>
        ))}
      </div>
    </>
  );
}
