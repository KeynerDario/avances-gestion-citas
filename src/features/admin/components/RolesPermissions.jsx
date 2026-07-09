import React, { useState, useEffect, useCallback } from "react";
import { Shield, Check, Save, RotateCcw } from "lucide-react";
import { useAdmin } from "../hooks/useAdmin";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

const ROLE_COLORS = {
  SUPERADMIN: "#f59e0b",
  COORDINACION: "#3b82f6",
  PROFESIONAL: "#8b5cf6",
  APRENDIZ: "#6b7280",
};

const ROLE_LABELS = {
  SUPERADMIN: "Super Admin",
  COORDINACION: "Coordinación",
  PROFESIONAL: "Profesional",
  APRENDIZ: "Aprendiz",
};

const ALL_PERMISSIONS = [
  { key: "appointments:view_own", label: "Ver citas propias", cat: "Citas" },
  { key: "appointments:view_all", label: "Ver todas las citas", cat: "Citas" },
  { key: "appointments:view_dependency", label: "Ver citas de la dependencia", cat: "Citas" },
  { key: "appointments:create", label: "Crear citas", cat: "Citas" },
  { key: "appointments:confirm", label: "Confirmar citas", cat: "Citas" },
  { key: "appointments:complete", label: "Completar citas", cat: "Citas" },
  { key: "appointments:cancel", label: "Cancelar citas", cat: "Citas" },
  { key: "appointments:no_show", label: "Marcar no asistió", cat: "Citas" },
  { key: "users:view", label: "Ver usuarios", cat: "Usuarios" },
  { key: "users:create", label: "Crear usuarios", cat: "Usuarios" },
  { key: "users:edit_role", label: "Cambiar roles", cat: "Usuarios" },
  { key: "users:edit_dependency", label: "Cambiar dependencia", cat: "Usuarios" },
  { key: "users:toggle_status", label: "Activar/desactivar", cat: "Usuarios" },
  { key: "dashboard:view_stats", label: "Ver estadísticas", cat: "Dashboard" },
  { key: "dashboard:view_charts", label: "Ver gráficas", cat: "Dashboard" },
  { key: "dashboard:export_data", label: "Exportar datos", cat: "Dashboard" },
  { key: "schedule:view_own", label: "Ver horarios propios", cat: "Horarios" },
  { key: "schedule:manage_own", label: "Gestionar horarios propios", cat: "Horarios" },
  { key: "schedule:view_all", label: "Ver todos los horarios", cat: "Horarios" },
  { key: "schedule:manage_all", label: "Gestionar todos los horarios", cat: "Horarios" },
  { key: "clinical_notes:view_own", label: "Ver notas propias", cat: "Notas Clínicas" },
  { key: "clinical_notes:create", label: "Crear notas", cat: "Notas Clínicas" },
  { key: "clinical_notes:edit_own", label: "Editar notas propias", cat: "Notas Clínicas" },
  { key: "clinical_notes:delete_own", label: "Eliminar notas propias", cat: "Notas Clínicas" },
  { key: "clinical_notes:view_all", label: "Ver todas las notas", cat: "Notas Clínicas" },
  { key: "config:view", label: "Ver configuración", cat: "Configuración" },
  { key: "config:edit", label: "Editar configuración", cat: "Configuración" },
  { key: "audit:view", label: "Ver logs de auditoría", cat: "Auditoría" },
];

const DEFAULT_PERMISSIONS = {
  SUPERADMIN: {
    appointments: ["view_own", "view_all", "view_dependency", "create", "confirm", "complete", "cancel", "no_show"],
    users: ["view", "create", "edit_role", "edit_dependency", "toggle_status"],
    dashboard: ["view_stats", "view_charts", "export_data"],
    schedule: ["view_own", "manage_own", "view_all", "manage_all"],
    clinical_notes: ["view_own", "create", "edit_own", "delete_own", "view_all"],
    config: ["view", "edit"],
    audit: ["view"],
  },
  COORDINACION: {
    appointments: ["view_own", "view_dependency", "create", "confirm", "complete", "cancel", "no_show"],
    users: ["view"],
    dashboard: ["view_stats", "view_charts", "export_data"],
    schedule: ["view_own", "view_all"],
    clinical_notes: ["view_own", "view_all"],
    config: ["view"],
    audit: ["view"],
  },
  PROFESIONAL: {
    appointments: ["view_own", "view_dependency", "confirm", "complete", "no_show"],
    users: [],
    dashboard: ["view_stats"],
    schedule: ["view_own", "manage_own"],
    clinical_notes: ["view_own", "create", "edit_own", "delete_own"],
    config: [],
    audit: [],
  },
  APRENDIZ: {
    appointments: ["view_own", "create", "cancel"],
    users: [],
    dashboard: [],
    schedule: ["view_own"],
    clinical_notes: [],
    config: [],
    audit: [],
  },
};

function isPermEnabled(rolePerms, permKey) {
  const [cat, key] = permKey.split(":");
  return (rolePerms?.[cat] || []).includes(key);
}

function togglePerm(rolePerms, permKey) {
  const [cat, key] = permKey.split(":");
  const current = rolePerms?.[cat] || [];
  const updated = current.includes(key)
    ? current.filter((p) => p !== key)
    : [...current, key];
  return { ...rolePerms, [cat]: updated };
}

export function RolesPermissions() {
  const { roles, setRoles, fetchRoles, fetchUserCounts } = useAdmin();
  const [rolePermissions, setRolePermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [savingRole, setSavingRole] = useState(null);

  const loadPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name, permissions");

      if (error) {
        setRolePermissions(DEFAULT_PERMISSIONS);
        setOriginalPermissions(DEFAULT_PERMISSIONS);
        return;
      }

      const perms = {};
      (data || []).forEach((r) => {
        perms[r.name] = r.permissions || DEFAULT_PERMISSIONS[r.name] || {};
      });

      Object.keys(DEFAULT_PERMISSIONS).forEach((name) => {
        if (!perms[name]) perms[name] = DEFAULT_PERMISSIONS[name];
      });

      setRolePermissions(perms);
      setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
    } catch {
      setRolePermissions(DEFAULT_PERMISSIONS);
      setOriginalPermissions(DEFAULT_PERMISSIONS);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUserCounts();
    loadPermissions();
  }, [fetchRoles, fetchUserCounts, loadPermissions]);

  const handleToggle = (roleName, permKey) => {
    setRolePermissions((prev) => ({
      ...prev,
      [roleName]: togglePerm(prev[roleName], permKey),
    }));
  };

  const hasChanges = (roleName) => {
    return JSON.stringify(rolePermissions[roleName]) !== JSON.stringify(originalPermissions[roleName]);
  };

  const resetRole = (roleName) => {
    setRolePermissions((prev) => ({
      ...prev,
      [roleName]: JSON.parse(JSON.stringify(originalPermissions[roleName])),
    }));
  };

  const handleSave = async (roleName) => {
    setSavingRole(roleName);
    try {
      const role = roles.find((r) => r.name === roleName);
      if (!role) return;

      const newPermissions = rolePermissions[roleName];
      const { error } = await supabase
        .from("roles")
        .update({ permissions: newPermissions })
        .eq("id", role.id);

      if (error) throw error;
      setRoles((prev) =>
        prev.map((r) => (r.name === roleName ? { ...r, permissions: newPermissions } : r))
      );
      setOriginalPermissions((prev) => ({
        ...prev,
        [roleName]: JSON.parse(JSON.stringify(newPermissions)),
      }));
      toast.success(`Permisos de ${ROLE_LABELS[roleName]} actualizados`);
    } catch (err) {
      toast.error("Error guardando permisos: " + err.message);
    } finally {
      setSavingRole(null);
    }
  };

  const categories = [...new Set(ALL_PERMISSIONS.map((p) => p.cat))];

  return (
    <div className="roles-permissions">
      <div className="roles-header">
        <div>
          <h2>Roles y Permisos</h2>
          <p className="roles-subtitle">Define qué puede hacer cada rol en el sistema</p>
        </div>
      </div>

      <div className="perm-matrix-wrapper">
        <table className="perm-matrix">
          <thead>
            <tr>
              <th className="perm-matrix-th perm-matrix-th-label">Permiso</th>
              {roles.map((role) => {
                const color = ROLE_COLORS[role.name] || "#6b7280";
                const dirty = hasChanges(role.name);
                return (
                  <th key={role.id} className="perm-matrix-th">
                    <div className="perm-matrix-role-header">
                      <div className="perm-matrix-role-icon" style={{ background: color + "20", color }}>
                        <Shield size={14} />
                      </div>
                      <span className="perm-matrix-role-name">{ROLE_LABELS[role.name] || role.name}</span>
                      {dirty && <span className="dirty-dot" />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const catPerms = ALL_PERMISSIONS.filter((p) => p.cat === cat);
              return (
                <React.Fragment key={cat}>
                  <tr className="perm-matrix-cat-row">
                    <td colSpan={roles.length + 1} className="perm-matrix-cat-label">{cat}</td>
                  </tr>
                  {catPerms.map((perm) => (
                    <tr key={perm.key} className="perm-matrix-row">
                      <td className="perm-matrix-td perm-matrix-td-label">{perm.label}</td>
                      {roles.map((role) => {
                        const enabled = isPermEnabled(rolePermissions[role.name], perm.key);
                        return (
                          <td key={role.id} className="perm-matrix-td perm-matrix-td-check">
                            <button
                              className={`perm-matrix-check ${enabled ? "active" : ""}`}
                              onClick={() => handleToggle(role.name, perm.key)}
                              type="button"
                              aria-pressed={enabled}
                              aria-label={`${enabled ? "Quitar" : "Dar"} permiso ${perm.label} a ${ROLE_LABELS[role.name]}`}
                            >
                              {enabled && <Check size={12} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="perm-matrix-footer-row">
              <td className="perm-matrix-td perm-matrix-td-label" style={{ fontWeight: 600 }}>Total permisos</td>
              {roles.map((role) => {
                const perms = rolePermissions[role.name] || {};
                const total = Object.values(perms).reduce((s, a) => s + (a?.length || 0), 0);
                const dirty = hasChanges(role.name);
                return (
                  <td key={role.id} className="perm-matrix-td perm-matrix-td-check">
                    <div className="perm-matrix-footer-cell">
                      <span className="perm-matrix-total">{total}</span>
                      {dirty && (
                        <div className="perm-matrix-actions">
                          <button className="perm-matrix-btn reset" onClick={() => resetRole(role.name)} title="Deshacer">
                            <RotateCcw size={12} />
                          </button>
                          <button
                            className="perm-matrix-btn save"
                            onClick={() => handleSave(role.name)}
                            disabled={savingRole === role.name}
                            title="Guardar"
                          >
                            <Save size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
