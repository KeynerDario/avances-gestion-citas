export function EmptyState({ icon: Icon, title, description, action, actionLabel, actionOnClick }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-icon">
          <Icon size={48} />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action ? action : actionLabel && (
        <button className="btn btn-primary" onClick={actionOnClick}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton-row" style={{ marginBottom: '12px' }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: `${85 - i * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat">
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '12px' }} />
      <div className="skeleton skeleton-title" style={{ width: '40%' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-card" style={{ padding: 0 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-text" style={{ width: '50px' }} />
        </div>
      ))}
    </div>
  );
}
