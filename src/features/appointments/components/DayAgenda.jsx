import { useEffect, useMemo } from "react";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

const HOURS = Array.from({ length: 18 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatDateES(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentTimeSlot() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const slotM = m < 30 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${slotM}`;
}

export function DayAgenda({ appointments, selectedDate, onDateChange, onConfirm, onComplete, onNoShow, onAddNote, isLoading }) {
  useEffect(() => {
    const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
    const dayName = DAY_NAMES[dayOfWeek];
    document.title = `Agenda ${dayName} - Sistema de Citas`;
  }, [selectedDate]);

  const goToDay = (offset) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onDateChange(`${y}-${m}-${day}`);
  };

  const goToToday = () => {
    onDateChange(getTodayStr());
  };

  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const todayStr = useMemo(() => getTodayStr(), []);
  const isToday = selectedDate === todayStr;
  const currentTimeSlot = useMemo(() => isToday ? getCurrentTimeSlot() : null, [isToday]);

  const summary = useMemo(() => {
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    return { pending, confirmed, total: appointments.length };
  }, [appointments]);

  const getAppointmentsForSlot = (time) =>
    appointments.filter((a) => a.scheduled_time?.startsWith(time));

  const statusColors = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
  };

  const statusLabels = {
    pending: "Pendiente",
    confirmed: "Confirmada",
  };

  return (
    <div className="day-agenda full-height">
      <div className="agenda-header">
        <div className="agenda-nav">
          <button onClick={() => goToDay(-1)} className="nav-btn" title="Día anterior">
            <ChevronLeft size={18} />
          </button>
          <button onClick={goToToday} className="today-btn">
            Hoy
          </button>
          <button onClick={() => goToDay(1)} className="nav-btn" title="Día siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
        <h3 className="agenda-date">
          <Calendar size={18} />
          {dayName}, {formatDateES(selectedDate)}
        </h3>
        <div className="agenda-badges">
          {summary.pending > 0 && (
            <span className="agenda-badge pending">
              <Clock size={12} />
              {summary.pending} pendiente{summary.pending !== 1 ? "s" : ""}
            </span>
          )}
          {summary.confirmed > 0 && (
            <span className="agenda-badge confirmed">
              <AlertCircle size={12} />
              {summary.confirmed} confirmada{summary.confirmed !== 1 ? "s" : ""}
            </span>
          )}
          <span className="agenda-count">{summary.total} citas</span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={24} />
          <p>Cargando agenda...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="agenda-empty">
          <Calendar size={48} />
          <h4>Sin citas este día</h4>
          <p>No hay citas programadas para el {dayName} {formatDateES(selectedDate)}</p>
        </div>
      ) : (
        <div className="agenda-timeline">
          {HOURS.map((hour) => {
            const slotAppointments = getAppointmentsForSlot(hour);
            const isCurrentSlot = currentTimeSlot === hour;
            return (
              <div key={hour} className={`time-slot ${isCurrentSlot ? "current" : ""} ${slotAppointments.length > 0 ? "has-appointment" : ""}`}>
                <div className="time-label">
                  {isCurrentSlot && <span className="current-dot" />}
                  <Clock size={12} />
                  {hour}
                </div>
                <div className="slot-content">
                  {slotAppointments.length === 0 ? (
                    <div className="slot-empty">Disponible</div>
                  ) : (
                    slotAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="slot-appointment"
                        style={{
                          borderLeftColor: statusColors[apt.status] || "#6b7280",
                        }}
                      >
                        <div className="slot-apt-info">
                          <span className="slot-apt-name">
                            <User size={12} />
                            {apt.profiles?.full_name || "Sin nombre"}
                          </span>
                          <span className="slot-apt-reason">
                            {apt.reason || "Sin motivo"}
                          </span>
                        </div>
                        <span
                          className="slot-apt-status"
                          style={{
                            background: statusColors[apt.status] || "#6b7280",
                          }}
                        >
                          {statusLabels[apt.status] || apt.status}
                        </span>
                        <div className="slot-apt-actions">
                          {apt.status === "pending" && (
                            <>
                              <button
                                onClick={() => onConfirm(apt.id)}
                                className="slot-btn confirm"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => onNoShow(apt.id)}
                                className="slot-btn noshow"
                              >
                                No asistió
                              </button>
                            </>
                          )}
                          {apt.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => onComplete(apt.id)}
                                className="slot-btn complete"
                              >
                                Completar
                              </button>
                              <button
                                onClick={() => onAddNote(apt)}
                                className="slot-btn note"
                              >
                                Nota
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
