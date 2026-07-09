import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "../validations/appointment.schema";
import { useAppointments } from "../hooks/useAppointments";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Calendar, Clock, FileText, Building2, Loader2 } from "lucide-react";

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
      <div className="form-group">
        <label>
          <Building2 size={16} />
          Dependencia
        </label>
        <select
          {...register("dependency_id", { valueAsNumber: true })}
          disabled={loadingDeps}
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

      <div className="form-row">
        <div className="form-group">
          <label>
            <Calendar size={16} />
            Fecha
          </label>
          <input
            type="date"
            {...register("scheduled_date")}
            min={getMinDate()}
            max={getMaxDate()}
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
          <label>
            <Clock size={16} />
            Hora
          </label>
          <select {...register("scheduled_time")}>
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

      <div className="form-group">
        <label>
          <FileText size={16} />
          Motivo de consulta
        </label>
        <textarea
          {...register("reason")}
          rows="4"
          placeholder="Describe brevemente por qué necesitas la cita..."
        />
        {errors.reason && (
          <span className="field-error">{errors.reason.message}</span>
        )}
      </div>

      <button type="submit" disabled={isCreating} className="btn-primary btn-full">
        {isCreating ? (
          <>
            <Loader2 className="spin" size={18} />
            Agendando...
          </>
        ) : (
          "Solicitar Cita"
        )}
      </button>
    </form>
  );
}