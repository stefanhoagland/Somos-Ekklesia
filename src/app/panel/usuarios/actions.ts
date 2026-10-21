"use server";

import { revalidatePath } from "next/cache";
import { perfilActual, type Rol } from "@/lib/perfil";
import { crearClienteServidor } from "@/lib/supabase/server";

const ROLES: Rol[] = ["admin", "lider", "miembro"];

export async function cambiarRol(formData: FormData) {
  const yo = await perfilActual();
  if (yo.rol !== "admin") return;

  const id = String(formData.get("id"));
  const rol = String(formData.get("rol")) as Rol;
  if (!ROLES.includes(rol) || id === yo.id) return;

  const supabase = await crearClienteServidor();
  await supabase.from("perfiles").update({ rol }).eq("id", id);
  revalidatePath("/panel/usuarios");
}
