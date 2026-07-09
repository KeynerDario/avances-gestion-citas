import { Calendar, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, Award } from "lucide-react";

export function ProfessionalStats({ stats }) {
  if (!stats) {
    return (
      <div className="professional-stats-empty">
        <BarChart3 size={40} />
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Citas Hoy",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "#3b82f6",
      subtitle: "Pendientes + Confirmadas",
    },
    {
      label: "Este Mes",
      value: stats.monthAppointments,
      icon: Calendar,
      color: "#8b5cf6",
      subtitle: "Total del mes actual",
    },
    {
      label: "Atendidas",
      value: stats.monthCompleted,
      icon: CheckCircle,
      color: "#10b981",
      subtitle: "Completadas este mes",
    },
    {
      label: "No Asistió",
      value: stats.monthNoShow,
      icon: XCircle,
      color: "#ef4444",
      subtitle: "No show este mes",
    },
  ];

  const rate = stats.attendanceRate || 0;
  const rateColor = rate >= 80 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444";
  const rateLabel = rate >= 80 ? "Excelente" : rate >= 50 ? "Mejorable" : "Bajo";

  return (
    <div className="professional-stats">
      <div className="stats-header-row">
        <h3>Estadísticas del Mes</h3>
        <div className="stats-rate-card">
          <div className="rate-icon" style={{ color: rateColor }}>
            <Award size={20} />
          </div>
          <div className="rate-info">
            <span className="rate-value" style={{ color: rateColor }}>{rate}%</span>
            <span className="rate-label">{rateLabel}</span>
          </div>
        </div>
      </div>

      <div className="stats-progress-bar">
        <div className="progress-header">
          <span>Tasa de asistencia</span>
          <span className="progress-pct">{rate}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(rate, 100)}%`, background: rateColor }}
          />
        </div>
        <div className="progress-labels">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="stat-card-pro">
            <div className="stat-icon-pro" style={{ color: card.color, background: card.color + "12" }}>
              <card.icon size={22} />
            </div>
            <div className="stat-info-pro">
              <span className="stat-value-pro">{card.value}</span>
              <span className="stat-label-pro">{card.label}</span>
              <span className="stat-subtitle-pro">{card.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="stats-summary">
        <TrendingUp size={16} />
        <p>
          Total histórico: <strong>{stats.totalAppointments}</strong> citas atendidas
        </p>
      </div>
    </div>
  );
}
