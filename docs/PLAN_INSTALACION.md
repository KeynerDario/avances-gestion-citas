# Plan de Instalación — Sistema de Gestión de Citas SENA

## 1. Requisitos previos

### Cuentas necesarias (todas gratuitas)

| Servicio | Propósito | URL |
|----------|-----------|-----|
| GitHub | Código fuente y CI/CD | https://github.com |
| Supabase | Backend (Auth + DB + API) | https://supabase.com |
| Vercel | Hosting del frontend | https://vercel.com |
| Cloudflare | Keep-alive del worker | https://cloudflare.com |

### Herramientas locales

| Herramienta | Versión mínima | Propósito |
|-------------|----------------|-----------|
| Node.js | 18+ | Runtime de JavaScript |
| npm | 9+ | Gestor de paquetes |
| Git | 2.40+ | Control de versiones |
| PostgreSQL client | 16+ | Backup (solo `pg_dump`) |

## 2. Instalación del entorno de desarrollo

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/<TU_USUARIO>/avances-gestion-citas.git
cd avances-gestion-citas
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```
VITE_SUPABASE_URL=https://<TU_PROYECTO>.supabase.co
VITE_SUPABASE_ANON_KEY=<TU_ANON_KEY>
```

**Obtener las credenciales de Supabase:**
1. Ir a https://supabase.com → Dashboard
2. Seleccionar tu proyecto (o crear uno nuevo)
3. Ir a **Settings > API**
4. Copiar **Project URL** y **anon/public key**

### Paso 4: Iniciar servidor de desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

## 3. Configuración de Supabase

### 3.1 Crear el proyecto

1. Ir a https://supabase.com → **New Project**
2. Configurar:
   - **Organization**: Seleccionar o crear
   - **Project name**: `sena-citas` (o el nombre que prefieras)
   - **Database password**: Generar uno fuerte (guardarlo)
   - **Region**: Us East (Virginia) — más cercana a Colombia
3. Esperar ~2 minutos a que se active

### 3.2 Configurar la base de datos

Ir a **SQL Editor** y ejecutar en orden:

```sql
-- 1. Ejecutar el script principal de setup
-- (pegar contenido de setup-database.sql)
```

Luego ejecutar el script de horarios profesionales:

```sql
-- 2. Ejecutar professional_schedules.sql
-- (pegar contenido de src/features/appointments/api/professional_schedules.sql)
```

Luego limpiar dependencias:

```sql
-- 3. Ejecutar cleanup_dependencies.sql
-- (pegar contenido de cleanup_dependencies.sql)
```

### 3.3 Configurar Auth

En **Authentication > Settings**:

1. **Site URL**: `http://localhost:5173` (desarrollo) / `https://<TU_APP>.vercel.app` (producción)
2. **Redirect URLs**: Agregar ambas URLs
3. Habilitar **Confirm email** si se desea (recomendado para producción)

### 3.4 Configurar Storage (opcional)

Si se necesita subir archivos:

1. Ir a **Storage**
2. Crear bucket `avatars` (público para fotos de perfil)
3. Configurar políticas de acceso

## 4. Crear el primer usuario admin

### Opción A: Desde la app (recomendado)

1. Iniciar la app (`npm run dev`)
2. Ir a `/register`
3. Registrarse con cualquier email
4. En Supabase Dashboard > **SQL Editor**, ejecutar:

```sql
-- Hacer al primer usuario SUPERADMIN
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'SUPERADMIN')
WHERE email = 'tu-email@example.com';
```

5. Cerrar sesión y volver a entrar (para refrescar el perfil)

### Opción B: Desde Supabase Dashboard

1. Ir a **Authentication > Users > New User**
2. Crear usuario con email y contraseña
3. Ejecutar el SQL anterior para asignar el rol

## 5. Crear usuarios de prueba

```sql
-- Crear profesional de Psicología
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'profesional@prueba.com',
  crypt('Prof1234', gen_salt('bf')),
  now(),
  '{"full_name":"Dr. Juan Pérez","document_number":"1234567890","role":"PROFESIONAL","dependency_id":1}',
  now()
);

-- Crear aprendiz
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'aprendiz@prueba.com',
  crypt('Aprend1234', gen_salt('bf')),
  now(),
  '{"full_name":"María García","document_number":"0987654321","role":"APRENDIZ"}',
  now()
);
```

**Credenciales de prueba:**

| Rol | Email | Contraseña |
|-----|-------|------------|
| SUPERADMIN | tu-email@... | (la que definiste) |
| PROFESIONAL | profesional@prueba.com | Prof1234 |
| APRENDIZ | aprendiz@prueba.com | Aprend1234 |

## 6. Deploy en Vercel

### 6.1 Conectar el repositorio

1. Ir a https://vercel.com → **New Project**
2. Importar el repositorio de GitHub
3. Configurar:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 6.2 Configurar variables de entorno en Vercel

En **Settings > Environment Variables**:

| Variable | Valor | Ambiente |
|----------|-------|----------|
| `VITE_SUPABASE_URL` | `https://<TU_PROYECTO>.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview |

### 6.3 Deploy

1. Hacer push a `main`
2. Vercel despliega automáticamente
3. Verificar en la URL asignada

### 6.4 Configurar dominio personalizado (opcional)

1. **Settings > Domains**
2. Agregar dominio personalizado
3. Configurar DNS según las instrucciones de Vercel

## 7. Configurar Keep-Alive (Supabase gratuito)

Supabase pausa la DB tras 7 días sin actividad. Configurar el worker:

### 7.1 Cloudflare Worker (principal)

```bash
cd workers/supabase-keepalive
npm install
npx wrangler login
npx wrangler deploy
```

### 7.2 GitHub Actions (respaldo)

1. Ir a **Settings > Secrets and variables > Actions** del repo
2. Agregar secrets:
   - `SUPABASE_URL`: `https://<TU_PROYECTO>.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbG...`
3. El workflow `.github/workflows/supabase-keepalive.yml` ya está configurado

## 8. Configurar GitHub Actions (CI/CD)

### 8.1 Secrets del repositorio

En **Settings > Secrets and variables > Actions**:

| Secret | Valor | Uso |
|--------|-------|-----|
| `SUPABASE_URL` | URL del proyecto | Keep-alive + tests |
| `SUPABASE_ANON_KEY` | Anon key | Keep-alive + tests |
| `SUPABASE_DB_URL` | Connection string | Backup semanal |

### 8.2 Workflows disponibles

| Workflow | Trigger | Propósito |
|----------|---------|-----------|
| `supabase-keepalive.yml` | Cron 2 días + manual | Mantener DB activa |
| `weekly-backup.yml` | Cron semanal | Backup del esquema |

## 9. Verificación post-instalación

### Checklist de validación

- [ ] 1. `npm run dev` inicia sin errores
- [ ] 2. Login funciona con SUPERADMIN
- [ ] 3. Login funciona con PROFESIONAL
- [ ] 4. Login funciona con APRENDIZ
- [ ] 5. Dashboard muestra datos correctos por rol
- [ ] 6. CRUD de citas funciona
- [ ] 7. CRUD de usuarios funciona (admin)
- [ ] 8. Exportar CSV funciona (coordination)
- [ ] 9. Vercel despliega sin errores
- [ ] 10. Cloudflare Worker responde 200
- [ ] 11. GitHub Actions keep-alive corre sin errores
- [ ] 12. Backup manual con `pg_dump` funciona

### Comandos de verificación

```bash
# Verificar build local
npm run build

# Verificar tests
npm run test:run

# Verificar lint
npm run lint

# Verificar worker
cd workers/supabase-keepalive
npx wrangler dev --test-scheduled
```

## 10. Estructura final del proyecto

```
avances-gestion-citas/
├── src/                    # Código fuente React
├── workers/                # Cloudflare Workers
│   └── supabase-keepalive/ # Keep-alive de Supabase
├── .github/workflows/      # CI/CD
│   └── supabase-keepalive.yml
├── docs/                   # Documentación
│   ├── PLAN_MIGRACION_DATOS.md
│   ├── PLAN_RESPALDO_DATOS.md
│   └── PLAN_INSTALACION.md
├── .env.local              # Variables (no commitear)
├── .env.example            # Plantilla de variables
├── vercel.json             # Configuración Vercel
├── setup-database.sql      # Script de BD principal
├── cleanup_dependencies.sql
└── migrate_roles.sql
```

## 11. Troubleshooting

| Problema | Solución |
|----------|----------|
| `Faltan variables de entorno` | Verificar `.env.local` existe y tiene valores |
| `Invalid API key` | Verificar que la anon key sea correcta en Supabase Dashboard |
| `RLS policy violation` | Verificar que RLS esté configurado correctamente |
| `Build falla en Vercel` | Verificar variables de entorno en Vercel Dashboard |
| `Worker no responde` | Verificar login con `npx wrangler login` |
| `GitHub Actions no corre` | Verificar secrets configurados en el repo |
| `Supabase en pausa` | Verificar que el keep-alive esté activo (Cloudflare dashboard) |
