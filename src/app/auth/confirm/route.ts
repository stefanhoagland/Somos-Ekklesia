import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

// Enlace del correo de confirmación de cuenta.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const supabase = await crearClienteServidor();

  let ok = false;
  if (token_hash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const destino = request.nextUrl.clone();
  destino.search = "";
  destino.pathname = ok ? "/panel" : "/login";
  if (!ok) destino.searchParams.set("error", "El enlace no es válido o ha caducado.");
  return NextResponse.redirect(destino);
}
