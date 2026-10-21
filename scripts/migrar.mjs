// Aplica en orden los archivos de db/migraciones que falten.
// Se ejecuta solo al arrancar el contenedor (y con `npm run migrar`).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
const carpeta = path.join(process.cwd(), "db", "migraciones");

await sql`
  create table if not exists migraciones (
    nombre text primary key,
    aplicada_en timestamptz not null default now()
  )
`;
const hechas = new Set((await sql`select nombre from migraciones`).map((r) => r.nombre));
const archivos = (await readdir(carpeta)).filter((f) => f.endsWith(".sql")).sort();

for (const archivo of archivos) {
  if (hechas.has(archivo)) continue;
  const contenido = await readFile(path.join(carpeta, archivo), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(contenido);
    await tx`insert into migraciones (nombre) values (${archivo})`;
  });
  console.log(`Migración aplicada: ${archivo}`);
}

await sql.end();
