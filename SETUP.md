# Guia de configuracion — DiscordVote

## 1. Base de datos (PostgreSQL)

Recomendacion: **Supabase** (gratis) o **Vercel Postgres**

### Opcion A: Supabase (recomendado)
1. Ir a https://supabase.com y crear cuenta
2. New Project > elegir nombre y region
3. Settings > Database > Connection string (URI) > copiar
4. Pegar en `.env` como `DATABASE_URL`

### Opcion B: Vercel Postgres
1. En el dashboard de Vercel: Storage > Create > Postgres
2. Copiar la `DATABASE_URL` de las environment variables

---

## 2. Discord OAuth App

1. Ir a https://discord.com/developers/applications
2. "New Application" > dar nombre
3. OAuth2 > General:
   - Copiar **Client ID** → `AUTH_DISCORD_ID`
   - Copiar **Client Secret** → `AUTH_DISCORD_SECRET`
   - Redirects → Agregar:
     - `http://localhost:3000/api/auth/callback/discord` (desarrollo)
     - `https://tu-app.vercel.app/api/auth/callback/discord` (produccion)

---

## 3. Obtener tu Discord ID (para ser admin)

1. En Discord: Ajustes > Avanzado > Activar "Modo desarrollador"
2. Click derecho en tu perfil > "Copiar ID de usuario"
3. Pegar en `.env` como `ADMIN_DISCORD_IDS`

---

## 4. Variables de entorno (.env)

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="genera con: openssl rand -base64 32"
AUTH_DISCORD_ID="tu-client-id"
AUTH_DISCORD_SECRET="tu-client-secret"
ADMIN_DISCORD_IDS="tu-discord-id"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 5. Crear las tablas en la base de datos

```bash
npx prisma migrate dev --name init
```

---

## 6. Correr en desarrollo

```bash
npm run dev
```

Abrir http://localhost:3000

---

## 7. Deploy en Vercel

1. Subir el proyecto a GitHub
2. Importar en https://vercel.com
3. Agregar las variables de entorno en Settings > Environment Variables
4. Deploy

> IMPORTANTE: En Vercel, cambiar `NEXTAUTH_URL` por la URL de produccion.
> Agregar la URL de produccion como Redirect en el Discord OAuth App.

---

## Flujo de uso

1. El **admin** (tu Discord ID) inicia sesion con Discord
2. Ve al **Panel Admin** y crea una eleccion con candidatos y fechas
3. Activa la eleccion cuando quieras que empiece la votacion
4. Los usuarios inician sesion con Discord y votan
5. El admin puede ver el **panel de auditoria**: quienes votaron (sin revelar a quien)
6. Cuando lo decida, el admin presiona **Revelar resultados** → aparecen publicamente
