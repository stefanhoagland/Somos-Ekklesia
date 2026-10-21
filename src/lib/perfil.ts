import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Rol = "admin" | "lider" | "miembro";

export type Perfil = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
};

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  lider: "Líder",
  miembro: "Miembro",
};

// Devuelve el perfil del usuario conectado, o lo manda a /login.
export async function perfilActual(): Promise<Perfil> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol")
    .eq("id", user.id)
    .single();
  if (!data) redirect("/login");
  return data as Perfil;
}
