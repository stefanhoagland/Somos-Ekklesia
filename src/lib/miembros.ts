export type Estado = "miembro" | "visitante" | "inactivo";

export const NOMBRE_ESTADO: Record<Estado, string> = {
  miembro: "Miembro",
  visitante: "Visitante",
  inactivo: "Inactivo",
};

export type Miembro = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento: string | null;
  direccion: string;
  estado: Estado;
  notas: string;
};

// Campos que se pueden importar, con los encabezados que solemos encontrar en un Excel.
export const CAMPOS_IMPORTAR = {
  nombre: { titulo: "Nombre", pistas: ["nombre", "nombres", "first name", "name"] },
  apellidos: { titulo: "Apellidos", pistas: ["apellido", "apellidos", "last name", "surname"] },
  email: { titulo: "Correo", pistas: ["correo", "email", "e-mail", "mail"] },
  telefono: { titulo: "Teléfono", pistas: ["telefono", "teléfono", "celular", "movil", "móvil", "tel", "phone", "whatsapp"] },
  fechaNacimiento: { titulo: "Fecha de nacimiento", pistas: ["nacimiento", "fecha de nacimiento", "cumpleaños", "cumpleanos", "birthday", "birth"] },
  direccion: { titulo: "Dirección", pistas: ["direccion", "dirección", "domicilio", "address"] },
  notas: { titulo: "Notas", pistas: ["notas", "nota", "comentarios", "observaciones", "notes"] },
} as const;

export type CampoImportar = keyof typeof CAMPOS_IMPORTAR;

export type FilaImportar = Partial<Record<CampoImportar, string>>;

// Acepta 2024-03-15, 15/03/2024, 15-03-2024 o 15.03.2024. Devuelve AAAA-MM-DD o null.
export function normalizarFecha(texto: string | undefined | null): string | null {
  const t = (texto ?? "").trim();
  if (!t) return null;
  let a: number, m: number, d: number;
  let r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (r) {
    [a, m, d] = [Number(r[1]), Number(r[2]), Number(r[3])];
  } else {
    r = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    if (!r) return null;
    [d, m, a] = [Number(r[1]), Number(r[2]), Number(r[3])];
    if (a < 100) a += a > 30 ? 1900 : 2000;
  }
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
  return f.toISOString().slice(0, 10);
}
