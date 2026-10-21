#!/bin/sh
# Arranca todo dentro del contenedor:
# PostgreSQL (solo accesible desde dentro), migraciones, copias diarias,
# Cloudflare Tunnel (si hay token) y la app.
set -eu

PGDATA=/datos/postgres
export PGDATA
mkdir -p "$PGDATA" /copias /run/postgresql
chown -R postgres:postgres /datos /run/postgresql
chown postgres:postgres /copias

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "Creando la base de datos por primera vez..."
  su-exec postgres initdb -D "$PGDATA" -U postgres >/dev/null
  # Solo se aceptan conexiones desde dentro del contenedor.
  cat > "$PGDATA/pg_hba.conf" <<'HBA'
local all      postgres                 trust
host  ekklesia ekklesia 127.0.0.1/32    trust
HBA
  echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
fi

su-exec postgres pg_ctl -D "$PGDATA" -w -l /datos/postgres.log start >/dev/null
echo "PostgreSQL en marcha."

# Crea el usuario y la base de datos si faltan.
su-exec postgres psql -qtAc "select 1 from pg_roles where rolname='ekklesia'" | grep -q 1 \
  || su-exec postgres psql -qc "create role ekklesia login"
su-exec postgres psql -qtAc "select 1 from pg_database where datname='ekklesia'" | grep -q 1 \
  || su-exec postgres psql -qc "create database ekklesia owner ekklesia"

su-exec node node scripts/migrar.mjs

# Copia de seguridad al arrancar y luego cada 24 horas. Borra las de más de COPIAS_DIAS días.
(
  while true; do
    archivo="/copias/ekklesia-$(date +%Y%m%d-%H%M).sql.gz"
    if su-exec postgres pg_dump -d ekklesia | gzip > "$archivo.tmp"; then
      mv "$archivo.tmp" "$archivo"
      echo "Copia de seguridad: $archivo"
    else
      rm -f "$archivo.tmp"
      echo "ERROR: falló la copia de seguridad"
    fi
    find /copias -name 'ekklesia-*.sql.gz' -mtime +"$COPIAS_DIAS" -delete
    sleep 86400
  done
) &

if [ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]; then
  echo "Iniciando Cloudflare Tunnel..."
  cloudflared tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN" &
fi

parar() {
  echo "Deteniendo..."
  kill "$APP" 2>/dev/null || true
  wait "$APP" 2>/dev/null || true
  su-exec postgres pg_ctl -D "$PGDATA" -m fast stop >/dev/null
  exit 0
}
trap parar TERM INT

su-exec node node server.js &
APP=$!
wait "$APP" || true
# Si la app se cae, se para todo y Docker la vuelve a arrancar.
su-exec postgres pg_ctl -D "$PGDATA" -m fast stop >/dev/null || true
exit 1
