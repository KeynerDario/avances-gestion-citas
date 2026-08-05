# Plan de Respaldo de Datos — Sistema de Gestión de Citas SENA

## 1. Alcance

Estrategia de respaldo para la base de datos PostgreSQL de Supabase (plan gratuito) cubriendo:
- Backup automático semanal de Supabase (incluido en el plan)
- Backup manual on-demand
- Respaldo de configuración y código
- Retención y recuperación

## 2. Niveles de Respaldo

### Nivel 1: Backup automático de Supabase

**Incluido gratis** en todos los planes de Supabase:
- **Frecuencia**: Semanal (automático)
- **Retención**: 7 días
- **Ubicación**: Infraestructura de AWS (misma región del proyecto)
- **Alcance**: Base de datos completa (schema + datos)

**Limitaciones del plan gratuito:**
- No se puede descargar el backup directamente
- Solo se puede restaurar al mismo proyecto
- No hay control sobre la frecuencia

### Nivel 2: Backup manual vía pg_dump

**Recomendado** para backups descargables y portables.

#### Prerrequisitos

```bash
# Instalar PostgreSQL client (solo pg_dump, no necesita servidor)
# Windows: descargar desde https://www.postgresql.org/download/windows/
# O usar Docker:
docker run --rm -v $(pwd):/backup postgres:16 pg_dump ...
```

#### Configuración de acceso

1. Ir a **Supabase Dashboard > Settings > Database > Connection string**
2. Copiar la URI de conexión (modo `transaction`)
3. Reemplazar `[YOUR-PASSWORD]` con la contraseña de la base de datos

#### Comando de backup completo

```bash
# Backup completo (schema + datos + owner)
pg_dump \
  --host=db.vkblkbgllpljtwptbjnr.supabase.co \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  --format=custom \
  --no-owner \
  --no-privileges \
  --verbose \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"
```

#### Comando por tablas específicas

```bash
# Solo tablas de negocio (sin auth, storage, etc.)
pg_dump \
  --host=db.vkblkbgllpljtwptbjnr.supabase.co \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  --format=custom \
  --table='public.roles' \
  --table='public.dependencies' \
  --table='public.profiles' \
  --table='public.appointments' \
  --table='public.professional_schedules' \
  --table='public.clinical_notes' \
  --table='public.audit_logs' \
  --table='public.system_config' \
  --file="backup_tables_$(date +%Y%m%d).dump"
```

#### Backup en CSV (para revisiones manuales)

```bash
# Exportar cada tabla importante a CSV
psql \
  --host=db.vkblkbgllpljtwptbjnr.supabase.co \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  -c "\COPY roles TO 'roles.csv' WITH CSV HEADER"
```

### Nivel 3: Backup de código y configuración

| Qué respaldar | Dónde | Frecuencia |
|---------------|-------|------------|
| Código fuente | GitHub repo | Cada commit |
| Variables de entorno | `.env.example` + Vercel Dashboard | Cuando cambien |
| SQL scripts | `*.sql` en repo | Cada commit |
| Configuración Supabase | Exportar desde Dashboard manualmente | Mensual |
| Usuarios Auth | Exportar desde Dashboard o API | Antes de cambios grandes |

## 3. Backup semanal automatizado (GitHub Actions)

Crear `.github/workflows/weekly-backup.yml`:

```yaml
name: Weekly DB Schema Backup

on:
  schedule:
    # Cada domingo a las 03:00 UTC
    - cron: "0 3 * * 0"
  workflow_dispatch:

jobs:
  schema-backup:
    name: Export schema snapshot
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: sudo apt-get update && sudo apt-get install -y postgresql-client

      - name: Export schema (no data)
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          pg_dump \
            "$SUPABASE_DB_URL" \
            --schema-only \
            --no-owner \
            --no-privileges \
            --file="backup/schema_$(date +%Y%m%d).sql"

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: schema-backup-${{ github.run_number }}
          path: backup/
          retention-days: 90
```

**Requiere secret**: `SUPABASE_DB_URL` = `postgresql://postgres:[PASSWORD]@db.vkblkbgllpljtwptbjnr.supabase.co:5432/postgres`

## 4. Tabla de retención

| Tipo de backup | Retención | Almacenamiento |
|----------------|-----------|----------------|
| Supabase automático | 7 días | Supabase (AWS) |
| pg_dump manual | 30 días | Local + nube |
| GitHub Actions artifacts | 90 días | GitHub |
| Git commits | Indefinido | GitHub |

## 5. Procedimiento de restauración

### Restaurar desde pg_dump

```bash
# Restaurar backup completo
pg_restore \
  --host=db.vkblkbgllpljtwptbjnr.supabase.co \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  --clean \
  --if-exists \
  --no-owner \
  --verbose \
  backup_20250730.dump
```

### Restaurar desde Supabase Dashboard

1. Ir a **Supabase Dashboard > Database > Backups**
2. Seleccionar el backup semanal más reciente
3. Hacer clic en **Restore**
4. Esperar a que termine (~1-5 min depending on size)

### Restaurar solo una tabla

```bash
pg_restore \
  --host=db.vkblkbgllpljtwptbjnr.supabase.co \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  --data-only \
  --table='public.appointments' \
  backup_20250730.dump
```

## 6. Checklist de respaldo

### Configuración inicial
- [ ] 1. Configurar `.env.example` con todas las variables documentadas
- [ ] 2. Configurar GitHub Actions secrets (SUPABASE_DB_URL)
- [ ] 3. Crear workflow de backup semanal
- [ ] 4. Probar backup manual con `pg_dump`
- [ ] 5. Verificar que el backup se puede restaurar

### Operación recurrente
- [ ] 1. Verificar backup semanal de Supabase (Dashboard > Backups)
- [ ] 2. Ejecutar pg_dump manual antes de cambios grandes
- [ ] 3. Revisar artifacts de GitHub Actions mensualmente
- [ ] 4. Documentar cambios en el esquema en CHANGELOG

## 7. Métricas de monitoreo

| Métrica | Frecuencia | Alerta si |
|---------|------------|-----------|
| Último backup exitoso | Semanal | >7 días sin backup |
| Tamaño de la base | Mensual | >500 MB (plan gratuito: 1 GB) |
| Tablas huérfanas | Semanal | >0 registros huérfanos |
| Secuencias agotadas | Mensual | ID cercano al límite |
