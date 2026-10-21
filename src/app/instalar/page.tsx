import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { campo, boton } from "@/lib/estilos";
import { Avisos } from "@/app/Avisos";
import { instalar } from "@/app/acciones";

export const dynamic = "force-dynamic";

export default async function Instalar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from usuarios`;
  if (n > 0) redirect("/login");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">Primera instalación</h1>
      <p className="text-stone-600 dark:text-stone-400">
        Crea la cuenta de superadministrador. Con ella darás de alta las iglesias.
      </p>
      <Avisos error={error} />
      <form action={instalar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">Nombre<input name="nombre" required className={campo} /></label>
        <label className="flex flex-col gap-1">Correo<input name="email" type="email" required className={campo} /></label>
        <label className="flex flex-col gap-1">Contraseña<input name="clave" type="password" required minLength={8} className={campo} /></label>
        <button className={boton}>Crear superadministrador</button>
      </form>
    </main>
  );
}
