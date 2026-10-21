# Somos Ekklesia

La aplicación web para iglesias, con cuatro secciones:

1. **App para miembros:** grupos, mensajes, sermones y ofrendas.
2. **Miembros:** base de datos de miembros con control de asistencia.
3. **Registro de niños:** etiquetas de identificación y recogida.
4. **Planificación del culto:** planes de servicio, canciones y voluntarios.

Un mismo sitio sirve a **varias iglesias**. Cada cuenta pertenece a una iglesia y solo ve los datos de esa iglesia.

Está hecha con [Next.js](https://nextjs.org) y [PostgreSQL](https://www.postgresql.org), y se instala con Docker (pensado para un servidor Unraid).

## Quién puede hacer qué

| Rol | Qué puede hacer |
| --- | --- |
| Superadministrador | Dar de alta iglesias y ver sus códigos. Es la primera cuenta que se crea al instalar. |
| Administrador | Todo dentro de su iglesia, incluido cambiar roles en **Usuarios**. |
| Líder | Ver miembros, registro de niños y planificación del culto de su iglesia. |
| Miembro | Usar la app para miembros. |

**Cómo se une la gente:** el superadministrador crea una iglesia y obtiene un código de 6 letras (por ejemplo `NHN34X`). Las personas se registran en `/registro` con ese código. La primera persona de cada iglesia queda como su administrador; las demás entran como miembro.

## Instalación en Unraid

Necesitas el plugin **Docker Compose Manager** (Apps > buscar "Compose Manager").

1. En **Docker > Compose > Add New Stack**, llámalo `somos-ekklesia`.
2. Pega el contenido de [`docker-compose.yml`](docker-compose.yml) como archivo compose.
3. En **Edit Stack > Env File**, pega [`.env.example`](.env.example) y cambia `POSTGRES_PASSWORD` por una contraseña larga.
4. Pulsa **Compose Up**. La primera vez tarda unos minutos porque construye la app.
5. Abre `http://IP-de-tu-servidor:3000`. Te llevará a **Primera instalación** para crear tu cuenta de superadministrador.
   - Si entras por `http://` (sin HTTPS), pon `COOKIE_INSEGURA=1` en el env file, o el inicio de sesión no se guardará.

Se crean tres contenedores:

- `app`: la aplicación. Al arrancar aplica sola los cambios pendientes de la base de datos.
- `db`: PostgreSQL. Los datos quedan en `/mnt/user/appdata/somos-ekklesia/postgres`.
- `copias`: copia de seguridad diaria en `/mnt/user/backups/somos-ekklesia` (guarda 7 días, 4 semanas y 6 meses).

### Publicarlo en internet con Cloudflare Tunnel

Así el sitio tiene HTTPS y no hace falta abrir puertos en tu router.

1. Necesitas un dominio en Cloudflare (gratis si ya tienes uno).
2. En [Cloudflare Zero Trust](https://one.dash.cloudflare.com) ve a **Networks > Tunnels > Create a tunnel**, tipo **Cloudflared**.
3. Copia el token y ponlo en `CLOUDFLARE_TUNNEL_TOKEN` del env file.
4. En **Public Hostname** pon tu dominio (por ejemplo `app.tuiglesia.org`) apuntando a `http://app:3000`.
5. Arranca también el túnel: `docker compose --profile tunel up -d` (en Compose Manager, añade `--profile tunel` en las opciones de Compose Up).
6. Vuelve a poner `COOKIE_INSEGURA=0`.

### Actualizar a una versión nueva

En Compose Manager pulsa **Compose Down** y luego **Compose Up** con la opción de reconstruir (`--build`). Los datos no se tocan.

### Restaurar una copia de seguridad

```bash
gunzip -c /mnt/user/backups/somos-ekklesia/daily/ekklesia-AAAAMMDD.sql.gz \
  | docker exec -i somos-ekklesia-db-1 psql -U ekklesia -d ekklesia
```

## Privacidad

Este repositorio es **público**. Los datos de las iglesias viven solo en tu base de datos. Nunca subas aquí hojas de cálculo de miembros ni el archivo `.env` (están bloqueados en `.gitignore`).

## Desarrollo

```bash
docker run -d --name ekk-db -e POSTGRES_USER=ekklesia -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ekklesia -p 5432:5432 postgres:16-alpine
export DATABASE_URL=postgres://ekklesia:dev@localhost:5432/ekklesia
npm install
npm run migrar
npm run dev
```

Los cambios de base de datos van en `db/migraciones/` como archivos `NNNN_nombre.sql`. Se aplican en orden y una sola vez.
