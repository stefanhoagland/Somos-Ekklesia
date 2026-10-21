import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";

export type Rol = "admin" | "lider" | "miembro";

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  lider: "Líder",
  miembro: "Miembro",
};

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  esSuperadmin: boolean;
  iglesiaId: string | null;
  iglesiaNombre: string | null;
  rol: Rol;
};

const COOKIE = "sesion";
const DURACION_DIAS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function crearSesion(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACION_DIAS * 24 * 60 * 60 * 1000);
  await sql`
    insert into sesiones (token_hash, usuario_id, expira_en)
    values (${hashToken(token)}, ${usuarioId}, ${expira})
  `;
  // Cookie segura solo cuando se entra por HTTPS (por ejemplo, con Cloudflare Tunnel).
  // Así también funciona por http://IP-del-servidor dentro de casa.
  const https = (await headers()).get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    expires: expira,
  });
}

export async function cerrarSesion() {
  const almacen = await cookies();
  const token = almacen.get(COOKIE)?.value;
  if (token) await sql`delete from sesiones where token_hash = ${hashToken(token)}`;
  almacen.delete(COOKIE);
}

// Usuario conectado, o null.
export async function usuarioActual(): Promise<Usuario | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [u] = await sql<Usuario[]>`
    select u.id, u.email, u.nombre, u.es_superadmin, u.iglesia_id, u.rol,
           i.nombre as iglesia_nombre
    from sesiones s
    join usuarios u on u.id = s.usuario_id
    left join iglesias i on i.id = u.iglesia_id
    where s.token_hash = ${hashToken(token)} and s.expira_en > now()
  `;
  return u ?? null;
}

// Usuario conectado, o lo manda a /login.
export async function exigirUsuario(): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  return u;
}
