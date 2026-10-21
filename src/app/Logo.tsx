import Image from "next/image";

// Logo de Somos Ekklesia: Chi-Rho con Alfa y Omega.
export function Logo({ tamano = 40 }: { tamano?: number }) {
  return <Image src="/logo.svg" alt="" width={tamano} height={tamano} priority />;
}
