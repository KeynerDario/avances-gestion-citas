import { useState } from "react";
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  { value: 1, label: "Lun", full: "Lunes" },
  { value: 2, label: "Mar", full: "Martes" },
  { value: 3, label: "Mié", full: "Miércoles" },
  { value: 4, label: "Jue", full: "Jueves" },
  { value: 5, label: "Vie", full: "Viernes" },
  { value: 6, label: "Sáb", full: "Sábado" },
];

const TIME_OPTIONS = [];
for (let h = 7; h <= 18; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 18) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

export function ScheduleManager({ schedules, onSave, onDelete, onToggle }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (startTime >= endTime) {
      toast.error("La hora de inicio debe ser anterior a la hora de fin");
      return;
    }
    setSaving(true);
    await onSave({
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    });
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("¿Eliminar este horario?");
    if (ok) await onDelete(id);
  };

  const groupedSchedules = DAYS.map((day) => ({
    ...day,
    schedules: schedules.filter((s) => s.day_of_week === day.value),
  }));

  const totalSlots = schedules.filter((s) => s.is_active).length;

  return (
    <div className="schedule-manager">
      <div className="schedule-form">
        <div className="schedule-form-header">
          <div className="schedule-form-title">
            <CalendarDays size={18} />
            <h4>Nuevo Horario</h4>
          </div>
          {totalSlots > 0 && (
            <span className="schedule-total-badge">
              {totalSlots} horario{totalSlots !== 1 ? "s" : ""} activo{totalSlots !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="schedule-form-row">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            aria-label="Día de la semana"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.full}
              </option>
            ))}
          </select>
          <div className="schedule-time-group">
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-label="Hora de inicio"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="time-separator">a</span>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              aria-label="Hora de fin"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} className="btn-add-schedule" disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            <span>Agregar</span>
          </button>
        </div>
      </div>

      <div className="schedule-grid">
        {groupedSchedules.map((day) => (
          <div
            key={day.value}
            className={`schedule-day ${day.schedules.length === 0 ? "empty" : "has-content"}`}
          >
            <div className="schedule-day-header">
              <span className="day-short">{day.label}</span>
              <span className="day-full">{day.full}</span>
              {day.schedules.length > 0 && (
                <span className="day-count">{day.schedules.length}</span>
              )}
            </div>
            <div className="schedule-day-slots">
              {day.schedules.length === 0 ? (
                <span className="no-schedule">Sin horario</span>
              ) : (
                day.schedules.map((s) => (
                  <div
                    key={s.id}
                    className={`schedule-slot ${!s.is_active ? "inactive" : ""}`}
                  >
                    <div className="slot-time-info">
                      <Clock size={12} />
                      <span className="slot-time">
                        {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="slot-actions">
                      <button
                        onClick={() => onToggle(s.id, !s.is_active)}
                        className="toggle-btn"
                        title={s.is_active ? "Desactivar" : "Activar"}
                        aria-label="Cambiar estado"
                      >
                        {s.is_active ? (
                          <ToggleRight size={16} className="active" />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="delete-btn"
                        title="Eliminar"
                        aria-label="Eliminar horario"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
