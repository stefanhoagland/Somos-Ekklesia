"use client";

import { useActionState } from "react";
import { boton, campo } from "@/lib/estilos";
import { invitar, type ResultadoInvitar } from "./acciones";

export function FormularioInvitar({ miembrosSinCuenta }: { miembrosSinCuenta: number }) {
  const [res, accion, enviando] = useActionState<ResultadoInvitar | null, FormData>(invitar, null);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Correos (separados por comas o uno por línea)
        <textarea name="correos" rows={5} placeholder={"ana@ejemplo.com\njose@ejemplo.com"} className={campo} />
      </label>
      {miembrosSinCuenta > 0 && (
        <label className="flex items-center gap-2">
          <input type="checkbox" name="miembrosSinCuenta" value="1" className="h-5 w-5" />
          Invitar también a los {miembrosSinCuenta} miembros con correo que aún no tienen cuenta ni invitación
        </label>
      )}
      <button disabled={enviando} className={`${boton} self-start`}>
        {enviando ? "Enviando…" : "Enviar invitaciones"}
      </button>

      {res?.error && <p className="rounded-lg bg-red-100 p-3 text-red-800">{res.error}</p>}
      {res && !res.error && (
        <div className="flex flex-col gap-2 text-sm">
          <p className="rounded-lg bg-green-100 p-3 text-green-800">
            {res.enviados.length === 1 ? "Enviada 1 invitación." : `Enviadas ${res.enviados.length} invitaciones.`}
          </p>
          {res.yaTienenCuenta.length > 0 && <p>Ya tienen cuenta (no se envió): {res.yaTienenCuenta.join(", ")}</p>}
          {res.invalidos.length > 0 && <p className="text-red-700">No parecen correos válidos: {res.invalidos.join(", ")}</p>}
          {res.fallidos.length > 0 && (
            <p className="text-red-700">
              No se pudieron enviar: {res.fallidos.join(", ")}. Revisa la configuración de Brevo.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
