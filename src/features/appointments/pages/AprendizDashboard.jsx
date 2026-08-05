import { useEffect, useState } from "react";
import { useAppointments } from "../hooks/useAppointments";
import { AppointmentForm } from "../components/AppointmentForm";
import { AppointmentCard } from "../components/AppointmentCard";
import { Plus, Calendar, XCircle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";
import { Modal } from "../../../shared/components/Modal";
import { useTabKeyboardNav } from "../../../shared/utils/useTabKeyboardNav";

const STATUS_TABS = [
  { id: "all", label: "Todas", icon: Calendar },
  { id: "pending", label: "Pendientes", icon: Clock },
  { id: "confirmed", label: "Confirmadas", icon: CheckCircle },
  { id: "completed", label: "Completadas", icon: CheckCircle },
  { id: "cancelled", label: "Canceladas", icon: XCircle },
  { id: "no_show", label: "No asistió", icon: AlertCircle },
];

export default function AprendizDashboard() {
  const { appointments, fetchAppointments, cancelAppointment, isLoading } =
    useAppointments();
  const [showForm, setShowForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments =
    activeTab === "all"
      ? appointments
      : appointments.filter((apt) => apt.status === activeTab);

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE) || 1;
  const paginatedAppointments = filteredAppointments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const counts = {
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    no_show: appointments.filter((a) => a.status === "no_show").length,
  };

  const canCreate = counts.pending < 2;
  const tabIds = STATUS_TABS.map((t) => t.id);
  const handleTabKeyDown = useTabKeyboardNav(tabIds, activeTab, handleTabChange);

  const dashboardActions = [
    {
      label: "Actualizar",
      onClick: fetchAppointments,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L18 18" />
          <path d="M3.51 14A9 9 0 0 0 18.36 18.36L6 6" />
        </svg>
      ),
    },
    {
      label: "Exportar",
      onClick: () => {},
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Mis Citas de Bienestar"
      breadcrumbs={["Dashboard", "Mis Citas"]}
      actions={dashboardActions}
      userRole="APRENDIZ"
      loading={isLoading}
      empty={appointments.length === 0}
    >
      <div className="stats-row">
        {appointments.length > 0 && (
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon-wrap" style={{ background: "#fef3c7" }}>
                <Clock size={18} style={{ color: "#f59e0b" }} />
              </div>
              <span className="stat-count">{counts.pending}</span>
              <span className="stat-label">Esperando respuesta</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrap" style={{ background: "#dbeafe" }}>
                <CheckCircle size={18} style={{ color: "#3b82f6" }} />
              </div>
              <span className="stat-count">{counts.confirmed}</span>
              <span className="stat-label">Listas para ti</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrap" style={{ background: "#dcfce7" }}>
                <CheckCircle size={18} style={{ color: "#22c55e" }} />
              </div>
              <span className="stat-count">{counts.completed}</span>
              <span className="stat-label">Ya atendidas</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrap" style={{ background: "#fee2e2" }}>
                <XCircle size={18} style={{ color: "#ef4444" }} />
              </div>
              <span className="stat-count">{counts.cancelled + counts.no_show}</span>
              <span className="stat-label">No se concretaron</span>
            </div>
          </div>
        )}
      </div>

      {!canCreate && (
        <div className="alert alert-warning">
          Tienes {counts.pending} citas pendientes. Espera a que se atienda una
          antes de agendar otra.
        </div>
      )}

      {showCelebration && (
        <div className="celebration-toast" role="alert">
          <CheckCircle size={20} />
          <div>
            <strong>¡Cita solicitada!</strong>
            <p>Tu solicitud fue enviada. Recibirás una confirmación pronto.</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Solicitar Nueva Cita"
      >
        <AppointmentForm
          onSuccess={() => {
            setShowForm(false);
            fetchAppointments();
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }}
        />
      </Modal>

      <nav className="filter-tabs" role="tablist" onKeyDown={handleTabKeyDown}>
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = counts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={15} />
              {tab.label}
              {count > 0 && (
                <span className={`tab-badge ${tab.id === "pending" ? "" : tab.id === "confirmed" ? "blue" : "gray"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <section
        className="appointments-list"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {isLoading ? (
          <div className="loading-state" role="status" aria-live="polite">
            <Calendar className="spin" size={32} />
            <p>Cargando tus citas...</p>
          </div>
        ) : paginatedAppointments.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-icon" />
            <h3>
              {activeTab === "all"
                ? "No tienes citas agendadas"
                : `No hay citas ${STATUS_TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}`}
            </h3>
            <p>
              {activeTab === "all"
                ? "Agenda tu primera cita con un profesional de bienestar"
                : "Selecciona otra pestaña para ver citas"}
            </p>
            {activeTab === "all" && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                <Plus size={18} />
                Agendar Cita
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-grid">
            {paginatedAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                isAprendiz={true}
                onCancel={() => cancelAppointment(apt.id)}
              />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination" role="navigation" aria-label="Paginación">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <span className="page-info">
              {page} de {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      {activeTab === "all" && canCreate && (
        <button
          onClick={() => setShowForm(true)}
          className="fab-btn"
          title="Nueva cita"
          aria-label="Nueva cita"
        >
          <Plus size={24} />
        </button>
      )}
    </DashboardLayout>
  );
}