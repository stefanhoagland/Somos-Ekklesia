import Link from "next/link";
import { Logo } from "./Logo";

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo tamano={120} />
      <div>
        <h1 className="font-serif text-4xl font-bold tracking-wide">SOMOS EKKLESIA</h1>
        <p className="mt-1 font-serif text-sm tracking-[0.4em] text-stone-500">ΕΚΚΛΗΣΙΑ</p>
      </div>
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
