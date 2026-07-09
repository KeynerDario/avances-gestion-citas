import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  StickyNote,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: AlertCircle,
  },
  confirmed: {
    label: "Confirmada",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: CheckCircle,
  },
  completed: {
    label: "Completada",
    color: "#22c55e",
    bg: "#d1fae5",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelada",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: XCircle,
  },
  no_show: {
    label: "No asistió",
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: XCircle,
  },
};

export function AppointmentCard({ appointment, onCancel, isAprendiz }) {
  const {
    dependencies,
    scheduled_date,
    scheduled_time,
    status,
    reason,
    notes,
    profiles,
    professional,
  } = appointment;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  const formattedDate = (() => {
    try {
      return format(parseISO(scheduled_date), "EEEE d 'de' MMMM, yyyy", {
        locale: es,
      });
    } catch {
      return scheduled_date;
    }
  })();

  return (
    <div
      className="appointment-card"
      style={{ borderLeftColor: dependencies?.color || "#ccc" }}
    >
      <div className="card-header">
        <div
          className="dependency-badge"
          style={{
            background: dependencies?.color || "#6b7280",
            color: "#fff",
          }}
        >
          {dependencies?.name || "Sin dependencia"}
        </div>
        <span className="status-badge" style={{ color: config.color, background: config.bg }}>
          <Icon size={14} />
          {config.label}
        </span>
      </div>

      <div className="card-datetime">
        <div className="datetime-item">
          <Calendar size={15} />
          <span>{formattedDate}</span>
        </div>
        <div className="datetime-item">
          <Clock size={15} />
          <span>{scheduled_time}</span>
        </div>
      </div>

      <div className="card-body">
        {reason && (
          <p className="reason">
            <strong>Motivo:</strong> {reason}
          </p>
        )}
        {notes && (
          <p className="notes">
            <StickyNote size={14} />
            {notes}
          </p>
        )}
      </div>

      <div className="card-footer">
        {!isAprendiz && profiles && (
          <div className="person-info">
            <User size={14} />
            <span>{profiles.full_name}</span>
          </div>
        )}
        {isAprendiz && professional && (
          <div className="person-info">
            <User size={14} />
            <span>Dr(a). {professional.full_name}</span>
          </div>
        )}

        {isAprendiz && status === "pending" && (
          <button onClick={onCancel} className="btn-danger btn-sm">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}