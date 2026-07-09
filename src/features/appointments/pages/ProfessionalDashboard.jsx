import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppointments } from "../hooks/useAppointments";
import { useProfessional } from "../hooks/useProfessional";
import { DayAgenda } from "../components/DayAgenda";
import { ClinicalNotes } from "../components/ClinicalNotes";
import { ScheduleManager } from "../components/ScheduleManager";
import { ProfessionalStats } from "../components/ProfessionalStats";
import { useAuth } from "../../../providers/AuthContext";
import { Modal } from "../../../shared/components/Modal";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";
import {
  Calendar,
  Clock,
  BarChart3,
  Settings,
  List,
  Loader2,
  Sun,
  Moon,
  Sunrise,
  User,
  CheckCircle,
  AlertTriangle,
  CalendarCheck,
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Buenos días", icon: Sunrise, color: "#f59e0b" };
  if (h < 18) return { text: "Buenas tardes", icon: Sun, color: "#39A900" };
  return { text: "Buenas noches", icon: Moon, color: "#6366f1" };
}

export default function ProfessionalDashboard() {
  const { profile } = useAuth();
  const roleLabel = profile?.dependencies?.name || "Profesional";
  const {
    appointments,
    fetchAppointments,
    isLoading: loadingAppointments,
  } = useAppointments();
  const {
    schedules,
    fetchSchedules,
    saveSchedule,
    deleteSchedule,
    toggleSchedule,
    dayAppointments,
    fetchDayAgenda,
    isLoadingDayAgenda,
    stats,
    fetchStats,
    updateAppointmentStatus,
  } = useProfessional();

  const [activeTab, setActiveTab] = useState("agenda");
  const [noteModal, setNoteModal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const refreshDayAgenda = useCallback(() => {
    fetchDayAgenda(selectedDate);
  }, [fetchDayAgenda, selectedDate]);

  useEffect(() => {
    fetchSchedules();
    fetchStats();
    refreshDayAgenda();
  }, [fetchSchedules, fetchStats, refreshDayAgenda]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchDayAgenda(newDate);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "agenda") {
      refreshDayAgenda();
    }
    if (tab === "pending") {
      fetchAppointments({ status: "pending" });
    }
    if (tab === "history") {
      fetchAppointments({ status: "completed" });
    }
    if (tab === "stats") {
      fetchStats();
    }
  };

  const handleConfirm = async (id) => {
    const updated = await updateAppointmentStatus(id, "confirmed");
    if (updated) {
      refreshDayAgenda();
    }
  };

  const handleComplete = async (id) => {
    const updated = await updateAppointmentStatus(id, "completed");
    if (updated) {
      refreshDayAgenda();
      fetchStats();
    }
  };

  const handleNoShow = async (id) => {
    const updated = await updateAppointmentStatus(id, "no_show");
    if (updated) {
      refreshDayAgenda();
      fetchStats();
    }
  };

  const tabs = [
    { id: "agenda", label: "Agenda del Día", icon: Calendar },
    { id: "pending", label: "Pendientes", icon: Clock },
    { id: "history", label: "Historial", icon: List },
    { id: "stats", label: "Estadísticas", icon: BarChart3 },
    { id: "schedule", label: "Mis Horarios", icon: Settings },
  ];

  const greeting = useMemo(() => getGreeting(), []);
  const GreetingIcon = greeting.icon;

  return (
    <DashboardLayout
      title={`${greeting.text}, ${profile?.full_name?.split(" ")[0] || "Profesional"}`}
      breadcrumbs={["Dashboard", "Profesional"]}
      actions={[]}
      userRole={profile?.roles?.name}
      loading={false}
      fullHeight
    >
      <div className="professional-dashboard">
        <div className="prof-header-info">
          <div className="prof-greeting">
            <GreetingIcon size={22} style={{ color: greeting.color, flexShrink: 0 }} />
            <span className="prof-dep-badge">{roleLabel}</span>
          </div>
        </div>

        {dayAppointments.length > 0 && (
          <div className="prof-quick-stats">
            <div className="prof-stat">
              <Calendar size={16} />
              <span className="prof-stat-count">{dayAppointments.length}</span>
              <span className="prof-stat-label">Citas hoy</span>
            </div>
            <div className="prof-stat">
              <CheckCircle size={16} />
              <span className="prof-stat-count">{dayAppointments.filter(a => a.status === 'completed').length}</span>
              <span className="prof-stat-label">Atendidas</span>
            </div>
            <div className="prof-stat">
              <Clock size={16} />
              <span className="prof-stat-count">{dayAppointments.filter(a => a.status === 'pending').length}</span>
              <span className="prof-stat-label">Pendientes</span>
            </div>
          </div>
        )}

        <nav className="prof-tabs" role="tablist" aria-label="Dashboard sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => handleTabChange(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <main
          className="dashboard-content"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "agenda" && (
            <DayAgenda
              appointments={dayAppointments}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onConfirm={handleConfirm}
              onComplete={(id) => {
                setNoteModal({ appointmentId: id, action: "complete" });
              }}
              onNoShow={handleNoShow}
              onAddNote={(apt) => setNoteModal({ appointmentId: apt.id, apt })}
              isLoading={isLoadingDayAgenda}
            />
          )}

          {activeTab === "pending" && (
            <div className="appointments-section">
              <div className="apt-section-header">
                <div className="apt-section-title">
                  <Clock size={20} />
                  <h3>Citas Pendientes</h3>
                </div>
                {appointments.filter((a) => a.status === "pending").length > 0 && (
                  <span className="apt-count-badge pending">
                    {appointments.filter((a) => a.status === "pending").length}
                  </span>
                )}
              </div>
              {loadingAppointments ? (
                <div className="loading-state" role="status" aria-live="polite">
                  <Loader2 className="spin" size={24} />
                  <p>Cargando citas...</p>
                </div>
              ) : appointments.filter((a) => a.status === "pending").length === 0 ? (
                <div className="empty-apt-state">
                  <div className="empty-apt-icon">
                    <CheckCircle size={40} />
                  </div>
                  <h4>¡Día libre de pendientes!</h4>
                  <p>Excelente, ya atendiste a todos tus aprendices hoy</p>
                </div>
              ) : (
                <div className="apt-cards-list">
                  {appointments
                    .filter((a) => a.status === "pending")
                    .map((apt) => (
                      <div key={apt.id} className="apt-card pending-card">
                        <div className="apt-card-left">
                          <div className="apt-card-avatar" style={{ background: "#f59e0b" }}>
                            {apt.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="apt-card-divider" />
                        </div>
                        <div className="apt-card-body">
                          <div className="apt-card-top">
                            <span className="apt-card-name">
                              {apt.profiles?.full_name || "Sin nombre"}
                            </span>
                            <span className="apt-card-status pending">
                              <Clock size={11} />
                              Pendiente
                            </span>
                          </div>
                          <div className="apt-card-details">
                            <span className="apt-card-detail">
                              <Calendar size={13} />
                              {apt.scheduled_date}
                            </span>
                            <span className="apt-card-detail">
                              <Clock size={13} />
                              {apt.scheduled_time?.slice(0, 5)}
                            </span>
                          </div>
                          {apt.reason && (
                            <p className="apt-card-reason">{apt.reason}</p>
                          )}
                          <div className="apt-card-actions">
                            <button
                              onClick={() => handleConfirm(apt.id)}
                              className="apt-btn confirm"
                            >
                              <CheckCircle size={14} />
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleNoShow(apt.id)}
                              className="apt-btn noshow"
                            >
                              <AlertTriangle size={14} />
                              No asistió
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="appointments-section">
              <div className="apt-section-header">
                <div className="apt-section-title">
                  <CalendarCheck size={20} />
                  <h3>Historial de Citas</h3>
                </div>
                {appointments.length > 0 && (
                  <span className="apt-count-badge gray">
                    {appointments.length}
                  </span>
                )}
              </div>
              {loadingAppointments ? (
                <div className="loading-state" role="status" aria-live="polite">
                  <Loader2 className="spin" size={24} />
                  <p>Cargando historial...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="empty-apt-state">
                  <div className="empty-apt-icon">
                    <List size={40} />
                  </div>
                  <h4>Aún no has atendido citas</h4>
                  <p>Tu historial crecerá con cada atención</p>
                </div>
              ) : (
                <div className="apt-cards-list">
                  {appointments.map((apt) => {
                    const statusConfig = {
                      completed: { label: "Atendida", color: "#10b981", bg: "#dcfce7" },
                      no_show: { label: "No asistió", color: "#ef4444", bg: "#fee2e2" },
                      cancelled: { label: "Cancelada", color: "#6b7280", bg: "#f3f4f6" },
                      confirmed: { label: "Confirmada", color: "#3b82f6", bg: "#dbeafe" },
                      pending: { label: "Pendiente", color: "#f59e0b", bg: "#fef3c7" },
                    };
                    const st = statusConfig[apt.status] || statusConfig.pending;
                    return (
                      <div key={apt.id} className="apt-card history-card">
                        <div className="apt-card-left">
                          <div className="apt-card-avatar" style={{ background: st.color }}>
                            {apt.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="apt-card-divider" />
                        </div>
                        <div className="apt-card-body">
                          <div className="apt-card-top">
                            <span className="apt-card-name">
                              {apt.profiles?.full_name || "Sin nombre"}
                            </span>
                            <span
                              className="apt-card-status"
                              style={{ color: st.color, background: st.bg }}
                            >
                              {st.label}
                            </span>
                          </div>
                          <div className="apt-card-details">
                            <span className="apt-card-detail">
                              <Calendar size={13} />
                              {apt.scheduled_date}
                            </span>
                            <span className="apt-card-detail">
                              <Clock size={13} />
                              {apt.scheduled_time?.slice(0, 5)}
                            </span>
                          </div>
                          {apt.reason && (
                            <p className="apt-card-reason">{apt.reason}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && <ProfessionalStats stats={stats} />}

          {activeTab === "schedule" && (
            <ScheduleManager
              schedules={schedules}
              onSave={saveSchedule}
              onDelete={deleteSchedule}
              onToggle={toggleSchedule}
            />
          )}
        </main>
      </div>

      <Modal
        isOpen={!!noteModal}
        onClose={() => setNoteModal(null)}
        title="Nota Clínica"
        className="note-modal"
      >
        {noteModal && (
          <ClinicalNotes
            appointmentId={noteModal.appointmentId}
            professionalId={profile?.id}
            onSave={() => {
              if (noteModal.action === "complete") {
                handleComplete(noteModal.appointmentId);
              }
              setNoteModal(null);
            }}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
