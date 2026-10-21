"use client";

import { useState } from "react";
import Link from "next/link";
import { readSheet } from "read-excel-file/browser";
import { boton, botonSecundario, campo } from "@/lib/estilos";
import { CAMPOS_IMPORTAR, type CampoImportar, type FilaImportar } from "@/lib/miembros";
import { importarMiembros } from "../acciones";

const CAMPOS = Object.keys(CAMPOS_IMPORTAR) as CampoImportar[];

const sinAcentos = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// Convierte cualquier celda a texto. Las fechas de Excel pasan a AAAA-MM-DD.
function aTexto(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

// Lector de CSV sencillo: acepta comas o punto y coma y campos entre comillas.
function leerCsv(texto: string): string[][] {
  const primera = texto.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) { fila.push(celda); celda = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda); filas.push(fila); fila = []; celda = "";
    } else celda += c;
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}

// Adivina qué columna del Excel corresponde a cada campo.
function adivinar(encabezados: string[]): Record<CampoImportar, number> {
  const mapa = {} as Record<CampoImportar, number>;
  const usadas = new Set<number>();
  for (const campo of CAMPOS) {
    const pistas = CAMPOS_IMPORTAR[campo].pistas.map(sinAcentos);
    let idx = encabezados.findIndex((h, i) => !usadas.has(i) && pistas.includes(sinAcentos(h)));
    if (idx < 0) idx = encabezados.findIndex((h, i) => !usadas.has(i) && pistas.some((p) => sinAcentos(h).includes(p)));
    mapa[campo] = idx;
    if (idx >= 0) usadas.add(idx);
  }
  return mapa;
}

export function Importador() {
  const [encabezados, setEncabezados] = useState<string[]>([]);
  const [datos, setDatos] = useState<string[][]>([]);
  const [mapa, setMapa] = useState<Record<CampoImportar, number> | null>(null);
  const [estado, setEstado] = useState<"" | "leyendo" | "importando">("");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<{ creados: number; omitidos: number } | null>(null);

  async function elegirArchivo(archivo: File | undefined) {
    if (!archivo) return;
    setError(""); setResultado(null); setEstado("leyendo");
    try {
      const filas = /\.csv$/i.test(archivo.name)
        ? leerCsv(await archivo.text())
        : (await readSheet(archivo)).map((r) => r.map(aTexto));
      const noVacias = filas.filter((r) => r.some((c) => c.trim()));
      if (noVacias.length < 2) throw new Error("vacío");
      const enc = noVacias[0].map((h, i) => h || `Columna ${i + 1}`);
      setEncabezados(enc);
      setDatos(noVacias.slice(1));
      setMapa(adivinar(enc));
    } catch {
      setError("No pude leer el archivo. Usa un Excel (.xlsx) o un CSV con los encabezados en la primera fila.");
      setMapa(null);
    }
    setEstado("");
  }

  const filas: FilaImportar[] = mapa
    ? datos.map((r) => {
        const f: FilaImportar = {};
        for (const c of CAMPOS) if (mapa[c] >= 0) f[c] = (r[mapa[c]] ?? "").trim();
        return f;
      })
    : [];
  const validas = filas.filter((f) => f.nombre);

  async function importar() {
    setEstado("importando"); setError("");
    try {
      setResultado(await importarMiembros(filas));
      setMapa(null);
    } catch {
      setError("Algo falló al importar. No se guardó nada; inténtalo de nuevo.");
    }
    setEstado("");
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-green-100 p-3 text-green-800">
          Importados {resultado.creados} miembros.
          {resultado.omitidos > 0 && ` Se omitieron ${resultado.omitidos} filas sin nombre.`}
        </p>
        <Link href="/panel/miembros" className={`${boton} self-start`}>Ver miembros</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span>Archivo de Excel (.xlsx) o CSV, con los encabezados en la primera fila:</span>
        <input
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => elegirArchivo(e.target.files?.[0])}
          className={campo}
        />
      </label>
      {estado === "leyendo" && <p>Leyendo…</p>}
      {error && <p className="rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}

      {mapa && (
        <>
          <div>
            <h2 className="mb-2 font-semibold">¿Qué columna es cada dato?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {CAMPOS.map((c) => (
                <label key={c} className="flex flex-col gap-1 text-sm">
                  {CAMPOS_IMPORTAR[c].titulo}{c === "nombre" && " *"}
                  <select
                    value={mapa[c]}
                    onChange={(e) => setMapa({ ...mapa, [c]: Number(e.target.value) })}
                    className={campo}
                  >
                    <option value={-1}>(no importar)</option>
                    {encabezados.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Vista previa ({datos.length > 5 ? `primeras 5 de ${datos.length} filas` : `${datos.length} ${datos.length === 1 ? "fila" : "filas"}`})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>{CAMPOS.filter((c) => mapa[c] >= 0).map((c) => <th key={c} className="p-2">{CAMPOS_IMPORTAR[c].titulo}</th>)}</tr>
                </thead>
                <tbody>
                  {filas.slice(0, 5).map((f, i) => (
                    <tr key={i} className="border-t border-stone-200 dark:border-stone-800">
                      {CAMPOS.filter((c) => mapa[c] >= 0).map((c) => <td key={c} className="p-2">{f[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {mapa.nombre < 0 ? (
            <p className="text-red-700">Elige qué columna tiene el nombre.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={importar} disabled={estado === "importando"} className={boton}>
                {estado === "importando" ? "Importando…" : `Importar ${validas.length} miembros`}
              </button>
              <button onClick={() => setMapa(null)} className={botonSecundario}>Cancelar</button>
              {validas.length < filas.length && (
                <span className="text-sm text-stone-500">
                  {filas.length - validas.length === 1
                    ? "1 fila sin nombre se omitirá."
                    : `${filas.length - validas.length} filas sin nombre se omitirán.`}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
