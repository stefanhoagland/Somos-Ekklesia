# Somos Ekklesia

La aplicación web para iglesias, con cuatro secciones:

1. **App para miembros:** grupos, mensajes, sermones y ofrendas.
2. **Miembros:** base de datos de miembros con control de asistencia.
3. **Registro de niños:** etiquetas de identificación y recogida.
4. **Planificación del culto:** planes de servicio, canciones y voluntarios.

Un mismo sitio sirve a **varias iglesias**. Cada cuenta pertenece a una iglesia y solo ve los datos de esa iglesia.

Está hecha con [Next.js](https://nextjs.org) y [PostgreSQL](https://www.postgresql.org), y se instala como **un solo contenedor Docker** (pensado para un servidor Unraid).

## Quién puede hacer qué

| Rol | Qué puede hacer |
| --- | --- |
| Superadministrador | Dar de alta iglesias, ver a su gente y ser el único que nombra o quita administradores. Es la primera cuenta que se crea al instalar. |
| Administrador | Todo dentro de su iglesia. En **Usuarios** puede hacer a alguien líder o miembro, pero no administrador. |
| Líder | Ver miembros, registro de niños y planificación del culto de su iglesia. |
| Miembro | Usar la app para miembros. |

**Cómo se une la gente:** el superadministrador crea una iglesia y obtiene un código de 6 letras (por ejemplo `NHN34X`). Las personas se registran en `/registro` con ese código. La primera persona de cada iglesia queda como su administrador; las demás entran como miembro.

## Instalación en Unraid

Todo va en **un solo contenedor**: la app, la base de datos PostgreSQL, una copia de seguridad diaria y, si quieres, el túnel de Cloudflare. La imagen se publica sola en `ghcr.io/stefanhoagland/somos-ekklesia:latest` cada vez que cambia `main`.

1. En Unraid ve a **Docker > Add Container**.
2. Rellena:
   - **Name:** `somos-ekklesia`
   - **Repository:** `ghcr.io/stefanhoagland/somos-ekklesia:latest`
   - **Port:** contenedor `3000` → host `3000`
   - **Path:** contenedor `/datos` → `/mnt/user/appdata/somos-ekklesia` (la base de datos)
   - **Path:** contenedor `/copias` → `/mnt/user/backups/somos-ekklesia` (las copias de seguridad)
   - **Variable** `TZ` (opcional): tu zona horaria, por ejemplo `America/Mexico_City`
3. Pulsa **Apply** y abre `http://IP-de-tu-servidor:3000`. Te llevará a **Primera instalación** para crear tu cuenta de superadministrador.

También puedes usar la plantilla [`unraid/somos-ekklesia.xml`](unraid/somos-ekklesia.xml): cópiala en `/boot/config/plugins/dockerMan/templates-user/` y aparecerá en **Add Container > Template**.

Con Docker normal es lo mismo:

```bash
docker run -d --name somos-ekklesia --restart unless-stopped -p 3000:3000 \
  -v /ruta/datos:/datos -v /ruta/copias:/copias ghcr.io/stefanhoagland/somos-ekklesia:latest
```

### Copias de seguridad

El contenedor guarda una copia de la base de datos al arrancar y luego cada 24 horas en `/copias`, y borra las de más de 30 días (cámbialo con la variable `COPIAS_DIAS`).

Para restaurar una copia:

```bash
gunzip -c /mnt/user/backups/somos-ekklesia/ekklesia-AAAAMMDD-HHMM.sql.gz \
  | docker exec -i somos-ekklesia su-exec postgres psql -d ekklesia
```

### Publicarlo en internet con Cloudflare Tunnel

Así el sitio tiene HTTPS y no hace falta abrir puertos en tu router.

1. Necesitas un dominio en Cloudflare.
2. En [Cloudflare Zero Trust](https://one.dash.cloudflare.com) ve a **Networks > Tunnels > Create a tunnel**, tipo **Cloudflared**, y copia el token.
3. En **Public Hostname** pon tu dominio (por ejemplo `app.tuiglesia.org`) apuntando a `http://localhost:3000`.
4. En Unraid, edita el contenedor y añade la variable `CLOUDFLARE_TUNNEL_TOKEN` con ese token.

### Invitaciones por correo (Brevo)

Los administradores pueden invitar gente por correo desde **Usuarios > Invitar por correo**. Para que funcione:

1. Crea una cuenta gratis en [Brevo](https://www.brevo.com) (300 correos al día).
2. Autentica tu dominio en **Settings > Senders, Domains & Dedicated IPs > Domains > Add a domain**. Si el dominio está en Cloudflare, Brevo añade los registros DNS solo.
3. En **SMTP & API > SMTP**, pulsa **Generate a new SMTP key**. Copia el login y la clave.
4. En Unraid, edita el contenedor y añade estas variables:

| Variable | Ejemplo |
| --- | --- |
| `SITIO_URL` | `https://app.tudominio.org` |
| `CORREO_REMITENTE` | `Somos Ekklesia <invitaciones@tudominio.org>` |
| `SMTP_USUARIO` | `xxxx@smtp-brevo.com` |
| `SMTP_CLAVE` | la clave SMTP de Brevo |

Para otro proveedor, cambia también `SMTP_HOST` (por defecto `smtp-relay.brevo.com`) y `SMTP_PUERTO` (por defecto `587`).

### Actualizar a una versión nueva

En **Docker**, pulsa en el icono del contenedor y elige **Force Update**. Los datos no se tocan, y los cambios de base de datos se aplican solos al arrancar.

## Miembros y asistencia

Los administradores y líderes de cada iglesia tienen dos páginas:

- **Miembros:** lista con buscador y filtro por estado (miembro, visitante, inactivo), alta y edición a mano. **Importar Excel** acepta `.xlsx` o `.csv` con encabezados en la primera fila. Adivina qué columna es cada dato, deja revisarlo con una vista previa e importa todo o nada.
- **Asistencia:** crea un culto o reunión con su fecha y marca quién vino. Si viene alguien nuevo, se añade como visitante desde la misma página. La lista de miembros muestra la última asistencia de cada persona.

Solo los administradores pueden borrar miembros o eventos.

## Privacidad

Este repositorio es **público**. Los datos de las iglesias viven solo en tu base de datos. Nunca subas aquí hojas de cálculo de miembros ni archivos `.env` (están bloqueados en `.gitignore`).

## Desarrollo

```bash
docker run -d --name ekk-db -e POSTGRES_USER=ekklesia -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ekklesia -p 5432:5432 postgres:16-alpine
cp .env.example .env.local
export DATABASE_URL=postgres://ekklesia:dev@localhost:5432/ekklesia
npm install
npm run migrar
npm run dev
```

Los cambios de base de datos van en `db/migraciones/` como archivos `NNNN_nombre.sql`. Se aplican en orden y una sola vez.
