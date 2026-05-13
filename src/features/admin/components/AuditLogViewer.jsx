import { useEffect, useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { Clock, User, Database, ArrowRight } from "lucide-react";

const ACTION_COLORS = {
    CREATE_USER: `#22c55e`,
    UPDATE_USER: `#3B82F6`,
    DELETE_APPOINTMENT: `#ef4444`,
    UPDATE_CONFIG: `#f59e0b`
};

export const AuditLogViewer = () => {
    const { auditLogs, fetchAuditLogs } = useAdmin();
    const [filter, setFilter] = useState("");

    useEffect(() => {
        fetchAuditLogs(filter);
    }, [fetchAuditLogs]);

    const filteredLogs = filter
        ? auditLogs.filter(l => l.action.includes(filter) || l.entity_type.includes(filter))
        : auditLogs;

        return ( 
            <div className="admin-section">
                <h2>Registro de Auditoria</h2>
                <div className="audit-filters">
                    <input
                        type="text"
                        placeholder="Filtrar por acción..." 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                     /> 
                </div>
                <div className="audit-timeline">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="audit-item">
                            <div className="audit-dot" style={{ background: ACTION_COLORS[log.action] || '#666' }} />
                        <div className="audit-content">
                            <div className="audit-header">
                                <span className="audit-action" style={{color: ACTION_COLORS[log.action]}}>{log.action}</span>
                                <span className="audit-time">
                                    <Clock size={14} />
                                    {new Date(log.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="audit-details">
                                <p>
                                    <User size={14} />
                                    <strong>{log.admin?.full_name || "Sistema"}</strong>
                                    {` `}modifico{` `}
                                    <Database size={14} />
                                    <strong>{log.entity_type}</strong>
                                    {` `}(ID: {log.entity_id})
                                </p>
                                {log.old_data && log.new_data && (
                                    <div className="audit-changes">
                                        <div className="change-box old">
                                            <span className="label">antes</span>
                                            <pre>{JSON.stringify(log.old_data, null, 2)}</pre>
                                        </div>
                                        <ArrowRight size={20} />
                                        <div className="change-box new">
                                            <span className="label">después</span>
                                            <pre>{JSON.stringify(log.new_data, null, 2)}</pre>
                                        </div>
                                    </div>
                                    )}
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        );
}