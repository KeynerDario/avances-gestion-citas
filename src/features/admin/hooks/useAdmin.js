import { useState, useCallback } from "react";
import { AdminRepository } from "../api/admin.repository";
import { toast } from "sonner";

const repo = new AdminRepository();
export function useAdmin() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [config, setConfig] = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 });
  
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const loading = loadingUsers || loadingRoles || loadingDeps || loadingAudit || loadingConfig;

  const fetchUsers = useCallback(async (params = {}) => {
    setLoadingUsers(true);
    setError(null);
    try {
      const result = await repo.getUsers(params);
      setUsers(result.users || []);
      setPagination({ page: result.page || 1, total: result.total || 0, totalPages: result.totalPages || 1, pageSize: params.limit || 20 });
    } catch (err) {
      console.error("Error fetching users:", err);
      const msg = err.message || "Error al cargar usuarios";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await repo.getRoles();
      setRoles(data || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      toast.error("Error al cargar roles");
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    setLoadingDeps(true);
    try {
      const data = await repo.getDependencies();
      setDependencies(data || []);
    } catch (err) {
      console.error("Error fetching dependencies:", err);
      toast.error("Error al cargar dependencias");
    } finally {
      setLoadingDeps(false);
    }
  }, []);

  const fetchUserCounts = useCallback(async () => {
    try {
      const data = await repo.getUserCountsByRole();
      setUserCounts(data || {});
      return data || {};
    } catch (err) {
      console.error("Error fetching user counts:", err);
      return {};
    }
  }, []);

  const fetchAuditLogs = useCallback(async (params = {}) => {
    setLoadingAudit(true);
    try {
      const data = await repo.getAuditLogs(params);
      setAuditLogs(data?.logs || []);
      setPagination((prev) => ({ ...prev, total: data?.total || 0 }));
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      toast.error("Error al cargar registros de auditoría");
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await repo.getConfig();
      setConfig(data || {});
    } catch (err) {
      console.error("Error fetching config:", err);
      toast.error("Error al cargar configuración");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId, newRoleId) => {
    try {
      await repo.updateUserRole(userId, newRoleId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role_id: newRoleId, roles: roles.find((r) => r.id === newRoleId) } : u
        )
      );
      toast.success("Rol actualizado correctamente");
      return true;
    } catch (err) {
      console.error("Error updating user role:", err);
      const msg = err.message || "Error al actualizar rol";
      setError(msg);
      toast.error(msg);
      return false;
    }
  }, [roles, toast]);

  const updateUserDependency = useCallback(async (userId, newDepId) => {
    try {
      await repo.updateUserDependency(userId, newDepId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, dependency_id: newDepId, dependencies: dependencies.find((d) => d.id === newDepId) } : u
        )
      );
      toast.success("Dependencia actualizada correctamente");
      return true;
    } catch (err) {
      console.error("Error updating user dependency:", err);
      const msg = err.message || "Error al actualizar dependencia";
      setError(msg);
      toast.error(msg);
      return false;
    }
  }, [dependencies, toast]);

  const toggleUserStatus = useCallback(async (userId, newStatus) => {
    try {
      await repo.toggleUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u))
      );
      toast.success(newStatus ? "Usuario activado" : "Usuario desactivado");
      return true;
    } catch (err) {
      console.error("Error toggling user status:", err);
      const msg = err.message || "Error al cambiar estado";
      setError(msg);
      toast.error(msg);
      return false;
    }
  }, []);

  const updateConfig = useCallback(async (updates) => {
    try {
      await repo.updateConfig(updates);
      setConfig((prev) => ({ ...prev, ...updates }));
      toast.success("Configuración guardada");
      return true;
    } catch (err) {
      console.error("Error updating config:", err);
      const msg = err.message || "Error al guardar configuración";
      setError(msg);
      toast.error(msg);
      return false;
    }
  }, []);

  const createDependency = useCallback(async (name, color) => {
    try {
      const newDep = await repo.createDependency(name, color);
      setDependencies((prev) => [...prev, newDep]);
      toast.success("Dependencia creada");
      return newDep;
    } catch (err) {
      console.error("Error creating dependency:", err);
      const msg = err.message || "Error al crear dependencia";
      setError(msg);
      toast.error(msg);
      return null;
    }
  }, []);

  const updateDependency = useCallback(async (id, name, color) => {
    try {
      await repo.updateDependency(id, name, color);
      setDependencies((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name, color } : d))
      );
      toast.success("Dependencia actualizada");
      return true;
    } catch (err) {
      console.error("Error updating dependency:", err);
      const msg = err.message || "Error al actualizar dependencia";
      setError(msg);
      toast.error(msg);
      return false;
    }
  }, []);

  const deleteDependency = useCallback(async (id) => {
    try {
      await repo.deleteDependency(id);
      setDependencies((prev) => prev.filter((d) => d.id !== id));
      toast.success("Dependencia eliminada");
      return true;
    } catch (err) {
      console.error("Error deleting dependency:", err);
      const msg = err.message || "Error al eliminar dependencia";
      setError(msg);
      toast.error(msg);
      return false;
    }
  }, []);

  return {
    users,
    roles,
    dependencies,
    userCounts,
    auditLogs,
    config,
    pagination,
    loading,
    error,
    clearError,
    fetchUsers,
    fetchRoles,
    fetchDependencies,
    fetchUserCounts,
    fetchAuditLogs,
    fetchConfig,
    updateUserRole,
    updateUserDependency,
    toggleUserStatus,
    updateConfig,
    createDependency,
    updateDependency,
    deleteDependency,
    setRoles,
  };
}
