import { TrendingUp, TrendingDown } from "lucide-react";

export function KPICard({ title, value, subtitle, trend, color, icon }) {
  return (
    <div className="kpi-card" style={{ "--kpi-color": color }}>
      <div className="kpi-header">
        <div className="kpi-icon-wrap" style={{ background: `${color}12` }}>
          {icon || <div className="kpi-dot" style={{ background: color }} />}
        </div>
        <h3>{title}</h3>
      </div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      <div className="kpi-footer">
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
        {trend !== undefined && (
          <span className={`kpi-trend ${trend >= 0 ? "positive" : "negative"}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
