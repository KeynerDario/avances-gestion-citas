import { useState, useEffect, useRef } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { Search, Filter, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { SkeletonTable } from "../../../shared/components/EmptyState";

const ACTION_COLORS = {
  CREATE_USER: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  UPDATE_USER: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  ACTIVATE_USER: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  DEACTIVATE_USER: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  UPDATE_CONFIG: { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  UPDATE_ROLE: { bg: "#f3e8ff", color: "#6b21a8", dot: "#8b5cf6" },
  CREATE_DEPENDENCY: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  UPDATE_DEPENDENCY: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  DELETE_DEPENDENCY: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  CREATE_APPOINTMENT: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  UPDATE_APPOINTMENT: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  CANCEL_APPOINTMENT: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  CONFIRM_APPOINTMENT: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  COMPLETE_APPOINTMENT: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  NO_SHOW_APPOINTMENT: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  CREATE_SCHEDULE: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  UPDATE_SCHEDULE: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  DELETE_SCHEDULE: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  CREATE_NOTE: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  UPDATE_NOTE: { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  DELETE_NOTE: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

const ACTION_LABELS = {
  CREATE_USER: "Crear usuario",
  UPDATE_USER: "Actualizar usuario",
  ACTIVATE_USER: "Activar usuario",
  DEACTIVATE_USER: "Desactivar usuario",
  UPDATE_CONFIG: "Actualizar configuración",
  UPDATE_ROLE: "Cambiar rol",
  CREATE_DEPENDENCY: "Crear dependencia",
  UPDATE_DEPENDENCY: "Actualizar dependencia",
  DELETE_DEPENDENCY: "Eliminar dependencia",
  CREATE_APPOINTMENT: "Crear cita",
  UPDATE_APPOINTMENT: "Actualizar cita",
  CANCEL_APPOINTMENT: "Cancelar cita",
  CONFIRM_APPOINTMENT: "Confirmar cita",
  COMPLETE_APPOINTMENT: "Completar cita",
  NO_SHOW_APPOINTMENT: "No asistió",
  CREATE_SCHEDULE: "Crear horario",
  UPDATE_SCHEDULE: "Actualizar horario",
  DELETE_SCHEDULE: "Eliminar horario",
  CREATE_NOTE: "Crear nota clínica",
  UPDATE_NOTE: "Actualizar nota clínica",
  DELETE_NOTE: "Eliminar nota clínica",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DiffView({ oldData, newData }) {
  const [expanded, setExpanded] = useState(false);

  if (!oldData && !newData) return null;

  const oldObj = oldData || {};
  const newObj = newData || {};
  const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];

  if (allKeys.length === 0) return null;

  return (
    <div className="diff-view">
      <button className="diff-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Ver cambios
      </button>
      {expanded && (
        <div className="diff-content">
          {allKeys.map((key) => {
            const oldVal = JSON.stringify(oldObj[key]);
            const newVal = JSON.stringify(newObj[key]);
            const changed = oldVal !== newVal;
            if (!changed) return null;
            return (
              <div key={key} className="diff-row">
                <span className="diff-key">{key}</span>
                {oldVal && <span className="diff-old">{oldVal}</span>}
                {newVal && <span className="diff-new">{newVal}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AuditLogViewer() {
  const { auditLogs, fetchAuditLogs, loading } = useAdmin();
  const [search, setSearch] = useState("");
  const debounceRef = useRef(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAuditLogs({ search, action: actionFilter, page, limit: PAGE_SIZE });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, actionFilter, page, fetchAuditLogs]);

  const handleSearch = () => {
    clearTimeout(debounceRef.current);
    setPage(1);
    fetchAuditLogs({ search, action: actionFilter, page: 1, limit: PAGE_SIZE });
  };

  const displayedLogs = auditLogs;

  return (
    <div className="audit-viewer">
      <div className="audit-header">
        <h2>Registro de Auditoría</h2>
        <p className="audit-subtitle">Historial de acciones del sistema</p>
      </div>

      <div className="audit-filters">
        <div className="audit-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por acción, entidad o usuario..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            aria-label="Buscar registros de auditoría"
          />
          <button onClick={handleSearch} className="audit-search-btn" aria-label="Buscar">
            <Filter size={14} />
          </button>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="audit-action-filter"
          aria-label="Filtrar por tipo de acción"
        >
          <option value="">Todas las acciones</option>
          <option value="CREATE">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
          <option value="ACTIVATE">Activar</option>
          <option value="DEACTIVATE">Desactivar</option>
        </select>
        <span className="audit-count">{displayedLogs.length} registros</span>
      </div>

      {loading ? (
        <div className="audit-loading">
          <SkeletonTable rows={5} />
        </div>
      ) : displayedLogs.length === 0 ? (
        <div className="audit-empty">
          <FileText size={40} />
          <p>No hay registros de auditoría</p>
        </div>
      ) : (
        <div className="audit-timeline">
          {displayedLogs.map((log) => {
            const actionStyle = ACTION_COLORS[log.action] || { bg: "#f3f4f6", color: "#374151", dot: "#6b7280" };
            const actionLabel = ACTION_LABELS[log.action] || log.action;
            return (
              <div key={log.id} className="audit-entry">
                <div className="audit-dot" style={{ background: actionStyle.dot }} />
                <div className="audit-card">
                  <div className="audit-card-header">
                    <span className="audit-action-badge" style={{ background: actionStyle.bg, color: actionStyle.color }}>
                      {actionLabel}
                    </span>
                    <span className="audit-date">{formatDate(log.created_at)}</span>
                  </div>
                  <div className="audit-card-body">
                    <div className="audit-meta">
                      <span className="audit-admin">
                        <strong>{log.admin?.full_name || "Sistema"}</strong>
                      </span>
                      {log.entity_type && (
                        <span className="audit-entity">{log.entity_type}</span>
                      )}
                      {log.entity_id && (
                        <span className="audit-entity-id">{String(log.entity_id).slice(0, 8)}...</span>
                      )}
                    </div>
                    <DiffView oldData={log.oid_data} newData={log.new_data} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
