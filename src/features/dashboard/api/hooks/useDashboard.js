import { useState, useCallback } from "react";
import { DashboardRepository } from "../dashboard.repository";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";

export const useDashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [byDependency, setByDependency] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [summary, setSummary] = useState({ totalUsers: 0, totalDeps: 0, totalProf: 0 });
    const [loading, setLoading] = useState(false);

    const fetchAllMetrics = useCallback(async (customRange = null) => {
        setLoading(true);

        const range = customRange || {
            from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
            to: format(new Date(), "yyyy-MM-dd"),
        };

        try {
            const [kpiData, depData, monthlyData, profData] = await Promise.all([
                DashboardRepository.getKPIs(range),
                DashboardRepository.getAppointmentsByDependency(range),
                DashboardRepository.getMonthlyTrend(new Date().getFullYear()),
                DashboardRepository.getProfessionalPerformance(range),
            ]);

            setKpis(kpiData[0] || null);
            setByDependency(depData);
            setMonthlyTrend(monthlyData);
            setProfessionals(profData);
        } catch (error) {
            toast.error("Error cargando métricas");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const data = await DashboardRepository.getSummary();
            setSummary(data);
        } catch {
            // silent
        }
    }, []);

    const exportToCSV = async (range) => {
        try {
            const exportRange = range || {
                from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
            };
            const data = await DashboardRepository.getRawDataForExport(exportRange);

            if (!data || data.length === 0) {
                toast.info("No hay datos para exportar");
                return;
            }

            const flatData = data.map((row) => ({
                ID: row.id,
                Fecha_Cita: row.scheduled_date,
                Hora: row.scheduled_time,
                Dependencia: row.dependencies?.name || "",
                Profesional: row.professional?.full_name || "Sin asignar",
                Estado: row.status,
                Motivo: row.reason,
                Notas: row.notes || "",
                Fecha_Creacion: row.created_at,
            }));

            const headers = Object.keys(flatData[0]);
            const csv = [
                headers.join(","),
                ...flatData.map((row) =>
                    headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(",")
                ),
            ].join("\n");

            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `reporte_bienestar_${format(new Date(), "yyyy-MM-dd")}.csv`;
            link.click();

            toast.success("Reporte descargado");
        } catch (err) {
            toast.error("Error exportando datos");
            console.error(err);
        }
    };

    return {
        kpis,
        byDependency,
        monthlyTrend,
        professionals,
        summary,
        loading,
        fetchAllMetrics,
        fetchSummary,
        exportToCSV,
    };
};