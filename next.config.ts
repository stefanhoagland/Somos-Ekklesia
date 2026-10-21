import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera una carpeta autónoma para la imagen Docker.
  output: "standalone",
  // Se deja fuera del paquete para que el script de migraciones también lo encuentre.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
