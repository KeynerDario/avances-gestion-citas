-- Crear el rol PROFESIONAL si no existe
INSERT INTO roles (name, description)
VALUES ('PROFESIONAL', 'Profesional de bienestar (Psicología, Enfermería o Trabajo Social)')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Migrar usuarios con roles antiguos a PROFESIONAL
UPDATE profiles SET role_id = (SELECT id FROM roles WHERE name = 'PROFESIONAL')
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('PSICOLOGIA', 'ENFERMERIA', 'TRABAJO_SOCIAL'));

-- Opcional: eliminar roles antiguos
DELETE FROM roles WHERE name IN ('PSICOLOGIA', 'ENFERMERIA', 'TRABAJO_SOCIAL');
