# Panel — Club de Monetización

Panel de control estilo Notion para el equipo: tareas de soporte, tableros de
contenido (Skool, YouTube, TikTok, Instagram, Facebook), proyectos vinculados
a Google Drive, inicio de sesión con Google y perfiles personalizables con
fondo animado.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- **Auth.js / NextAuth v5** con proveedor de Google
- **Prisma** + PostgreSQL
- **@dnd-kit** para los tableros Kanban con arrastrar y soltar
- Componentes propios sobre **Radix UI** (sin dependencias de diseño externas)

## 1. Requisitos previos

- Node.js 20.9 o superior
- Una base de datos PostgreSQL. Recomendado: [Neon](https://neon.tech) o
  [Vercel Postgres](https://vercel.com/storage/postgres) (ambos tienen un
  plan gratuito y funcionan de inmediato con Vercel).
- Un proyecto en [Google Cloud Console](https://console.cloud.google.com)
  para las credenciales de inicio de sesión con Google.

## 2. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Crea un proyecto (o usa uno existente).
3. Ve a **Pantalla de consentimiento de OAuth**, elige "Externo" (o "Interno"
   si tienes Google Workspace) y completa el nombre de la app.
4. Ve a **Credenciales → Crear credenciales → ID de cliente de OAuth**.
   - Tipo de aplicación: **Aplicación web**.
   - Orígenes autorizados de JavaScript:
     - `http://localhost:3000` (desarrollo local)
     - `https://tu-dominio.vercel.app` (producción, ajusta al dominio real)
   - URI de redirección autorizados:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://tu-dominio.vercel.app/api/auth/callback/google`
5. Copia el **Client ID** y **Client Secret**.

## 3. Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL |
| `AUTH_SECRET` | Genera uno con `openssl rand -base64 33` |
| `AUTH_GOOGLE_ID` | Client ID de Google OAuth |
| `AUTH_GOOGLE_SECRET` | Client Secret de Google OAuth |
| `ADMIN_EMAILS` | Correos separados por coma que serán administradores automáticamente |

## 4. Instalar y preparar la base de datos

```bash
npm install
npm run db:push
```

`db:push` crea todas las tablas en tu base de datos a partir de
`prisma/schema.prisma`. Vuelve a ejecutarlo cada vez que cambies el esquema.

## 5. Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El primer inicio de
sesión con un correo incluido en `ADMIN_EMAILS` obtiene automáticamente el
rol de **Administrador**; desde la sección **Equipo** ese administrador
puede asignar los roles Soporte, Editor o Miembro al resto del equipo.

## 6. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub (o GitLab/Bitbucket).
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio.
3. En **Environment Variables**, agrega las mismas variables de `.env.local`
   (con el `DATABASE_URL` de producción y las URLs reales en Google OAuth).
4. Despliega. El script `postinstall` ejecuta `prisma generate`
   automáticamente en cada build.
5. Ejecuta `npm run db:push` una vez **apuntando a la base de datos de
   producción** (puedes hacerlo desde tu máquina exportando el
   `DATABASE_URL` de producción temporalmente, o usando `vercel env pull`).

## Funcionalidades

- **Inicio de sesión con Google** — sin contraseñas, cada persona entra con
  su cuenta de Google.
- **Tableros de contenido por plataforma** (Skool, YouTube, TikTok,
  Instagram, Facebook) con columnas Idea → Grabación → Edición → Revisión →
  Programado → Publicado, arrastrar y soltar incluido.
- **Tablero de soporte** con columnas Pendiente → En progreso → En revisión
  → Completada.
- **Proyectos** agrupan piezas de contenido y guardan un enlace directo a la
  carpeta de Google Drive con el material de trabajo.
- **Asignación de tareas** a cualquier miembro del equipo por su correo.
- **Comentarios** dentro de cada tarea para dejar contexto al equipo.
- **Perfil personalizable**: foto (se sube y se ajusta automáticamente),
  nombre, biografía, color de acento y fondo animado (partículas, aurora,
  degradado o sólido) con su propio color — por defecto, fondo oscuro con
  partículas animadas.
- **Roles**: Administrador, Soporte, Editor, Miembro. Los administradores
  gestionan los roles desde **Equipo**.

## Estructura del proyecto

```
prisma/schema.prisma        Modelo de datos (usuarios, proyectos, tareas, comentarios)
src/auth.ts                 Configuración de NextAuth (Google + Prisma adapter)
src/proxy.ts                Protección de rutas (equivalente a middleware en Next.js 16)
src/app/(dashboard)/        Páginas del panel (protegidas)
src/app/login/              Página de inicio de sesión
src/app/actions/            Server Actions (tareas, proyectos, perfil, equipo)
src/components/board/       Tableros Kanban, tarjetas y diálogos de tarea/proyecto
src/components/profile/     Formularios de perfil y selector de apariencia
src/components/layout/      Sidebar, topbar y fondo animado
```
