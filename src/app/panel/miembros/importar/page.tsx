import Link from "next/link";
import { exigirLider } from "@/lib/permisos";
import { Importador } from "./Importador";

export default async function Importar() {
  await exigirLider();
  return (
    <>
      <Link href="/panel/miembros" className="text-sm underline">← Miembros</Link>
      <h1 className="mb-2 mt-2 text-2xl font-bold">Importar miembros</h1>
      <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
        El archivo se lee en tu navegador y solo se guardan los datos en la base de datos de tu iglesia.
        Puedes revisar las columnas antes de importar.
      </p>
      <Importador />
    </>
  );
}
