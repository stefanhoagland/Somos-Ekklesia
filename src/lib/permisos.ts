import { redirect } from "next/navigation";
import { exigirUsuario, type Usuario } from "@/lib/sesion";

export type UsuarioDeIglesia = Usuario & { iglesiaId: string };

// Para páginas de líderes y administradores de una iglesia.
export async function exigirLider(): Promise<UsuarioDeIglesia> {
  const u = await exigirUsuario();
  if (!u.iglesiaId || (u.rol !== "admin" && u.rol !== "lider")) redirect("/panel");
  return u as UsuarioDeIglesia;
}

export async function exigirAdmin(): Promise<UsuarioDeIglesia> {
  const u = await exigirLider();
  if (u.rol !== "admin") redirect("/panel");
  return u;
}
