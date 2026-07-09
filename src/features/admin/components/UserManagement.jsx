import { useEffect, useRef, useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import {
  Search,
  CheckCircle,
  XCircle,
  Shield,
  Building2,
  ChevronDown,
  Loader2,
  Users,
} from "lucide-react";
import { SkeletonTable } from "../../../shared/components/EmptyState";

export const UserManagement = () => {
  const {
    users,
    roles,
    dependencies,
    userCounts,
    pagination,
    loading,
    fetchUsers,
    fetchRoles,
    fetchDependencies,
    fetchUserCounts,
    updateUserRole,
    updateUserDependency,
    toggleUserStatus,
  } = useAdmin();

  const [filters, setFilters] = useState({ search: "", roleId: "", page: 1 });
  const [editingUser, setEditingUser] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);

  const handleSearchChange = (value) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 300);
  };

  useEffect(() => {
    fetchRoles();
    fetchDependencies();
    fetchUserCounts();
  }, [fetchRoles, fetchDependencies, fetchUserCounts]);

  useEffect(() => {
    const params = {
      ...filters,
      roleId: filters.roleId ? Number(filters.roleId) : undefined,
    };
    fetchUsers(params);
  }, [filters, fetchUsers]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? "desactivar" : "activar";
    if (!window.confirm(`¿Estás seguro de ${action} este usuario?`)) return;
    setUpdatingId(userId);
    const success = await toggleUserStatus(userId, !currentStatus);
    if (success) {
      await fetchUsers(filters);
      await fetchUserCounts();
    }
    setUpdatingId(null);
  };

  const handleRoleChange = async (userId, newRoleId) => {
    setUpdatingId(userId);
    const roleId = newRoleId ? Number(newRoleId) : null;
    const success = await updateUserRole(userId, roleId);
    if (success) {
      await fetchUsers(filters);
      await fetchUserCounts();
    }
    setUpdatingId(null);
  };

  const handleDependencyChange = async (userId, newDepId) => {
    setUpdatingId(userId);
    const success = await updateUserDependency(userId, newDepId ? Number(newDepId) : null);
    if (success) await fetchUsers(filters);
    setUpdatingId(null);
  };

  const isProfessionalRole = (user) => {
    const rol = roles.find(r => r.id === user.role_id);
    return rol?.name === "PROFESIONAL";
  };

  const usersByRole = roles.map((role) => ({
    ...role,
    count: userCounts[role.name] || 0,
  }));

  return (
    <div className="admin-section">
      <header className="section-header">
        <h2>
          <Users size={22} />
          Gestión de Usuarios
        </h2>
        <span className="total-badge">{pagination.total} usuarios</span>
      </header>

      <div className="role-summary">
        {usersByRole.map((role) => (
          <button
            key={role.id}
            className={`role-chip ${filters.roleId === String(role.id) ? "active" : ""}`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                roleId: f.roleId === String(role.id) ? "" : String(role.id),
              }))
            }
          >
            <Shield size={14} />
            {role.name}
            <span className="chip-count">{role.count}</span>
          </button>
        ))}
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o email..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Buscar usuarios por nombre"
          />
        </div>
      </div>

      <div className="users-list">
        {loading && users.length === 0 ? (
          <div className="loading-center">
            <SkeletonTable rows={5} />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className={`user-card ${!u.is_active ? "inactive" : ""} ${editingUser === u.id ? "editing" : ""}`}
            >
              <div className="user-card-header">
                <div className="user-avatar" style={{ background: `var(--dep-color, ${u.roles?.name === "SUPERADMIN" ? "#f59e0b" : u.dependencies?.color || "#6b7280"})` }}>
                  {u.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {u.full_name}
                    {!u.is_active && <span className="inactive-tag">Inactivo</span>}
                  </div>
                  <div className="user-meta">
                    {u.email || "Sin email"}
                    {u.document_number && ` · ${u.document_number}`}
                  </div>
                </div>
                <div className="user-actions-inline">
                  <button
                    className={`status-btn ${u.is_active ? "active" : "inactive"}`}
                    onClick={() => handleToggleStatus(u.id, u.is_active)}
                    disabled={updatingId === u.id}
                    title={u.is_active ? "Desactivar" : "Activar"}
                    aria-label={u.is_active ? "Desactivar usuario" : "Activar usuario"}
                  >
                    {updatingId === u.id ? (
                      <Loader2 className="spin" size={14} />
                    ) : u.is_active ? (
                      <CheckCircle size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                    aria-label="Expandir detalles"
                  >
                    <ChevronDown
                      size={16}
                      className={editingUser === u.id ? "rotated" : ""}
                    />
                  </button>
                </div>
              </div>

              <div className="user-card-badges">
                <span
                  className={`role-badge-inline ${getRoleBgClass(u.roles?.name)}`}
                >
                  <Shield size={12} />
                  {ROLE_LABELS[u.roles?.name] || u.roles?.name || "Sin rol"}
                </span>
                {u.roles?.name === "PROFESIONAL" && u.dependencies?.name && (
                  <span className="dep-badge-inline">
                    <Building2 size={12} />
                    {u.dependencies.name}
                  </span>
                )}
              </div>

              {editingUser === u.id && (
                <div className="user-edit-panel">
                  <div className="edit-field">
                    <label>
                      <Shield size={14} />
                      Rol
                    </label>
                    <select
                      value={u.role_id || ""}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updatingId === u.id}
                    >
                      <option value="">Sin rol</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {ROLE_LABELS[r.name] || r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="edit-field">
                    <label>
                      <Building2 size={14} />
                      Dependencia
                    </label>
                    <select
                      value={u.dependency_id || ""}
                      onChange={(e) => handleDependencyChange(u.id, e.target.value)}
                      disabled={updatingId === u.id || !isProfessionalRole(u)}
                    >
                      <option value="">Sin dependencia</option>
                      {dependencies.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="edit-meta">
                    Última actualización:{" "}
                    {u.updated_at
                      ? new Date(u.updated_at).toLocaleDateString("es-CO")
                      : "N/A"}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {users.length} usuarios encontrados
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={pagination.page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            aria-label="Página anterior"
          >
            ← Anterior
          </button>
          <span className="page-info">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            className="page-btn"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            aria-label="Página siguiente"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

function getRoleBgClass(roleName) {
  const classes = {
    SUPERADMIN: "role-bg-superadmin",
    COORDINACION: "role-bg-coordinacion",
    PROFESIONAL: "role-bg-profesional",
    APRENDIZ: "role-bg-aprendiz",
  };
  return classes[roleName] || "role-bg-aprendiz";
}

const ROLE_LABELS = {
  SUPERADMIN: "Super Admin",
  COORDINACION: "Coordinación",
  PROFESIONAL: "Profesional",
  APRENDIZ: "Aprendiz",
};