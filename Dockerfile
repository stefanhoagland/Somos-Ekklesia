# Somos Ekklesia en un solo contenedor: app + PostgreSQL + copias de seguridad + túnel opcional.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine
ARG TARGETARCH
ARG CLOUDFLARED_VERSION=2025.8.1
RUN apk add --no-cache postgresql16 postgresql16-client su-exec tzdata \
 && wget -qO /usr/local/bin/cloudflared \
    "https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-linux-${TARGETARCH:-amd64}" \
 && chmod +x /usr/local/bin/cloudflared
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    DATABASE_URL=postgres://ekklesia@127.0.0.1:5432/ekklesia \
    COPIAS_DIAS=30 TZ=America/Mexico_City
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY db ./db
COPY scripts ./scripts
COPY docker/arrancar.sh /arrancar.sh
RUN chmod +x /arrancar.sh
# /datos: base de datos.  /copias: copias de seguridad diarias.
VOLUME ["/datos", "/copias"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["/arrancar.sh"]
