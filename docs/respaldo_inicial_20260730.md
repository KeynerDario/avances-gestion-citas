# Respaldo inicial — 2026-07-30

## Estado de la base de datos
- **Proyecto**: vkblkbgllpljtwptbjnr (gestion cita)
- **Región**: sa-east-1
- **Estado**: ACTIVE_HEALTHY
- **Tablas**: 8 (roles, dependencies, profiles, appointments, audit_logs, system_config, professional_schedules, clinical_notes)
- **RLS**: Habilitado en todas las tablas
- **Datos**: 0 filas en todas las tablas (base de datos limpia)

## Archivos respaldados
- setup-database.sql (roles + perfiles)
- cleanup_dependencies.sql (3 dependencias base)
- migrate_roles.sql (migración de roles antiguos)
- professional_schedules.sql (tablas adicionales)

## Conclusión
No se requiere backup de datos ya que la BD está vacía. El respaldo es únicamente del esquema y scripts SQL.
