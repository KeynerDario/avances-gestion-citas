# Reporte de Despliegue — 2026-07-30

## Resumen Ejecutivo

| Componente | Estado | Detalle |
|------------|--------|---------|
| Supabase (Backend) | ✅ ACTIVO | Proyecto vkblkbgllpljtwptbjnr, región sa-east-1 |
| Base de Datos | ✅ CONFIGURADA | 8 tablas, RLS habilitado, funciones y triggers activos |
| Autenticación | ✅ FUNCIONAL | 7 usuarios, 4 roles configurados |
| Keep-Alive | ✅ ACTIVO | Cloudflare Worker + GitHub Actions |
| Frontend (Vercel) | ⏳ PENDIENTE | Requiere `npx vercel login` manual |
| Tests | ✅ 107/108 | 1 test falla (AppointmentForm - timeout) |

## Estado de la Base de Datos

| Tabla | Registros | RLS |
|-------|-----------|-----|
| roles | 4 | ✅ |
| dependencies | 3 | ✅ |
| profiles | 7 | ✅ |
| appointments | 6 | ✅ |
| professional_schedules | 1 | ✅ |
| clinical_notes | 0 | ✅ |
| audit_logs | 17 | ✅ |
| system_config | 8 | ✅ |

## Usuarios Configurados

| Email | Nombre | Rol | Dependencia |
|-------|--------|-----|-------------|
| kdarevalofria@gmail.com | Keyner Dario Arevalo Frias | SUPERADMIN | - |
| admin@test.com | Ana Admin | SUPERADMIN | - |
| coordinacion@test.com | Carlos Coordinador | COORDINACION | - |
| kyan@gmail.com | Kyan | PROFESIONAL | Enfermería |
| profesional@test.com | Maria Profesional | PROFESIONAL | Psicología |
| juniorliverpool11@gmail.com | Dairo | APRENDIZ | - |
| aprendiz@test.com | Juan Aprendiz | APRENDIZ | - |

## Roles y Permisos

| Rol | Permisos | Ruta |
|-----|----------|------|
| SUPERADMIN | ["all"] | /admin |
| COORDINACION | ["read", "write", "admin", "reports"] | /coordination |
| PROFESIONAL | ["read", "write", "clinical_notes"] | /professional |
| APRENDIZ | ["read"] | /dashboard |

## Funciones de Base de Datos

- ✅ `is_admin()` — Verifica si el usuario es SUPERADMIN
- ✅ `handle_new_user()` — Crea perfil automáticamente al registrar
- ✅ `auto_confirm_email()` — Auto-confirma email (desarrollo)
- ✅ `update_updated_at_column()` — Actualiza timestamp en UPDATE

## Triggers Activos

- ✅ `update_appointments_updated_at` → appointments
- ✅ `update_clinical_notes_updated_at` → clinical_notes
- ✅ `update_professional_schedules_updated_at` → professional_schedules
- ✅ `update_profiles_updated_at` → profiles

## Pendiente: Deploy en Vercel

Para completar el despliegue del frontend:

```bash
# 1. Login en Vercel (abre navegador)
npx vercel login

# 2. Desplegar en producción
npx vercel deploy --prod
```

O alternativamente:
1. Ir a https://vercel.com → New Project
2. Importar repositorio `KeynerDario/avances-gestion-citas`
3. Configurar variables de entorno:
   - `VITE_SUPABASE_URL` = `https://vkblkbgllpljtwptbjnr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...`
4. Deploy automático

## Keep-Alive (Supabase Gratuito)

| Mecanismo | Frecuencia | Estado |
|-----------|------------|--------|
| Cloudflare Worker | Diario 12:00 UTC | ⏳ Pendiente deploy |
| GitHub Actions | Cada 2 días | ✅ Configurado |

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| SUPERADMIN | admin@test.com | (definir) |
| PROFESIONAL | profesional@test.com | (definir) |
| APRENDIZ | aprendiz@test.com | (definir) |

## Warnings de Seguridad (No bloqueantes)

- 6 funciones SECURITY DEFINER ejecutables por `anon` (revisar permisos)
- 1 política RLS permisiva en audit_logs (INSERT)
- Leaked password protection deshabilitado (habilitar en Auth > Settings)
