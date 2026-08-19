import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "../validations/appointment.schema";
import { useAppointments } from "../hooks/useAppointments";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Calendar, Clock, FileText, Building2, Loader2, CheckCircle2, Sparkles } from "lucide-react";

export function AppointmentForm({ onSuccess }) {
  const { createAppointment, isCreating } = useAppointments();
  const [dependencies, setDependencies] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      dependency_id: "",
      scheduled_date: "",
      scheduled_time: "08:00",
      reason: "",
    },
  });

  const selectedDate = watch("scheduled_date");

  useEffect(() => {
    async function loadDependencies() {
      setLoadingDeps(true);
      const { data } = await supabase
        .from("dependencies")
        .select("*")
        .order("name");
      setDependencies(data || []);
      setLoadingDeps(false);
    }
    loadDependencies();
  }, []);

  const onSubmit = async (data) => {
    const result = await createAppointment(data);
    if (result.success) {
      onSuccess?.();
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 60);
    return max.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="appointment-form">
      <div className="appointment-form-header">
        <div className="appointment-form-icon">
          <Sparkles size={24} />
        </div>
        <div className="appointment-form-header-text">
          <h3>Solicita tu cita</h3>
          <p>Completa los datos para agendar con un profesional de bienestar</p>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-header">
          <Building2 size={18} className="form-card-icon" />
          <span>Dependencia</span>
        </div>
        <div className="form-group">
          <select
            {...register("dependency_id", { valueAsNumber: true })}
            disabled={loadingDeps}
            className="form-select-enhanced"
          >
            <option value="">
              {loadingDeps ? "Cargando..." : "Selecciona una dependencia"}
            </option>
            {dependencies.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.name}
              </option>
            ))}
          </select>
          {errors.dependency_id && (
            <span className="field-error">{errors.dependency_id.message}</span>
          )}
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-header">
          <Calendar size={18} className="form-card-icon" />
          <span>Fecha yHora</span>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label-light">Fecha</label>
            <input
              type="date"
              {...register("scheduled_date")}
              min={getMinDate()}
              max={getMaxDate()}
              className="form-input-enhanced"
            />
            {errors.scheduled_date && (
              <span className="field-error">{errors.scheduled_date.message}</span>
            )}
            {selectedDate && (
              <span className="field-hint">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", {
                  weekday: "long",
                })}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label-light">Hora</label>
            <select {...register("scheduled_time")} className="form-select-enhanced">
              {Array.from({ length: 18 }, (_, i) => {
                const hour = Math.floor(i / 2 + 8);
                const min = i % 2 === 0 ? "00" : "30";
                const value = `${hour.toString().padStart(2, "0")}:${min}`;
                const label = `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? "PM" : "AM"}`;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
            {errors.scheduled_time && (
              <span className="field-error">{errors.scheduled_time.message}</span>
            )}
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-header">
          <FileText size={18} className="form-card-icon" />
          <span>Motivo de consulta</span>
        </div>
        <div className="form-group">
          <textarea
            {...register("reason")}
            rows="3"
            placeholder="Describe brevemente por qué necesitas la cita..."
            className="form-textarea-enhanced"
          />
          {errors.reason && (
            <span className="field-error">{errors.reason.message}</span>
          )}
        </div>
      </div>

      <button type="submit" disabled={isCreating} className="btn-submit-appointment">
        {isCreating ? (
          <>
            <Loader2 className="spin" size={18} />
            Agendando...
          </>
        ) : (
          <>
            <CheckCircle2 size={18} />
            Solicitar Cita
          </>
        )}
      </button>
    </form>
  );
}