import Link from "next/link";
import { campo, boton } from "@/lib/estilos";
import { Avisos } from "@/app/Avisos";
import { registrarse } from "@/app/acciones";
import { Logo } from "@/app/Logo";

export default async function Registro({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; codigo?: string; email?: string }>;
}) {
  const { error, codigo, email } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <Logo tamano={72} />
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <p className="text-stone-600 dark:text-stone-400">
        Pide a tu iglesia su código para unirte.
      </p>
      <Avisos error={error} />
      <form action={registrarse} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          Código de la iglesia
          <input name="codigo" required defaultValue={codigo} className={`${campo} uppercase`} />
        </label>
        <label className="flex flex-col gap-1">Nombre completo<input name="nombre" required className={campo} /></label>
        <label className="flex flex-col gap-1">Correo<input name="email" type="email" required defaultValue={email} className={campo} /></label>
        <label className="flex flex-col gap-1">Contraseña<input name="clave" type="password" required minLength={8} className={campo} /></label>
        <button className={boton}>Crear cuenta</button>
      </form>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        ¿Ya tienes cuenta? <Link href="/login" className="underline">Inicia sesión</Link>
      </p>
    </main>
  );
}
