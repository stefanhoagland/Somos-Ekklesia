import Link from "next/link";
import { exigirLider } from "@/lib/permisos";
import { FormularioMiembro } from "../Formulario";

export default async function NuevoMiembro() {
  await exigirLider();
  return (
    <>
      <Link href="/panel/miembros" className="text-sm underline">← Miembros</Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Añadir miembro</h1>
      <FormularioMiembro />
    </>
  );
}
