import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, ChevronLeft, ChevronRight, Command,
  Home, Calendar, CalendarDays, Users, UserCog, Building2, BarChart3, Settings,
  Sun, Moon, LogOut, Search, ChevronUp,
  User, Mail, Lock, Save, Bell, Palette, Info,
  BellRing, Type, PaintBucket, Eye, EyeOff,
  Loader2, UserCircle,
} from "lucide-react";
import { useTheme } from "../../providers/useTheme";
import { useAuth } from "../../providers/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { CommandPalette } from "./CommandPalette";

const ROLE_LABELS = { SUPERADMIN: "Super Admin", COORDINACION: "Coordinación", PROFESIONAL: "Profesional", APRENDIZ: "Aprendiz" };
const ROLE_COLORS = { SUPERADMIN: "#f59e0b", COORDINACION: "#3b82f6", PROFESIONAL: "#8b5cf6", APRENDIZ: "#6b7280" };
const NAV_ICONS = { Home, Calendar, CalendarDays, Users, UserCog, Building2, BarChart3, Settings };
const ACCENTS = [{ name: "SENA", value: "#1a5c2e" }, { name: "Azul", value: "#2563eb" }, { name: "Morado", value: "#7c3aed" }];

export function DashboardLayout({ title, actions = [], children, userRole, loading = false, empty = false, fullHeight = false }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState("main");
  const { theme, toggleTheme } = useTheme();
  const { signOut, profile, user } = useAuth();

  const navItems = useMemo(() => [
    { label: "Inicio", icon: "Home", href: "/", roles: ["SUPERADMIN", "COORDINACION", "PROFESIONAL", "APRENDIZ"] },
    { label: "Mis Citas", icon: "Calendar", href: "/dashboard", roles: ["APRENDIZ"] },
    { label: "Mi Agenda", icon: "CalendarDays", href: "/professional", roles: ["PROFESIONAL"] },
    { label: "Panel", icon: "BarChart3", href: "/coordination", roles: ["COORDINACION"] },
    { label: "Admin", icon: "Settings", href: "/admin", roles: ["SUPERADMIN"] },
    { label: "Usuarios", icon: "UserCog", href: "/admin", roles: ["SUPERADMIN"] },
    { label: "Reportes", icon: "BarChart3", href: "/coordination", roles: ["COORDINACION", "SUPERADMIN"] },
  ], []);

  const filteredNav = useMemo(() => {
    const items = navItems.filter(i => userRole ? i.roles.includes(userRole) : true);
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q));
  }, [userRole, search, navItems]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(p => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); setCollapsed(p => !p); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const roleName = profile?.roles?.name || "";
  const initial = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>

      {isMobile && mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${isMobile && mobileOpen ? "open" : ""}`} aria-label="Navegación">
        <div className="sidebar-inner">
          {/* Logo */}
          <div className="sidebar-brand">
            <div className="sidebar-logo"><span>S</span></div>
            {!collapsed && <span className="sidebar-brand-text">SENA Bienestar</span>}
          </div>

          {/* When profile is open: show profile content. Otherwise: show nav */}
          {profileOpen && !collapsed ? (
            /* PROFILE VIEW — replaces nav content */
            <div className="sidebar-profile-view">
              {profileView === "main" ? (
                <>
                  {/* Hero: avatar + info */}
                  <div className="sidebar-profile-hero">
                    <div className="sidebar-profile-avatar" style={{ background: ROLE_COLORS[roleName] || "#6b7280" }}>{initial}</div>
                    <div className="sidebar-profile-name">{profile?.full_name || "Usuario"}</div>
                    <div className="sidebar-profile-email">{user?.email}</div>
                    <div className="sidebar-profile-badges">
                      <span className="sidebar-badge role">{ROLE_LABELS[roleName] || roleName}</span>
                      {profile?.dependencies?.name && <span className="sidebar-badge dep">{profile.dependencies.name}</span>}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="sidebar-profile-menu">
                    <button className="sidebar-menu-item" onClick={() => setProfileView("settings")}>
                      <UserCircle size={17} /><span>Configuración</span><ChevronRight size={15} className="sidebar-menu-arrow" />
                    </button>
                    <button className="sidebar-menu-item" onClick={() => setProfileView("notifications")}>
                      <Bell size={17} /><span>Notificaciones</span><ChevronRight size={15} className="sidebar-menu-arrow" />
                    </button>
                    <button className="sidebar-menu-item" onClick={() => setProfileView("customize")}>
                      <Palette size={17} /><span>Personalizar</span><ChevronRight size={15} className="sidebar-menu-arrow" />
                    </button>
                    <button className="sidebar-menu-item" onClick={toggleTheme}>
                      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                      <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
                    </button>
                  </div>

                  <div className="sidebar-menu-divider" />

                  <button className="sidebar-logout-btn" onClick={signOut}>
                    <LogOut size={16} /><span>Cerrar sesión</span>
                  </button>

                  <div className="sidebar-version"><Info size={10} /> v1.0</div>
                </>
              ) : profileView === "settings" ? (
                <ProfileSettings onBack={() => setProfileView("main")} />
              ) : profileView === "notifications" ? (
                <ProfileNotifications onBack={() => setProfileView("main")} />
              ) : (
                <ProfileCustomize onBack={() => setProfileView("main")} />
              )}
            </div>
          ) : (
            <>
              {/* Nav */}
              <nav className="sidebar-nav">
                {filteredNav.map(item => {
                  const Icon = NAV_ICONS[item.icon];
                  const active = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
                  return (
                    <Link key={item.label + item.href} to={item.href} className={`sidebar-link ${active ? "active" : ""}`} title={collapsed ? item.label : ""}>
                      <span className="sidebar-link-icon">{Icon && <Icon size={18} />}</span>
                      {!collapsed && <span className="sidebar-link-text">{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>

              {/* Search when expanded */}
              {!collapsed && (
                <div className="sidebar-search">
                  <Search size={14} />
                  <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar" />
                  {search && <button onClick={() => setSearch("")} aria-label="Limpiar"><X size={12} /></button>}
                </div>
              )}

              {/* Footer: user button */}
              <div className="sidebar-footer">
                <button className="sidebar-user" onClick={() => { setProfileOpen(true); setProfileView("main"); if (collapsed) setCollapsed(false); }}>
                  <div className="sidebar-avatar" style={{ background: ROLE_COLORS[roleName] || "#6b7280" }}>{initial}</div>
                  {!collapsed && (
                    <div className="sidebar-user-info">
                      <span className="sidebar-user-name">{profile?.full_name || "Usuario"}</span>
                      <span className="sidebar-user-role">{ROLE_LABELS[roleName] || roleName}</span>
                    </div>
                  )}
                  {!collapsed && <ChevronRight size={14} />}
                </button>

                {!collapsed && (
                  <div className="sidebar-actions">
                    <button onClick={toggleTheme} title={theme === "dark" ? "Claro" : "Oscuro"} aria-label="Cambiar tema">
                      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                    <button onClick={signOut} title="Salir" aria-label="Cerrar sesión" className="logout"><LogOut size={15} /></button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="topbar">
          {isMobile && <button className="topbar-menu" onClick={() => setMobileOpen(true)} aria-label="Menú"><Menu size={20} /></button>}
          {profileOpen && !collapsed && (
            <button className="topbar-back" onClick={() => setProfileOpen(false)} aria-label="Volver al menú">
              <ChevronLeft size={18} />
            </button>
          )}
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">
            <button className="topbar-cmd" onClick={() => setCmdOpen(true)} aria-label="Buscar"><Command size={14} /><span>⌘K</span></button>
            {actions.map((a, i) => <button key={i} className="topbar-btn" onClick={a.onClick} disabled={a.disabled} title={a.title}>{a.icon}{a.label}</button>)}
          </div>
        </header>
        <div className={`main-body ${fullHeight ? "full" : ""}`} id="main-content">
          {loading ? (
            <div className="loading-state" role="status" aria-live="polite"><div className="loading-spinner" /><p>Cargando...</p></div>
          ) : empty ? (
            <div className="empty-state"><Calendar size={40} /><h3>Sin datos aún</h3><p>El contenido aparecerá cuando haya actividad.</p></div>
          ) : children}
        </div>
      </main>

      <CommandPalette key={cmdOpen ? "open" : "closed"} isOpen={cmdOpen} onClose={() => setCmdOpen(false)} userRole={userRole} />
    </div>
  );
}

/* Profile sub-views */
function ProfileSettings({ onBack }) {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [doc, setDoc] = useState(profile?.document_number || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pass, setPass] = useState("");
  const [cpass, setCpass] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [saving, setSaving] = useState(null);

  const save = async (type) => {
    setSaving(type);
    try {
      if (type === "profile") {
        const { error } = await supabase.from("profiles").update({ full_name: name, document_number: doc || null }).eq("id", user.id);
        if (error) throw error; toast.success("Perfil actualizado");
      } else if (type === "email") {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error; toast.success("Correo actualizado");
      } else if (type === "password") {
        if (pass !== cpass) { toast.error("No coinciden"); setSaving(null); return; }
        if (pass.length < 6) { toast.error("Mínimo 6 caracteres"); setSaving(null); return; }
        const { error } = await supabase.auth.updateUser({ password: pass });
        if (error) throw error; setPass(""); setCpass(""); toast.success("Contraseña actualizada");
      }
    } catch (e) { toast.error(e.message); } finally { setSaving(null); }
  };

  return (
    <div className="sidebar-profile-sub">
      <div className="sidebar-sub-header">
        <button className="sidebar-back-btn" onClick={onBack}><ChevronLeft size={15} /></button>
        <span>Configuración</span>
      </div>
      <div className="sidebar-sub-body">
        <div className="sidebar-field-group">
          <div className="sidebar-field-label"><UserCircle size={12} /> Datos</div>
          <input className="sidebar-field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
          <input className="sidebar-field-input" value={doc} onChange={e => setDoc(e.target.value)} placeholder="Documento" />
          <button className="sidebar-save-btn" onClick={() => save("profile")} disabled={saving === "profile"}>
            {saving === "profile" ? <Loader2 size={12} className="spin" /> : <Save size={12} />} Guardar
          </button>
        </div>
        <div className="sidebar-field-group">
          <div className="sidebar-field-label"><Mail size={12} /> Correo</div>
          <input className="sidebar-field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="sidebar-save-btn" onClick={() => save("email")} disabled={saving === "email" || !email || email === user.email}>
            <Mail size={12} /> Actualizar
          </button>
        </div>
        <div className="sidebar-field-group">
          <div className="sidebar-field-label"><Lock size={12} /> Contraseña</div>
          <div className="sidebar-pw-field">
            <input className="sidebar-field-input" type={show1 ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Nueva" />
            <button className="sidebar-pw-toggle" onClick={() => setShow1(p => !p)} tabIndex={-1}>{show1 ? <EyeOff size={13} /> : <Eye size={13} />}</button>
          </div>
          <div className="sidebar-pw-field">
            <input className="sidebar-field-input" type={show2 ? "text" : "password"} value={cpass} onChange={e => setCpass(e.target.value)} placeholder="Confirmar" />
            <button className="sidebar-pw-toggle" onClick={() => setShow2(p => !p)} tabIndex={-1}>{show2 ? <EyeOff size={13} /> : <Eye size={13} />}</button>
          </div>
          <button className="sidebar-save-btn" onClick={() => save("password")} disabled={saving === "password" || !pass}>
            <Lock size={12} /> Cambiar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileNotifications({ onBack }) {
  const [emailN, setEmailN] = useState(() => localStorage.getItem("notif-email") !== "false");
  const [appN, setAppN] = useState(() => localStorage.getItem("notif-app") !== "false");
  const [rem, setRem] = useState(() => localStorage.getItem("notif-reminder") !== "false");
  const [snd, setSnd] = useState(() => localStorage.getItem("notif-sound") === "true");
  useEffect(() => { localStorage.setItem("notif-email", emailN); localStorage.setItem("notif-app", appN); localStorage.setItem("notif-reminder", rem); localStorage.setItem("notif-sound", snd); }, [emailN, appN, rem, snd]);

  return (
    <div className="sidebar-profile-sub">
      <div className="sidebar-sub-header">
        <button className="sidebar-back-btn" onClick={onBack}><ChevronLeft size={15} /></button>
        <span>Notificaciones</span>
      </div>
      <div className="sidebar-sub-body">
        <div className="sidebar-field-group">
          <div className="sidebar-field-label"><BellRing size={12} /> Preferencias</div>
          <ToggleRow v={emailN} set={setEmailN} l="Email" />
          <ToggleRow v={appN} set={setAppN} l="En la app" />
          <ToggleRow v={snd} set={setSnd} l="Sonido" />
        </div>
        <div className="sidebar-field-group">
          <div className="sidebar-field-label"><Bell size={12} /> Recordatorios</div>
          <ToggleRow v={rem} set={setRem} l="24h antes" />
        </div>
      </div>
    </div>
  );
}

function ProfileCustomize({ onBack }) {
  const [fs, setFs] = useState(() => localStorage.getItem("font-size") || "medium");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent-color") || "#1a5c2e");
  useEffect(() => { localStorage.setItem("font-size", fs); document.documentElement.style.setProperty("--text-scale", fs === "small" ? "0.9" : fs === "large" ? "1.1" : "1"); }, [fs]);
  useEffect(() => { localStorage.setItem("accent-color", accent); document.documentElement.style.setProperty("--sena-green", accent); }, [accent]);

  return (
    <div className="sidebar-profile-sub">
      <div className="sidebar-sub-header">
        <button className="sidebar-back-btn" onClick={onBack}><ChevronLeft size={15} /></button>
        <span>Personalizar</span>
      </div>
      <div className="sidebar-sub-body">
        <div className="sidebar-field-group">
          <div className="sidebar-field-label"><Type size={12} /> Fuente</div>
          <div className="sidebar-radio-group">{[["small","Pequeño"],["medium","Mediano"],["large","Grande"]].map(([v,l]) => <button key={v} className={`sidebar-radio-btn${fs === v ? " active" : ""}`} onClick={() => setFs(v)}>{l}</button>)}</div>
        </div>
        <div className="sidebar-field-group">
          <div className="sidebar-field-label"><PaintBucket size={12} /> Color</div>
          <div className="sidebar-color-group">{ACCENTS.map(c => <button key={c.value} className={`sidebar-color-btn${accent === c.value ? " active" : ""}`} style={{ background: c.value }} onClick={() => setAccent(c.value)} title={c.name} aria-label={c.name} />)}</div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ v, set, l }) {
  return (
    <button className="sidebar-toggle-row" onClick={() => set(!v)} type="button">
      <span>{l}</span>
      <div className={`sidebar-toggle-switch ${v ? "on" : ""}`}><div className="sidebar-toggle-dot" /></div>
    </button>
  );
}
