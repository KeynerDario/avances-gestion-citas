-- Eliminar dependencias existentes
DELETE FROM dependencies;

-- Insertar solo las 3 dependencias correctas
INSERT INTO dependencies (id, name, color) VALUES
  (1, 'Psicología', '#3b82f6'),
  (2, 'Enfermería', '#10b981'),
  (3, 'Trabajo Social', '#f59e0b');

-- Resetear secuencia para que los IDs continúen desde 4
SELECT setval('dependencies_id_seq', 3);
