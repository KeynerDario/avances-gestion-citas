import { supabase } from "../../../lib/supabase";

export class DashboardRepository {
    static async getKPIs(dateRange) {
        const { data, error } = await supabase
            .from("appointments")
            .select("id, status, scheduled_date, created_at")
            .gte("scheduled_date", dateRange.from)
            .lte("scheduled_date", dateRange.to);

        if (error) throw new Error(`Error KPIs: ${error.message}`);

        const total = data.length;
        const completed = data.filter((a) => a.status === "completed").length;
        const pending = data.filter((a) => a.status === "pending").length;
        const cancelled = data.filter((a) => a.status === "cancelled").length;
        const no_show = data.filter((a) => a.status === "no_show").length;

        const waitDays = data
            .filter((a) => ["confirmed", "completed"].includes(a.status))
            .map((a) => {
                const created = new Date(a.created_at);
                const scheduled = new Date(a.scheduled_date);
                return Math.max(0, Math.round((scheduled - created) / (1000 * 60 * 60 * 24)));
            });

        const avgWait = waitDays.length > 0
            ? Math.round(waitDays.reduce((s, d) => s + d, 0) / waitDays.length)
            : 0;

        return [{
            total_appointments: total,
            completed_appointments: completed,
            pending_appointments: pending,
            cancelled_appointments: cancelled,
            no_show_count: no_show,
            avg_wait_days: avgWait,
        }];
    }

    static async getAppointmentsByDependency(dateRange) {
        const { data, error } = await supabase
            .from("appointments")
            .select("dependency_id, dependencies(name, color), status")
            .gte("scheduled_date", dateRange.from)
            .lte("scheduled_date", dateRange.to);

        if (error) throw error;

        const grouped = {};
        data.forEach((apt) => {
            const name = apt.dependencies?.name || "Sin dependencia";
            const color = apt.dependencies?.color || "#6b7280";
            if (!grouped[name]) {
                grouped[name] = { name, color, total: 0, completed: 0, cancelled: 0 };
            }
            grouped[name].total++;
            if (apt.status === "completed") grouped[name].completed++;
            if (apt.status === "cancelled") grouped[name].cancelled++;
        });

        return Object.values(grouped);
    }

    static async getMonthlyTrend(year) {
        const { data, error } = await supabase
            .from("appointments")
            .select("scheduled_date, status")
            .gte("scheduled_date", `${year}-01-01`)
            .lte("scheduled_date", `${year}-12-31`);

        if (error) throw error;

        const months = {};
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        data.forEach((apt) => {
            const d = new Date(apt.scheduled_date);
            const key = d.getMonth();
            if (!months[key]) {
                months[key] = { month: monthNames[key], total: 0, completed: 0 };
            }
            months[key].total++;
            if (apt.status === "completed") months[key].completed++;
        });

        return Object.keys(months)
            .sort((a, b) => a - b)
            .map((k) => months[k]);
    }

    static async getProfessionalPerformance(dateRange) {
        const { data, error } = await supabase
            .from("appointments")
            .select("professional_id, status")
            .gte("scheduled_date", dateRange.from)
            .lte("scheduled_date", dateRange.to)
            .not("professional_id", "is", null);

        if (error) throw error;

        const profIds = [...new Set(data.map((a) => a.professional_id))];

        const { data: profiles } = profIds.length
            ? await supabase.from("profiles").select("id, full_name").in("id", profIds)
            : { data: [] };

        const profMap = {};
        (profiles || []).forEach((p) => { profMap[p.id] = p.full_name; });

        const grouped = {};
        data.forEach((apt) => {
            const id = apt.professional_id;
            if (!grouped[id]) {
                grouped[id] = { id, name: profMap[id] || "Sin nombre", total: 0, completed: 0 };
            }
            grouped[id].total++;
            if (apt.status === "completed") grouped[id].completed++;
        });

        return Object.values(grouped)
            .map((p) => ({ ...p, efficiency: p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0 }))
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 10);
    }

    static async getSummary() {
        const { data: roleData } = await supabase
            .from("roles").select("id").eq("name", "PROFESIONAL").single();

        const [usersRes, depsRes] = await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("dependencies").select("id", { count: "exact", head: true }),
        ]);

        let totalProf = 0;
        if (roleData?.id) {
            const { count } = await supabase
                .from("profiles").select("id", { count: "exact", head: true })
                .eq("role_id", roleData.id);
            totalProf = count || 0;
        }

        return {
            totalUsers: usersRes.count || 0,
            totalDeps: depsRes.count || 0,
            totalProf,
        };
    }

    static async getRawDataForExport(dateRange) {
        const { data, error } = await supabase
            .from("appointments")
            .select("*")
            .gte("scheduled_date", dateRange.from)
            .lte("scheduled_date", dateRange.to)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const profIds = [...new Set(data.map((a) => a.professional_id).filter(Boolean))];
        const depIds = [...new Set(data.map((a) => a.dependency_id).filter(Boolean))];

        const [profilesRes, depsRes] = await Promise.all([
            profIds.length
                ? supabase.from("profiles").select("id, full_name").in("id", profIds)
                : Promise.resolve({ data: [] }),
            depIds.length
                ? supabase.from("dependencies").select("id, name").in("id", depIds)
                : Promise.resolve({ data: [] }),
        ]);

        const profMap = {};
        (profilesRes.data || []).forEach((p) => { profMap[p.id] = p.full_name; });
        const depMap = {};
        (depsRes.data || []).forEach((d) => { depMap[d.id] = d.name; });

        return data.map((a) => ({
            ...a,
            dependencies: depMap[a.dependency_id] ? { name: depMap[a.dependency_id] } : null,
            aprendiz: { full_name: "N/A", document_number: "" },
            professional: profMap[a.professional_id] ? { full_name: profMap[a.professional_id] } : null,
        }));
    }
}
