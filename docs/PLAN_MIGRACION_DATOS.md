# Plan de Migración de Datos — Sistema de Gestión de Citas SENA

## 1. Alcance

Migración de datos del sistema de gestión de citas entre entornos (desarrollo → producción) usando Supabase (PostgreSQL) como backend.

## 2. Inventario de Tablas

| Tabla | Registros estimados | Dependencias |
|-------|---------------------|--------------|
| `roles` | 4 | Ninguna |
| `dependencies` | 3 | Ninguna |
| `profiles` | ~50-200 | `roles`, `dependencies` |
| `appointments` | ~100-1000 | `profiles`, `dependencies` |
| `professional_schedules` | ~20-100 | `profiles` |
| `clinical_notes` | ~50-500 | `appointments`, `profiles` |
| `audit_logs` | ~500-5000 | `profiles` |
| `system_config` | ~5-20 | Ninguna |

## 3. Orden de Migración

El orden respeta las foreign keys:

```
1. roles              (sin dependencias)
2. dependencies       (sin dependencias)
3. profiles           (depende de roles, dependencies)
4. appointments       (depende de profiles, dependencies)
5. professional_schedules (depende de profiles)
6. clinical_notes     (depende de appointments, profiles)
7. audit_logs         (depende de profiles)
8. system_config      (sin dependencias)
```

## 4. Estrategia de Migración

### 4.1 Exportación del entorno origen

```bash
# Exportar cada tabla como CSV desde Supabase Dashboard > SQL Editor
# O usar pg_dump para backup completo:

pg_dump \
  --host=<ORIGIN_HOST> \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  --format=custom \
  --file=backup_origin.dump
```

### 4.2 Script de migración SQL

Ejecutar en el **SQL Editor** del Supabase destino, en orden:

```sql
-- PASO 1: Roles (idempotente)
INSERT INTO roles (name, description, permissions)
VALUES
  ('APRENDIZ', 'Aprendiz/Estudiante del SENA', '["read"]'),
  ('PROFESIONAL', 'Profesional de bienestar', '["read", "write", "clinical_notes"]'),
  ('COORDINACION', 'Coordinador de dependencia', '["read", "write", "admin", "reports"]'),
  ('SUPERADMIN', 'Administrador del sistema', '["all"]')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- PASO 2: Dependencias
INSERT INTO dependencies (id, name, color) VALUES
  (1, 'Psicología', '#3b82f6'),
  (2, 'Enfermería', '#10b981'),
  (3, 'Trabajo Social', '#f59e0b')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color;
SELECT setval('dependencies_id_seq', (SELECT MAX(id) FROM dependencies));

-- PASO 3: Perfiles (ejecutar después de que los usuarios existan en auth.users)
-- Los perfiles se sincronizan automáticamente via AuthProvider en la app
-- O manualmente desde el panel de Admin

-- PASO 4-8: Datos operativos se migran después del primer login de cada usuario
```

### 4.3 Migración de usuarios de Auth

Los usuarios de Supabase Auth **no se pueden migrar con SQL**. Opciones:

| Método | Cuándo usarlo |
|--------|---------------|
| Registro manual vía app | Pocos usuarios (<20) |
| Supabase Dashboard > Auth > Users | Importar CSV desde otro proyecto |
| Supabase Management API | Muchos usuarios, automatización |

**API de Supabase para crear usuarios:**

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "temporal123",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Juan Pérez",
      "document_number": "1234567890",
      "role": "APRENDIZ"
    }
  }'
```

### 4.4 Migración de datos operativos

Para tablas con registros existentes (appointments, clinical_notes, etc.):

```bash
# Exportar desde origen (SQL Editor)
COPY (
  SELECT * FROM appointments
  WHERE created_at >= '2025-01-01'
) TO '/tmp/appointments.csv' WITH CSV HEADER;

# Importar en destino (Supabase Dashboard > Table Editor > Import)
# O vía SQL:
COPY appointments (id, user_id, professional_id, dependency_id, ...)
FROM '/tmp/appointments.csv' WITH CSV HEADER;
```

## 5. Validación post-migración

```sql
-- Contar registros por tabla
SELECT
  'roles' as tabla, COUNT(*) as registros FROM roles
UNION ALL SELECT 'dependencies', COUNT(*) FROM dependencies
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'professional_schedules', COUNT(*) FROM professional_schedules
UNION ALL SELECT 'clinical_notes', COUNT(*) FROM clinical_notes
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL SELECT 'system_config', COUNT(*) FROM system_config;

-- Verificar integridad referencial
SELECT COUNT(*) as huérfanos
FROM appointments a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE p.id IS NULL;

-- Verificar secuencias
SELECT
  pg_get_serial_sequence('dependencies', 'id') as tabla,
  currval(pg_get_serial_sequence('dependencies', 'id')) as valor_actual;
```

## 6. Checklist de migración

- [ ] 1. Backup del entorno origen completo
- [ ] 2. Crear proyecto Supabase destino
- [ ] 3. Ejecutar `setup-database.sql` (tablas + RLS + funciones)
- [ ] 4. Ejecutar `professional_schedules.sql` (tablas adicionales)
- [ ] 5. Ejecutar `cleanup_dependencies.sql` (datos base)
- [ ] 6. Ejecutar `migrate_roles.sql` (si hay roles antiguos)
- [ ] 7. Migrar usuarios de Auth
- [ ] 8. Migrar datos operativos (appointments, clinical_notes)
- [ ] 9. Ejecutar scripts de validación
- [ ] 10. Probar login con cada rol
- [ ] 11. Verificar datos en cada dashboard
- [ ] 12. Configurar variables de entorno en Vercel
- [ ] 13. Deploy del frontend
- [ ] 14. Verificar keep-alive (Cloudflare Worker + GitHub Actions)

## 7. Rollback

En caso de error, restaurar desde el backup:

```bash
pg_restore \
  --host=<DEST_HOST> \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  --clean \
  --if-exists \
  backup_origin.dump
```
