import Link from "next/link";
import { perfilActual, NOMBRE_ROL } from "@/lib/perfil";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const perfil = await perfilActual();

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/panel" className="font-bold">Somos Ekklesia</Link>
          <nav className="flex items-center gap-4 text-sm">
            {perfil.rol === "admin" && <Link href="/panel/usuarios">Usuarios</Link>}
            <span className="text-stone-500">
              {perfil.nombre || perfil.email} · {NOMBRE_ROL[perfil.rol]}
            </span>
            <form action="/auth/salir" method="post">
              <button className="underline">Salir</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
