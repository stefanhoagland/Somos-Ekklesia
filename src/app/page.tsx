import Link from "next/link";

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4">
      <h1 className="text-4xl font-bold">Somos Ekklesia</h1>
      <p className="text-lg text-stone-600 dark:text-stone-400">
        Grupos, mensajes, sermones y ofrendas de nuestra iglesia, todo en un
        mismo lugar.
      </p>
      <div>
        <Link
          href="/panel"
          className="inline-block rounded-lg bg-stone-900 px-5 py-3 font-medium text-white dark:bg-stone-100 dark:text-stone-900"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
