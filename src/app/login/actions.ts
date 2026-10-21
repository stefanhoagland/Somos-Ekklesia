"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function iniciarSesion(formData: FormData) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect("/login?error=" + encodeURIComponent("Correo o contraseña incorrectos."));
  redirect("/panel");
}

export async function registrarse(formData: FormData) {
  const supabase = await crearClienteServidor();
  const origen = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { nombre: String(formData.get("nombre") ?? "").trim() },
      emailRedirectTo: `${origen}/auth/confirm`,
    },
  });
  if (error) redirect("/login?modo=registro&error=" + encodeURIComponent(error.message));
  redirect("/login?aviso=" + encodeURIComponent("Revisa tu correo para confirmar tu cuenta."));
}
