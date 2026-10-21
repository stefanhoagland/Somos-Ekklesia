import Link from "next/link";
import { exigirUsuario, NOMBRE_ROL } from "@/lib/sesion";
import { salir } from "@/app/acciones";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/panel" className="font-bold">
            {u.iglesiaNombre ?? "Somos Ekklesia"}
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {u.esSuperadmin && <Link href="/panel/iglesias">Iglesias</Link>}
            {u.iglesiaId && u.rol !== "miembro" && (
              <>
                <Link href="/panel/miembros">Miembros</Link>
                <Link href="/panel/asistencia">Asistencia</Link>
              </>
            )}
            {u.iglesiaId && u.rol === "admin" && <Link href="/panel/usuarios">Usuarios</Link>}
            <span className="text-stone-500">
              {u.nombre || u.email} · {u.iglesiaId ? NOMBRE_ROL[u.rol] : "Superadministrador"}
            </span>
            <form action={salir}>
              <button className="underline">Salir</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
