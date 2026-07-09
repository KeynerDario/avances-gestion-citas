import { useState, useEffect } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { Settings, Save, RotateCcw, Calendar, Globe, Bell, ToggleLeft, ToggleRight, ChevronDown, AlertTriangle } from "lucide-react";

const CONFIG_SECTIONS = [
  {
    title: "Citas",
    icon: Calendar,
    fields: [
      { key: "max_pending_appointments", label: "Máximo citas pendientes", type: "number", min: 1, max: 10, hint: "Número máximo de citas pendientes por aprendiz" },
      { key: "appointment_duration_minutes", label: "Duración de cita (min)", type: "number", min: 15, max: 120, hint: "Duración predeterminada de cada cita" },
      { key: "allow_weekend_appointments", label: "Permitir citas en fin de semana", type: "boolean", hint: "Permitir agendamiento los sábados y domingos" },
      { key: "max_advance_booking_days", label: "Días máximos de anticipación", type: "number", min: 1, max: 180, hint: "Cuántos días adelante se puede agendar" },
      { key: "auto_confirm_appointments", label: "Auto-confirmar citas", type: "boolean", hint: "Confirmar citas automáticamente al crearlas" },
    ],
  },
  {
    title: "Notificaciones",
    icon: Bell,
    fields: [
      { key: "notification_email_enabled", label: "Notificaciones por email", type: "boolean", hint: "Enviar notificaciones por correo electrónico" },
      { key: "notification_sms_enabled", label: "Notificaciones por SMS", type: "boolean", hint: "Enviar notificaciones por mensaje de texto" },
    ],
  },
  {
    title: "Sistema",
    icon: Globe,
    fields: [
      { key: "timezone", label: "Zona horaria", type: "select", options: [
        { value: "America/Bogota", label: "Bogotá (UTC-5)" },
        { value: "America/Mexico_City", label: "Ciudad de México (UTC-6)" },
        { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
        { value: "America/Santiago", label: "Santiago (UTC-4)" },
        { value: "America/Lima", label: "Lima (UTC-5)" },
      ], hint: "Zona horaria del sistema" },
    ],
  },
];

const DEFAULTS = {
  max_pending_appointments: 2,
  appointment_duration_minutes: 30,
  allow_weekend_appointments: false,
  notification_email_enabled: true,
  notification_sms_enabled: false,
  auto_confirm_appointments: false,
  max_advance_booking_days: 60,
  timezone: "America/Bogota",
};

export function SystemConfig() {
  const { config, fetchConfig, updateConfig, loading } = useAdmin();
  const [overrides, setOverrides] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  if (loading && Object.keys(config).length === 0) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        <div className="loading-spinner" />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  const serverConfig = config && Object.keys(config).length > 0 ? config : DEFAULTS;
  const localConfig = { ...serverConfig, ...overrides };

  const handleChange = (key, value) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!window.confirm("¿Guardar cambios de configuración? Esto afecta a todos los usuarios.")) return;
    setIsSaving(true);
    try {
      const success = await updateConfig(overrides);
      if (success) {
        setSaved(true);
        setOverrides({});
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setOverrides({});
    setSaved(false);
  };

  return (
    <div className="system-config">
      <div className="config-header">
        <div>
          <h2>Configuración del Sistema</h2>
          <p className="config-subtitle">Ajustes generales de la aplicación</p>
        </div>
        <div className="config-actions">
          <button onClick={handleSave} disabled={isSaving || Object.keys(overrides).length === 0} className="config-btn-save">
            <Save size={16} />
            {isSaving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="config-sections">
        {CONFIG_SECTIONS.map((section) => (
          <div key={section.title} className="config-section">
            <div className="config-section-header">
              <section.icon size={18} />
              <h3>{section.title}</h3>
            </div>
            <div className="config-fields">
              {section.fields.map((field) => (
                <div key={field.key} className="config-field">
                  <div className="config-field-info">
                    <label>{field.label}</label>
                    <span className="config-field-hint">{field.hint}</span>
                  </div>
                  <div className="config-field-control">
                    {field.type === "boolean" ? (
                      <button
                        className={`config-toggle ${localConfig[field.key] ? "on" : "off"}`}
                        onClick={() => handleChange(field.key, !localConfig[field.key])}
                      >
                        {localConfig[field.key] ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        <span>{localConfig[field.key] ? "Sí" : "No"}</span>
                      </button>
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={localConfig[field.key] ?? ""}
                        onChange={(e) => handleChange(field.key, Number(e.target.value))}
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={localConfig[field.key] ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      >
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="advanced-filters">
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          <AlertTriangle size={16} />
          Avanzado
          <ChevronDown size={14} className={`chevron ${showAdvanced ? "open" : ""}`} />
        </button>
        {showAdvanced && (
          <div className="advanced-content">
            <div className="config-section" style={{ marginTop: "var(--space-md)" }}>
              <div className="config-section-header">
                <RotateCcw size={18} />
                <h3>Zona de peligro</h3>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-md)" }}>
                Estas acciones son destructivas y no se pueden deshacer.
              </p>
              <button onClick={handleReset} className="config-btn-reset" style={{ background: "var(--color-danger, #ef4444)", color: "#fff", borderColor: "var(--color-danger, #ef4444)" }}>
                <RotateCcw size={16} />
                Restablecer valores por defecto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
