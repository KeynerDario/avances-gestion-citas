-- ============================================
-- TABLA: Horarios semanales del profesional
-- ============================================
CREATE TABLE IF NOT EXISTS professional_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT unique_professional_day UNIQUE (professional_id, day_of_week, start_time)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_schedules_professional ON professional_schedules(professional_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON professional_schedules(day_of_week);

-- RLS
ALTER TABLE professional_schedules ENABLE ROW LEVEL SECURITY;

-- El profesional puede ver sus propios horarios
CREATE POLICY "Professional can view own schedules"
  ON professional_schedules FOR SELECT
  USING (auth.uid() = professional_id);

-- El profesional puede gestionar sus propios horarios
CREATE POLICY "Professional can manage own schedules"
  ON professional_schedules FOR ALL
  USING (auth.uid() = professional_id);

-- Admin puede gestionar todos los horarios
CREATE POLICY "Admin can manage all schedules"
  ON professional_schedules FOR ALL
  USING (is_admin());

-- ============================================
-- TABLA: Notas clínicas de las citas
-- ============================================
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notes_professional ON clinical_notes(professional_id);

-- RLS
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- Solo el profesional que atendió puede ver/editar sus notas
CREATE POLICY "Professional can manage own notes"
  ON clinical_notes FOR ALL
  USING (auth.uid() = professional_id);

-- Admin puede ver todas las notas
CREATE POLICY "Admin can view all notes"
  ON clinical_notes FOR SELECT
  USING (is_admin());

-- Coordinación puede ver notas de su dependencia
CREATE POLICY "Coordination can view dependency notes"
  ON clinical_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN profiles p ON a.professional_id = p.id
      WHERE a.id = clinical_notes.appointment_id
      AND p.dependency_id = (
        SELECT dependency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
