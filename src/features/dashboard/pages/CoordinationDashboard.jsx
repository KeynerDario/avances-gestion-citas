import { useEffect, useState } from "react";
import { useDashboard } from "../api/hooks/useDashboard";
import { KPICard } from "../components/KPICard";
import { DependencyChart } from "../components/DependencyChart";
import { MonthlyTrendChart } from "../components/MonthlyTrendChart";
import { ProfessionalTable } from "../components/ProfessionalTable";
import {
  Download,
  RefreshCw,
  Calendar,
  Loader2,
  BarChart3,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

export default function CoordinationDashboard() {
  const {
    kpis,
    byDependency,
    monthlyTrend,
    professionals,
    summary,
    loading,
    fetchAllMetrics,
    fetchSummary,
    exportToCSV,
  } = useDashboard();
  const [dataRange, setDataRange] = useState({
    from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchAllMetrics(dataRange);
    fetchSummary();
  }, [dataRange, fetchAllMetrics, fetchSummary]);

  const handleRefresh = () => {
    fetchAllMetrics(dataRange);
  };

  const handleDateChange = (field, value) => {
    setDataRange((prev) => ({ ...prev, [field]: value }));
  };

  const completionRate =
    kpis && kpis.total_appointments > 0
      ? Math.round((kpis.completed_appointments / kpis.total_appointments) * 100)
      : 0;

  const noShowRate =
    kpis && kpis.total_appointments > 0
      ? Math.round((kpis.no_show_count / kpis.total_appointments) * 100)
      : 0;

  return (
    <DashboardLayout
      title="Panel de Coordinación"
      breadcrumbs={["Dashboard", "Coordinación"]}
      actions={[
        { label: "Actualizar", onClick: handleRefresh, icon: <RefreshCw size={16} /> },
        { label: "Exportar CSV", onClick: () => exportToCSV(dataRange), icon: <Download size={16} /> },
      ]}
      userRole="COORDINACION"
      loading={loading && !kpis}
    >
      <div className="coordination-dashboard">
        <div className="coord-header">
          <div>
            <p>Las métricas que importan para el bienestar de tus aprendices</p>
          </div>
          <div className="header-actions">
          </div>
        </div>

        <div className="advanced-filters">
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
          >
            <SlidersHorizontal size={16} />
            Filtros avanzados
            <ChevronDown size={14} className={`chevron ${showAdvanced ? "open" : ""}`} />
          </button>
          {showAdvanced && (
            <div className="advanced-content">
              <div className="date-filter-bar">
                <Calendar size={18} />
                <label>Desde:</label>
                <input
                  type="date"
                  value={dataRange.from}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
                <label>Hasta:</label>
                <input
                  type="date"
                  value={dataRange.to}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
                <button onClick={() => fetchAllMetrics(dataRange)} className="btn-primary btn-sm">
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>

        {loading && !kpis ? (
          <div className="loading-screen">
            <Loader2 className="spin" size={40} />
            <p>Cargando métricas...</p>
          </div>
        ) : (
          <>
            <section className="kpi-grid">
              <KPICard
                title="Total Citas"
                value={kpis?.total_appointments || 0}
                color="#f59e0b"
                subtitle="En periodo seleccionado"
              />
              <KPICard
                title="Pendientes"
                value={kpis?.pending_appointments || 0}
                color="#f59e0b"
                subtitle="Esperando atención"
              />
              <KPICard
                title="Tasa de Cumplimiento"
                value={`${completionRate}%`}
                color="#22c55e"
                subtitle={`${kpis?.completed_appointments || 0} completadas`}
              />
              <KPICard
                title="Profesionales Activos"
                value={summary.totalProf}
                color="#8b5cf6"
                subtitle="En bienestar"
              />
              <KPICard
                title="No Asistencias"
                value={kpis?.no_show_count || 0}
                color="#ef4444"
                subtitle={`${noShowRate}% del total`}
              />
              <KPICard
                title="Tiempo Prom. Espera"
                value={`${kpis?.avg_wait_days || 0} días`}
                color="#06b6d4"
                subtitle="Solicitud → Atención"
              />
            </section>

            <section className="charts-grid">
              {byDependency.length > 0 ? (
                <DependencyChart data={byDependency} />
              ) : (
                <div className="chart-placeholder">
                  <BarChart3 size={32} />
                  <p>Aún no hay citas en este periodo</p>
                  <span>Cuando se agenden citas, los gráficos aparecerán automáticamente</span>
                </div>
              )}
              {monthlyTrend.length > 0 ? (
                <MonthlyTrendChart data={monthlyTrend} />
              ) : (
                <div className="chart-placeholder">
                  <BarChart3 size={32} />
                  <p>Los trends mensuales aparecerán cuando haya historial</p>
                  <span>¡Es solo cuestión de tiempo!</span>
                </div>
              )}
            </section>

            <section className="professionals-section">
              {professionals.length > 0 ? (
                <ProfessionalTable data={professionals} />
              ) : (
                <div className="chart-placeholder">
                  <AlertTriangle size={32} />
                  <p>Los profesionales aparecerán cuando atiendan citas</p>
                  <span>Apenas comiencen a atender, los verás aquí</span>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}