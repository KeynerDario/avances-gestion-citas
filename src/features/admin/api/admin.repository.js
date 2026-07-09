import { supabase } from "../../../lib/supabase";
import { logAuditAction } from "../../../shared/api/audit";

export class AdminRepository {
  constructor() {
    this.supabase = supabase;
  }

  async getRoles() {
    const { data, error } = await this.supabase.from("roles").select("*").order("id");
    if (error) throw error;
    return data;
  }

  async getDependencies() {
    const { data, error } = await this.supabase.from("dependencies").select("*").order("id");
    if (error) throw error;
    return data;
  }

  async getUsers({ roleId, status, search, page = 1, limit = 20 }) {
    let query = this.supabase
      .from("profiles")
      .select(`*, roles (name, description), dependencies (name, color)`, { count: "exact" });
    if (roleId) query = query.eq("role_id", roleId);
    if (status !== undefined) query = query.eq("is_active", status);
    if (search) {
      query = query.or(`full_name.ilike.%${search}%, document_number.ilike.%${search}%, email.ilike.%${search}%`);
    }
    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new Error(`Error fetching users: ${error.message}`);
    return { users: data, total: count, page, totalPages: Math.ceil(count / limit) };
  }

  async getUserCountsByRole() {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("is_active", true);
    if (error) throw error;

    const counts = {};
    (data || []).forEach((p) => {
      const roleName = p.roles?.name || "UNKNOWN";
      counts[roleName] = (counts[roleName] || 0) + 1;
    });

    const { count: total } = await this.supabase
      .from("profiles").select("id", { count: "exact", head: true });

    const { count: inactive } = await this.supabase
      .from("profiles").select("id", { count: "exact", head: true }).eq("is_active", false);

    return { ...counts, total: total || 0, inactive: inactive || 0 };
  }

  async updateUserRole(userId, roleId, adminId) {
    const { data: oldRows } = await this.supabase
      .from("profiles").select("role_id, roles(name)").eq("id", userId);
    const oldData = oldRows?.[0];

    const { data: updateRows, error } = await this.supabase
      .from("profiles")
      .update({ role_id: roleId, updated_at: new Date() })
      .eq("id", userId)
      .select("id, role_id, full_name, email, roles(name), dependencies(name, color)");
    const newData = updateRows?.[0];
    if (error) throw error;

    await this.logAction({
      userId: adminId, action: "UPDATE_USER", entityType: "user", entityId: userId,
      oldData: { role_id: oldData?.role_id, role_name: oldData?.roles?.name },
      newData: { role_id: newData?.role_id, role_name: newData?.roles?.name },
    });
    return newData;
  }

  async updateUserDependency(userId, dependencyId, adminId) {
    const { data: oldRows } = await this.supabase
      .from("profiles").select("dependency_id, dependencies(name)").eq("id", userId);
    const oldData = oldRows?.[0];

    const { data: updateRows, error } = await this.supabase
      .from("profiles")
      .update({ dependency_id: dependencyId, updated_at: new Date() })
      .eq("id", userId)
      .select("id, role_id, full_name, email, roles(name), dependencies(name, color)");
    const newData = updateRows?.[0];
    if (error) throw error;

    await this.logAction({
      userId: adminId, action: "UPDATE_USER", entityType: "user", entityId: userId,
      oldData: { dependency_id: oldData?.dependency_id, dep_name: oldData?.dependencies?.name },
      newData: { dependency_id: newData?.dependency_id, dep_name: newData?.dependencies?.name },
    });
    return newData;
  }

  async toggleUserStatus(userId, isActive, adminId) {
    const { data: oldRows } = await this.supabase
      .from("profiles").select("is_active").eq("id", userId);
    const oldData = oldRows?.[0];

    const { data: updateRows, error } = await this.supabase
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date() })
      .eq("id", userId)
      .select("id, role_id, full_name, email, is_active, roles(name), dependencies(name, color)");
    const newData = updateRows?.[0];
    if (error) throw error;

    await this.logAction({
      userId: adminId, action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      entityType: "user", entityId: userId,
      oldData: { is_active: oldData?.is_active },
      newData: { is_active: newData?.is_active },
    });
    return newData;
  }

  async createUser({ email, password, fullName, roleId, dependencyId }, adminId) {
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (authError) throw authError;

    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .update({ role_id: roleId, dependency_id: dependencyId })
      .eq("id", authData.user.id)
      .select()
      .single();
    if (profileError) throw profileError;

    await this.logAction({
      userId: adminId, action: "CREATE_USER", entityType: "user",
      entityId: authData.user.id, newData: profile,
    });
    return profile;
  }

  async getAuditLogs({ action, userId, search, dateFrom, dateTo, page = 1, limit = 50 }) {
    let query = this.supabase.from("audit_logs").select("*", { count: "exact" });
    if (action) query = query.ilike("action", `${action}%`);
    if (userId) query = query.eq("user_id", userId);
    if (search) query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw error;

    const userIds = [...new Set((data || []).map((l) => l.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await this.supabase
        .from("profiles").select("id, full_name, email").in("id", userIds);
      (profiles || []).forEach((p) => { profileMap[p.id] = p; });
    }

    return {
      logs: (data || []).map((log) => ({ ...log, admin: profileMap[log.user_id] || null })),
      total: count,
    };
  }

  async getConfig() {
    const { data, error } = await this.supabase.from("system_config").select("*");
    if (error) throw error;
    return data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
  }

  async updateConfig(updates) {
    const entries = Object.entries(updates);
    if (entries.length === 0) return;
    const results = await Promise.all(
      entries.map(([key, value]) =>
        this.supabase.from("system_config").upsert({ key, value }, { onConflict: "key" })
      )
    );
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) throw new Error(`Error guardando ${errors.length} configuraciones`);
  }

  async createDependency(name, color) {
    const { data, error } = await this.supabase
      .from("dependencies").insert([{ name, color }]).select().single();
    if (error) throw error;
    return data;
  }

  async updateDependency(id, name, color) {
    const { data, error } = await this.supabase
      .from("dependencies").update({ name, color }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteDependency(id) {
    const { error } = await this.supabase.from("dependencies").delete().eq("id", id);
    if (error) throw error;
  }

  async logAction({ userId, action, entityType, entityId, oldData, newData }) {
    logAuditAction({ userId, action, entityType, entityId, oldData, newData });
  }
}
