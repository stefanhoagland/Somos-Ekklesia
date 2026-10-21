import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera una carpeta autónoma para la imagen Docker.
  output: "standalone",
  // Se deja fuera del paquete para que el script de migraciones también lo encuentre.
  serverExternalPackages: ["postgres"],
  // Permite importar listas grandes de miembros desde Excel.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;
