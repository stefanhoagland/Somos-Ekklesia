import Link from "next/link";
import { iniciarSesion, registrarse } from "./actions";

const campo =
  "w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700";
const boton =
  "w-full rounded-lg bg-stone-900 px-4 py-2 font-medium text-white dark:bg-stone-100 dark:text-stone-900";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; error?: string; aviso?: string }>;
}) {
  const { modo, error, aviso } = await searchParams;
  const registro = modo === "registro";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">
        {registro ? "Crear cuenta" : "Iniciar sesión"}
      </h1>

      {error && <p className="rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
      {aviso && <p className="rounded-lg bg-green-100 p-3 text-green-800">{aviso}</p>}

      <form action={registro ? registrarse : iniciarSesion} className="flex flex-col gap-3">
        {registro && (
          <label className="flex flex-col gap-1">
            Nombre completo
            <input name="nombre" required className={campo} />
          </label>
        )}
        <label className="flex flex-col gap-1">
          Correo
          <input name="email" type="email" required className={campo} />
        </label>
        <label className="flex flex-col gap-1">
          Contraseña
          <input name="password" type="password" required minLength={8} className={campo} />
        </label>
        <button className={boton}>{registro ? "Crear cuenta" : "Entrar"}</button>
      </form>

      <p className="text-sm text-stone-600 dark:text-stone-400">
        {registro ? (
          <>¿Ya tienes cuenta? <Link href="/login" className="underline">Inicia sesión</Link></>
        ) : (
          <>¿No tienes cuenta? <Link href="/login?modo=registro" className="underline">Regístrate</Link></>
        )}
      </p>
    </main>
  );
}
