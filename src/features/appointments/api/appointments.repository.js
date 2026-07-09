import { supabase, enqueue } from "../../../lib/supabase";
import { logAuditAction } from "../../../shared/api/audit";

export class AppointmentRepository {
  static async create(appointmentData, userId) {
    const { data, error } = await supabase
      .from("appointments")
      .insert([appointmentData])
      .select()
      .single();

    if (error) throw new Error(`Error creando cita: ${error.message}`);

    const enriched = await this.enrichAppointment(data);

    logAuditAction({
      userId,
      action: "CREATE_APPOINTMENT",
      entityType: "appointment",
      entityId: data.id,
      newData: {
        dependency_id: appointmentData.dependency_id,
        professional_id: appointmentData.professional_id,
        scheduled_date: appointmentData.scheduled_date,
        scheduled_time: appointmentData.scheduled_time,
        reason: appointmentData.reason,
      },
    });

    return enriched;
  }

  static async fetch({ userId, dependencyId, status, dateFrom, dateTo }) {
    let query = supabase.from("appointments").select("*");
    if (userId) query = query.eq("user_id", userId);
    if (dependencyId) query = query.eq("dependency_id", dependencyId);
    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("scheduled_date", dateFrom);
    if (dateTo) query = query.lte("scheduled_date", dateTo);

    const { data, error } = await query
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) throw new Error(`Error fetching citas: ${error.message}`);
    return this.enrichAppointmentsBatch(data || []);
  }

  static async update(id, updates, userId) {
    const { data: oldRows } = await supabase
      .from("appointments")
      .select("status, dependency_id, professional_id, scheduled_date, scheduled_time")
      .eq("id", id);
    const oldData = oldRows?.[0];

    const { data, error } = await supabase
      .from("appointments")
      .update({ ...updates, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando cita: ${error.message}`);

    const enriched = await this.enrichAppointment(data);

    let action = "UPDATE_APPOINTMENT";
    if (updates.status === "confirmed") action = "CONFIRM_APPOINTMENT";
    else if (updates.status === "completed") action = "COMPLETE_APPOINTMENT";
    else if (updates.status === "cancelled") action = "CANCEL_APPOINTMENT";
    else if (updates.status === "no_show") action = "NO_SHOW_APPOINTMENT";

    logAuditAction({ userId, action, entityType: "appointment", entityId: id, oldData, newData: updates });

    return enriched;
  }

  static async checkAvailability(dependencyId, date, time, excludeId = null) {
    let query = supabase
      .from("appointments")
      .select("id")
      .eq("dependency_id", dependencyId)
      .eq("scheduled_date", date)
      .eq("scheduled_time", time)
      .in("status", ["pending", "confirmed"]);

    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query;
    if (error) throw error;
    return data.length === 0;
  }

  static async findProfessionalForDependency(dependencyId) {
    const { data: professionals, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role_id", 2)
      .eq("dependency_id", dependencyId)
      .eq("is_active", true);

    if (profError || !professionals?.length) return null;

    const profIds = professionals.map((p) => p.id);
    const today = new Date().toISOString().split("T")[0];

    const { data: appointmentCounts } = await supabase
      .from("appointments")
      .select("professional_id")
      .in("professional_id", profIds)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_date", today);

    const counts = {};
    (appointmentCounts || []).forEach((a) => {
      counts[a.professional_id] = (counts[a.professional_id] || 0) + 1;
    });

    professionals.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
    return professionals[0].id;
  }

  static async countPending(userId) {
    const { count, error } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending");
    if (error) throw error;
    return count;
  }

  /**
   * Batch enrich — enqueue the 3 parallel lookups to avoid connection burst.
   */
  static async enrichAppointmentsBatch(appointments) {
    if (!appointments.length) return [];

    const depIds = [...new Set(appointments.map((a) => a.dependency_id).filter(Boolean))];
    const userIds = [...new Set(appointments.map((a) => a.user_id).filter(Boolean))];
    const profIds = [...new Set(appointments.map((a) => a.professional_id).filter(Boolean))];

    const [depsResult, profilesResult, profsResult] = await Promise.all([
      enqueue(() =>
        depIds.length
          ? supabase.from("dependencies").select("id, name, color").in("id", depIds)
          : Promise.resolve({ data: [] })
      ),
      enqueue(() =>
        userIds.length
          ? supabase.from("profiles").select("id, full_name, document_number").in("id", userIds)
          : Promise.resolve({ data: [] })
      ),
      enqueue(() =>
        profIds.length
          ? supabase.from("profiles").select("id, full_name").in("id", profIds)
          : Promise.resolve({ data: [] })
      ),
    ]);

    const depsMap = new Map((depsResult.data || []).map((d) => [d.id, d]));
    const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));
    const profsMap = new Map((profsResult.data || []).map((p) => [p.id, p]));

    return appointments.map((apt) => ({
      ...apt,
      dependencies: apt.dependency_id ? depsMap.get(apt.dependency_id) || null : null,
      profiles: apt.user_id ? profilesMap.get(apt.user_id) || null : null,
      professional: apt.professional_id ? profsMap.get(apt.professional_id) || null : null,
    }));
  }

  static async enrichAppointment(appointment) {
    const result = await this.enrichAppointmentsBatch([appointment]);
    return result[0];
  }
}
