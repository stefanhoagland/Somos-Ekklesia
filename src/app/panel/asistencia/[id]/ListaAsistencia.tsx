"use client";

import { useState } from "react";
import { boton, campo } from "@/lib/estilos";

type Persona = { id: string; nombre: string; presente: boolean };

// Lista con buscador. Las casillas ocultas por el filtro se siguen enviando.
export function ListaAsistencia({
  eventoId,
  personas,
  accion,
}: {
  eventoId: string;
  personas: Persona[];
  accion: (f: FormData) => Promise<void>;
}) {
  const [filtro, setFiltro] = useState("");
  const [marcados, setMarcados] = useState(() => new Set(personas.filter((p) => p.presente).map((p) => p.id)));
  const f = filtro.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="eventoId" value={eventoId} />
      <input
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Buscar persona"
        className={campo}
      />
      <ul className="divide-y divide-stone-200 dark:divide-stone-800">
        {personas.map((p) => {
          const visible = p.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(f);
          return (
            <li key={p.id} className={visible ? "" : "hidden"}>
              <label className="flex cursor-pointer items-center gap-3 py-2">
                <input
                  type="checkbox"
                  name="presente"
                  value={p.id}
                  checked={marcados.has(p.id)}
                  onChange={(e) => {
                    const n = new Set(marcados);
                    if (e.target.checked) n.add(p.id); else n.delete(p.id);
                    setMarcados(n);
                  }}
                  className="h-5 w-5"
                />
                {p.nombre}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-0 flex items-center gap-3 border-t border-stone-200 bg-[var(--background)] py-3 dark:border-stone-800">
        <button className={boton}>Guardar asistencia</button>
        <span className="text-sm text-stone-500">{marcados.size} presentes</span>
      </div>
    </form>
  );
}
