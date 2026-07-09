-- ============================================
-- SCRIPT DE CONFIGURACIÓN COMPLETA
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. INSERTAR ROLES
INSERT INTO roles (name, description, permissions)
VALUES
  ('APRENDIZ', 'Aprendiz/Estudiante del SENA', '["read"]'),
  ('PROFESIONAL', 'Profesional de bienestar (Psicología, Enfermería o Trabajo Social)', '["read", "write", "clinical_notes"]'),
  ('COORDINACION', 'Coordinador de dependencia', '["read", "write", "admin", "reports"]'),
  ('SUPERADMIN', 'Administrador del sistema', '["all"]')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- 2. OBTENER IDs DE ROLES
DO $$
DECLARE
  v_aprendiz_id INT;
  v_profesional_id INT;
  v_coordinacion_id INT;
  v_superadmin_id INT;
  v_user RECORD;
BEGIN
  SELECT id INTO v_aprendiz_id FROM roles WHERE name = 'APRENDIZ';
  SELECT id INTO v_profesional_id FROM roles WHERE name = 'PROFESIONAL';
  SELECT id INTO v_coordinacion_id FROM roles WHERE name = 'COORDINACION';
  SELECT id INTO v_superadmin_id FROM roles WHERE name = 'SUPERADMIN';

  -- 3. CREAR PERFILES PARA USUARIOS EXISTENTES
  FOR v_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO profiles (id, email, full_name, document_number, role_id, dependency_id, is_active)
    VALUES (
      v_user.id,
      v_user.email,
      COALESCE(v_user.raw_user_meta_data->>'full_name', 'Usuario'),
      COALESCE(v_user.raw_user_meta_data->>'document_number', '00000000'),
      CASE
        WHEN (v_user.raw_user_meta_data->>'role') = 'PROFESIONAL' THEN v_profesional_id
        WHEN (v_user.raw_user_meta_data->>'role') = 'COORDINACION' THEN v_coordinacion_id
        WHEN (v_user.raw_user_meta_data->>'role') = 'SUPERADMIN' THEN v_superadmin_id
        ELSE v_aprendiz_id
      END,
      CASE
        WHEN (v_user.raw_user_meta_data->>'role') = 'PROFESIONAL'
        THEN (SELECT id FROM dependencies WHERE name = 'Psicología' LIMIT 1)
        ELSE NULL
      END,
      true
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 4. VERIFICAR RESULTADO
SELECT
  p.id,
  p.email,
  p.full_name,
  r.name as role_name,
  d.name as dependency_name,
  p.is_active
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN dependencies d ON p.dependency_id = d.id;
