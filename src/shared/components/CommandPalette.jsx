import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calendar, Users, Building2, BarChart3, Settings, Shield, Home, Clock, FileText, Command } from "lucide-react";

const COMMANDS = [
  { id: "home", label: "Ir a Inicio", icon: Home, href: "/", roles: ["SUPERADMIN", "COORDINACION", "PROFESIONAL", "APRENDIZ"] },
  { id: "appointments", label: "Ver mis citas", icon: Calendar, href: "/dashboard", roles: ["APRENDIZ"] },
  { id: "agenda", label: "Agenda del día", icon: Clock, href: "/professional", roles: ["PROFESIONAL"] },
  { id: "panel", label: "Panel de Coordinación", icon: Users, href: "/coordination", roles: ["COORDINACION"] },
  { id: "admin", label: "Panel de Administración", icon: Users, href: "/admin", roles: ["SUPERADMIN"] },
  { id: "users", label: "Gestionar usuarios", icon: Users, href: "/admin", roles: ["SUPERADMIN"] },
  { id: "dependencies", label: "Dependencias", icon: Building2, href: "/admin", roles: ["SUPERADMIN"] },
  { id: "reports", label: "Reportes", icon: BarChart3, href: "/coordination", roles: ["COORDINACION", "SUPERADMIN"] },
  { id: "roles", label: "Roles y permisos", icon: Shield, href: "/admin", roles: ["SUPERADMIN"] },
  { id: "config", label: "Configuración", icon: Settings, href: "/admin", roles: ["SUPERADMIN"] },
];

export function CommandPalette({ isOpen, onClose, userRole }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const paletteRef = useRef(null);

  const filtered = useMemo(() => {
    const byRole = COMMANDS.filter((cmd) => cmd.roles.includes(userRole || "APRENDIZ"));
    if (!query.trim()) return byRole;
    const q = query.toLowerCase();
    return byRole.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.id.toLowerCase().includes(q)
    );
  }, [query, userRole]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filtered.length > 0) {
          setSelectedIndex((i) => (i + 1) % filtered.length);
        }
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filtered.length > 0) {
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
        }
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].href);
        onClose();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const palette = paletteRef.current;
        if (!palette) return;
        const focusable = palette.querySelectorAll(
          'input, a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) last?.focus();
        } else {
          if (document.activeElement === last) first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, navigate]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex];
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function renderCmdList() {
    if (filtered.length === 0) {
      return <div className="cmd-empty">No se encontraron resultados</div>;
    }
    return filtered.map((cmd, index) => (
      <Link
        key={cmd.id}
        id={`cmd-option-${cmd.id}`}
        to={cmd.href}
        className={`cmd-item ${index === selectedIndex ? "selected" : ""}`}
        role="option"
        aria-selected={index === selectedIndex}
        onMouseEnter={() => setSelectedIndex(index)}
        onClick={() => onClose()}
      >
        <cmd.icon size={16} />
        <span>{cmd.label}</span>
      </Link>
    ));
  }

  if (!isOpen) return null;

  return (
    <div className="cmd-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="cmd-palette" ref={paletteRef} onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrapper">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Escribe un comando o busca..."
            value={query}
            onChange={handleQueryChange}
            aria-label="Buscar comando"
            aria-activedescendant={filtered[selectedIndex] ? `cmd-option-${filtered[selectedIndex].id}` : undefined}
            aria-controls="cmd-listbox"
            aria-autocomplete="list"
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>
        <div className="cmd-list" ref={listRef} role="listbox" id="cmd-listbox" aria-label="Comandos disponibles">
          {renderCmdList()}
        </div>
        <div className="cmd-footer">
          <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>ESC</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}