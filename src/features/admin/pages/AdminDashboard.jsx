import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { UserManagement } from "../components/UserManagement";
import { AuditLogViewer } from "../components/AuditLogViewer";
import { SystemConfig } from "../components/SystemConfig";
import { RolesPermissions } from "../components/RolesPermissions";
import { DependenciesManager } from "../components/DependenciesManager";
import { Users, Activity, Settings, Shield, Building2, UserCheck, UserX, Clock, Loader2 } from "lucide-react";
import { useAdmin } from "../hooks/useAdmin";
import { useAuth } from "../../../providers/AuthContext";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";
  const { fetchUserCounts, error, clearError } = useAdmin();
  const { profile } = useAuth();
  const userRole = profile?.roles?.name || "SUPERADMIN";
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, recent: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const counts = await fetchUserCounts();
      setStats({
        total: counts.total || 0,
        active: (counts.total || 0) - (counts.inactive || 0),
        inactive: counts.inactive || 0,
        recent: 0,
      });
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, [fetchUserCounts]);

  useEffect(() => {
    // Only fetch user counts for the stat cards — roles/deps are fetched by child tabs
    loadStats();
  }, [loadStats]);

  const statCards = [
    { label: "Total Usuarios", value: stats.total, icon: Users, color: "#3b82f6" },
    { label: "Activos", value: stats.active, icon: UserCheck, color: "#10b981" },
    { label: "Inactivos", value: stats.inactive, icon: UserX, color: "#ef4444" },
    { label: "Nuevos (7d)", value: stats.recent, icon: Clock, color: "#f59e0b" },
  ];

  function renderTabContent() {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "deps":
        return <DependenciesManager />;
      case "roles":
        return <RolesPermissions />;
      case "audit":
        return <AuditLogViewer />;
      case "config":
        return <SystemConfig />;
      default:
        return <UserManagement />;
    }
  }

  return (
    <DashboardLayout
      title="Panel de Administración"
      breadcrumbs={["Dashboard", "Administración"]}
      actions={[]}
      userRole={userRole}
      loading={false}
    >
      <div className="admin-dashboard">
        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
            <button onClick={clearError} aria-label="Cerrar error">✕</button>
          </div>
        )}
        <div className="admin-header">
          <div className="admin-header-top">
            <p className="admin-subtitle">Administra usuarios, permisos y configuración del sistema</p>
          </div>

          <div className="admin-stats-row">
            {statsLoading ? (
              <div className="admin-stats-loading">
                <Loader2 className="spin" size={20} />
                <span>Cargando estadísticas...</span>
              </div>
            ) : statCards.map((card) => (
              <div key={card.label} className="admin-stat-card">
                <div className="admin-stat-icon" style={{ color: card.color, background: card.color + "15" }}>
                  <card.icon size={20} />
                </div>
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{card.value}</span>
                  <span className="admin-stat-label">{card.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <main
          className="admin-content"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {renderTabContent()}
        </main>
      </div>
    </DashboardLayout>
  );
}
