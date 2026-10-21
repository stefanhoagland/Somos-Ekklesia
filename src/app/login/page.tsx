import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { campo, boton } from "@/lib/estilos";
import { Avisos } from "@/app/Avisos";
import { iniciarSesion } from "@/app/acciones";

export const dynamic = "force-dynamic";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from usuarios`;
  if (n === 0) redirect("/instalar");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <Avisos error={error} />
      <form action={iniciarSesion} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">Correo<input name="email" type="email" required className={campo} /></label>
        <label className="flex flex-col gap-1">Contraseña<input name="clave" type="password" required className={campo} /></label>
        <button className={boton}>Entrar</button>
      </form>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        ¿No tienes cuenta? <Link href="/registro" className="underline">Regístrate con el código de tu iglesia</Link>
      </p>
    </main>
  );
}
