import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  clave: string,
  sal: Buffer,
  largo: number,
) => Promise<Buffer>;

// Formato guardado: scrypt$<sal base64>$<hash base64>
export async function hashClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scryptAsync(clave, sal, 64);
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function verificarClave(clave: string, guardado: string): Promise<boolean> {
  const [algo, salB64, hashB64] = guardado.split("$");
  if (algo !== "scrypt" || !salB64 || !hashB64) return false;
  const esperado = Buffer.from(hashB64, "base64");
  const hash = await scryptAsync(clave, Buffer.from(salB64, "base64"), esperado.length);
  return timingSafeEqual(hash, esperado);
}
