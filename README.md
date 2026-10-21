# Somos Ekklesia

La aplicación web de la iglesia, con cuatro secciones:

1. **App para miembros:** grupos, mensajes, sermones y ofrendas.
2. **Miembros:** base de datos de miembros con control de asistencia.
3. **Registro de niños:** etiquetas de identificación y recogida.
4. **Planificación del culto:** planes de servicio, canciones y voluntarios.

Está hecha con [Next.js](https://nextjs.org), [Supabase](https://supabase.com) (inicio de sesión y base de datos) y se publica en [Vercel](https://vercel.com).

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| Administrador | Todo, incluido cambiar el rol de otras personas en **Usuarios** |
| Líder | Ver miembros, registro de niños y planificación del culto |
| Miembro | Usar la app para miembros |

La **primera persona que se registra** queda como administrador. Las demás entran como miembro, y un administrador puede cambiarlas.

## Puesta en marcha (una sola vez)

### 1. Crear la base de datos en Supabase

1. Crea una cuenta gratis en [supabase.com](https://supabase.com) y un proyecto nuevo.
2. En el proyecto, abre **SQL Editor > New query**, pega el contenido de `supabase/migrations/0001_perfiles_y_roles.sql` y pulsa **Run**.
3. En **Project Settings > API** copia la *Project URL* y la clave *anon public*.

### 2. Publicar en Vercel

1. Crea una cuenta en [vercel.com](https://vercel.com) con tu GitHub e importa este repositorio.
2. Antes de pulsar **Deploy**, añade dos variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL` = la Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la clave anon public
3. Cuando termine, copia la dirección del sitio (por ejemplo `https://somos-ekklesia.vercel.app`).
4. En Supabase, ve a **Authentication > URL Configuration** y pon esa dirección en **Site URL**.

### 3. Crear tu cuenta de administrador

Abre el sitio, pulsa **Entrar > Regístrate** y crea tu cuenta. Al ser la primera, serás administrador.

## Privacidad

Este repositorio es **público**. Los datos de miembros viven solo en Supabase y nunca deben subirse aquí (ni el Excel de miembros ni el archivo `.env.local`).

## Desarrollo local

```bash
cp .env.example .env.local   # y rellena los valores
npm install
npm run dev
```
