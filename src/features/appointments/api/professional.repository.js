import { supabase, enqueue } from "../../../lib/supabase";
import { logAuditAction } from "../../../shared/api/audit";

export class ProfessionalRepository {
  static async getSchedules(professionalId) {
    const { data, error } = await supabase
      .from("professional_schedules")
      .select("*")
      .eq("professional_id", professionalId)
      .order("day_of_week")
      .order("start_time");
    if (error) throw new Error(`Error cargando horarios: ${error.message}`);
    return data || [];
  }

  static async upsertSchedule(schedule, userId) {
    const { data, error } = await supabase
      .from("professional_schedules")
      .upsert(schedule, { onConflict: "professional_id,day_of_week,start_time" })
      .select()
      .single();
    if (error) throw new Error(`Error guardando horario: ${error.message}`);
    logAuditAction({
      userId,
      action: "CREATE_SCHEDULE",
      entityType: "schedule",
      entityId: data.id,
      newData: { day_of_week: schedule.day_of_week, start_time: schedule.start_time, end_time: schedule.end_time },
    });
    return data;
  }

  static async deleteSchedule(id, userId) {
    const { error } = await supabase.from("professional_schedules").delete().eq("id", id);
    if (error) throw new Error(`Error eliminando horario: ${error.message}`);
    logAuditAction({ userId, action: "DELETE_SCHEDULE", entityType: "schedule", entityId: id });
  }

  static async toggleSchedule(id, isActive, userId) {
    const { data, error } = await supabase
      .from("professional_schedules")
      .update({ is_active: isActive, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`Error actualizando horario: ${error.message}`);
    logAuditAction({ userId, action: "UPDATE_SCHEDULE", entityType: "schedule", entityId: id, newData: { is_active: isActive } });
    return data;
  }

  static async getNotesByAppointment(appointmentId) {
    const { data, error } = await supabase
      .from("clinical_notes")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Error cargando notas: ${error.message}`);
    return data || [];
  }

  static async getNotesByProfessional(professionalId, limit = 20) {
    const { data, error } = await supabase
      .from("clinical_notes")
      .select("*, appointments(scheduled_date, scheduled_time)")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Error cargando notas: ${error.message}`);
    return data || [];
  }

  static async createNote(note, userId) {
    const { data, error } = await supabase
      .from("clinical_notes")
      .insert([note])
      .select()
      .single();
    if (error) throw new Error(`Error creando nota: ${error.message}`);
    logAuditAction({
      userId,
      action: "CREATE_NOTE",
      entityType: "clinical_note",
      entityId: data.id,
      newData: { appointment_id: note.appointment_id, content: note.content?.substring(0, 100) },
    });
    return data;
  }

  static async updateNote(id, content, userId) {
    const { data, error } = await supabase
      .from("clinical_notes")
      .update({ content, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`Error actualizando nota: ${error.message}`);
    logAuditAction({ userId, action: "UPDATE_NOTE", entityType: "clinical_note", entityId: id, newData: { content: content?.substring(0, 100) } });
    return data;
  }

  static async deleteNote(id, userId) {
    const { error } = await supabase.from("clinical_notes").delete().eq("id", id);
    if (error) throw new Error(`Error eliminando nota: ${error.message}`);
    logAuditAction({ userId, action: "DELETE_NOTE", entityType: "clinical_note", entityId: id });
  }

  static async getDayAgenda(professionalId, date) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("professional_id", professionalId)
      .eq("scheduled_date", date)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_time");
    if (error) throw new Error(`Error cargando agenda: ${error.message}`);
    return this.enrichAppointmentsBatch(data || []);
  }

  static async getProfessionalStats(professionalId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    const [totalResult, monthResult, completedResult, noShowResult, todayResult] =
      await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("professional_id", professionalId),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("professional_id", professionalId).gte("scheduled_date", startOfMonth).lte("scheduled_date", endOfMonth),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("professional_id", professionalId).eq("status", "completed")
          .gte("scheduled_date", startOfMonth).lte("scheduled_date", endOfMonth),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("professional_id", professionalId).eq("status", "no_show")
          .gte("scheduled_date", startOfMonth).lte("scheduled_date", endOfMonth),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("professional_id", professionalId).eq("scheduled_date", today)
          .in("status", ["pending", "confirmed"]),
      ]);

    return {
      totalAppointments: totalResult.count || 0,
      monthAppointments: monthResult.count || 0,
      monthCompleted: completedResult.count || 0,
      monthNoShow: noShowResult.count || 0,
      todayAppointments: todayResult.count || 0,
      attendanceRate: monthResult.count > 0 ? Math.round((completedResult.count / monthResult.count) * 100) : 0,
    };
  }

  /**
   * Batch enrich — enqueue the 2 parallel lookups for day agenda.
   */
  static async enrichAppointmentsBatch(appointments) {
    if (!appointments.length) return [];

    const depIds = [...new Set(appointments.map((a) => a.dependency_id).filter(Boolean))];
    const userIds = [...new Set(appointments.map((a) => a.user_id).filter(Boolean))];

    const [depsResult, profilesResult] = await Promise.all([
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
    ]);

    const depsMap = new Map((depsResult.data || []).map((d) => [d.id, d]));
    const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));

    return appointments.map((apt) => ({
      ...apt,
      dependencies: apt.dependency_id ? depsMap.get(apt.dependency_id) || null : null,
      profiles: apt.user_id ? profilesMap.get(apt.user_id) || null : null,
    }));
  }

  static async enrichAppointment(appointment) {
    const result = await this.enrichAppointmentsBatch([appointment]);
    return result[0];
  }
}
