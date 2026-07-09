import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthContext";
import { useTheme } from "../../providers/useTheme";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import {
  User, LogOut, Shield, Mail, Lock, Save, X,
  UserCircle, Sun, Moon, Phone, ChevronRight, ChevronLeft,
  Loader2, Check, Eye, EyeOff, Settings, Bell, Palette, Info,
  BellRing, BellOff, Volume2, Monitor, Type, PaintBucket,
} from "lucide-react";

const ROLE_LABELS = {
  SUPERADMIN: "Super Admin",
  COORDINACION: "Coordinación",
  PROFESIONAL: "Profesional",
  APRENDIZ: "Aprendiz",
};

const ROLE_BG = {
  SUPERADMIN: 'role-bg-superadmin',
  COORDINACION: 'role-bg-coordinacion',
  PROFESIONAL: 'role-bg-profesional',
  APRENDIZ: 'role-bg-aprendiz',
};

const ACCENTS = [
  { name: "Verde", value: "#39A900" },
  { name: "Azul", value: "#2563eb" },
  { name: "Morado", value: "#7c3aed" },
];

function Btn({ loading, done, icon, text, doneText, onClick, disabled, variant }) {
  return (
    <button className={`aside-btn${done ? " done" : ""}${variant ? ` ${variant}` : ""}`}
      onClick={onClick} disabled={disabled || loading}
    >
      {loading ? <Loader2 size={15} className="spin" /> : done ? <Check size={15} /> : icon}
      {done ? doneText : text}
    </button>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button className="toggle-row" onClick={() => onChange(!value)} type="button">
      <span className="toggle-label">{label}</span>
      <div className={`toggle-switch${value ? " on" : ""}`}>
        <div className="toggle-dot" />
      </div>
    </button>
  );
}

export function ProfileDropdown({ expanded }) {
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("main");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open]);

  const roleName = profile?.roles?.name || "";
  const depName = profile?.dependencies?.name || "";
  const avatarBg = ROLE_BG[roleName] || 'role-bg-aprendiz';
  const initial = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <>
      <button
        className={`profile-trigger${expanded ? " expanded" : ""}`}
        onClick={() => { setView("main"); setOpen(true); }}
        aria-label="Abrir perfil"
        aria-expanded={open}
      >
        <div className={`profile-avatar ${avatarBg}`}>{initial}</div>
        {expanded && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{profile?.full_name || "Usuario"}</span>
            <span className="sidebar-user-role">{ROLE_LABELS[roleName] || roleName}</span>
          </div>
        )}
        {expanded && <ChevronRight size={14} className="profile-chevron" />}
      </button>

      {open && <div className="aside-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        className={`profile-aside ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Perfil"
      >

        {view === "main" && (
          <MainView
            profile={profile} user={user} roleName={roleName} depName={depName}
            avatarBg={avatarBg} initial={initial}
            onClose={() => setOpen(false)}
            onSettings={() => setView("settings")}
            onNotifications={() => setView("notifications")}
            onCustomize={() => setView("customize")}
          />
        )}
        {view === "settings" && <SettingsView onBack={() => setView("main")} />}
        {view === "notifications" && <NotificationsView onBack={() => setView("main")} />}
        {view === "customize" && <CustomizeView onBack={() => setView("main")} />}
      </aside>
    </>
  );
}

function MainView({ profile, user, roleName, depName, avatarBg, initial, onClose, onSettings, onNotifications, onCustomize }) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div className="aside-hero">
        <button className="aside-hero-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="aside-hero-content">
          <div className="aside-avatar-wrap">
            <div className={`aside-avatar ${avatarBg}`}>{initial}</div>
          </div>
          <span className="aside-name">{profile?.full_name || "Sin nombre"}</span>
          <span className="aside-email">{user?.email}</span>
          <div className="aside-badges">
            <span className="aside-badge role"><Shield size={11} />{ROLE_LABELS[roleName] || roleName}</span>
            {depName && <span className="aside-badge dep"><User size={11} />{depName}</span>}
          </div>
        </div>
      </div>

      <div className="aside-body">
        <div className="aside-menu">
          <button className="aside-menu-item" onClick={onSettings}>
            <span className="aside-menu-icon"><Settings size={18} /></span>
            <span className="aside-menu-label">Configuración</span>
            <span className="aside-menu-arrow"><ChevronRight size={16} /></span>
          </button>

          <button className="aside-menu-item" onClick={onNotifications}>
            <span className="aside-menu-icon"><Bell size={18} /></span>
            <span className="aside-menu-label">Notificaciones</span>
            <span className="aside-menu-arrow"><ChevronRight size={16} /></span>
          </button>

          <button className="aside-menu-item" onClick={onCustomize}>
            <span className="aside-menu-icon"><Palette size={18} /></span>
            <span className="aside-menu-label">Personalizar</span>
            <span className="aside-menu-arrow"><ChevronRight size={16} /></span>
          </button>

          <button className="aside-menu-item" onClick={toggleTheme}>
            <span className="aside-menu-icon">{theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}</span>
            <span className="aside-menu-label">{theme === "dark" ? "Modo oscuro" : "Modo claro"}</span>
            <div className="theme-track-sm">
              <div className={`theme-thumb-sm ${theme === "dark" ? "dark" : ""}`}>
                {theme === "dark" ? <Moon size={10} /> : <Sun size={10} />}
              </div>
            </div>
          </button>
        </div>

        <div className="aside-menu-divider" />

        <button className="aside-logout" onClick={signOut}>
          <LogOut size={16} /> Cerrar sesión
        </button>

        <div className="aside-version">
          <Info size={11} /> SENA Bienestar v1.0
        </div>
      </div>
    </>
  );
}

function SettingsView({ onBack }) {
  const { profile, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.document_number || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [s1, setS1] = useState(false); const [d1, setD1] = useState(false);
  const [s2, setS2] = useState(false); const [d2, setD2] = useState(false);
  const [s3, setS3] = useState(false); const [d3, setD3] = useState(false);

  const saveProfile = async () => {
    setS1(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName, document_number: phone || null, updated_at: new Date(),
      }).eq("id", user.id);
      if (error) throw error;
      setD1(true); setTimeout(() => setD1(false), 2000);
      toast.success("Perfil actualizado");
    } catch (e) { toast.error(e.message); } finally { setS1(false); }
  };

  const changeEmail = async () => {
    if (!email || email === user.email) return;
    setS2(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setD2(true); setTimeout(() => setD2(false), 2000);
      toast.success("Correo actualizado. Revisa tu bandeja.");
    } catch (e) { toast.error(e.message); } finally { setS2(false); }
  };

  const changePassword = async () => {
    if (!newPass) return;
    if (newPass !== confirmPass) { toast.error("Las contraseñas no coinciden"); return; }
    if (newPass.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    setS3(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setD3(true); setNewPass(""); setConfirmPass("");
      setTimeout(() => setD3(false), 2000);
      toast.success("Contraseña actualizada");
    } catch (e) { toast.error(e.message); } finally { setS3(false); }
  };

  return (
    <>
      <div className="aside-top-bar">
        <button className="aside-top-back" onClick={onBack} aria-label="Volver"><ChevronLeft size={18} /></button>
        <span className="aside-top-title">Configuración</span>
        <div style={{ width: 34 }} />
      </div>
      <div className="aside-body">
        <div className="aside-group">
          <div className="aside-group-title"><UserCircle size={15} /> Datos personales</div>
          <div className="aside-field">
            <label>Nombre completo</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="aside-field">
            <label><Phone size={13} /> Teléfono / Documento</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Tu número" />
          </div>
          <Btn loading={s1} done={d1} icon={<Save size={15} />} text="Guardar cambios" doneText="Guardado" onClick={saveProfile} />
        </div>

        <div className="aside-group">
          <div className="aside-group-title"><Mail size={15} /> Correo electrónico</div>
          <div className="aside-field">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nuevo@correo.com" />
          </div>
          <Btn loading={s2} done={d2} icon={<Mail size={15} />} text="Actualizar correo" doneText="Enviado" onClick={changeEmail} disabled={!email || email === user.email} />
        </div>

        <div className="aside-group">
          <div className="aside-group-title"><Lock size={15} /> Contraseña</div>
          <div className="aside-field aside-pw">
            <input type={show1 ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nueva contraseña" />
            <button className="pw-toggle" onClick={() => setShow1(!show1)} tabIndex={-1}>{show1 ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          <div className="aside-field aside-pw">
            <input type={show2 ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirmar contraseña" />
            <button className="pw-toggle" onClick={() => setShow2(!show2)} tabIndex={-1}>{show2 ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          <Btn loading={s3} done={d3} icon={<Lock size={15} />} text="Cambiar contraseña" doneText="Actualizada" onClick={changePassword} disabled={!newPass} />
        </div>
      </div>
    </>
  );
}

function NotificationsView({ onBack }) {
  const [emailNotif, setEmailNotif] = useState(() => localStorage.getItem("notif-email") !== "false");
  const [appNotif, setAppNotif] = useState(() => localStorage.getItem("notif-app") !== "false");
  const [reminders, setReminders] = useState(() => localStorage.getItem("notif-reminder") !== "false");
  const [sound, setSound] = useState(() => localStorage.getItem("notif-sound") === "true");

  useEffect(() => {
    localStorage.setItem("notif-email", emailNotif);
    localStorage.setItem("notif-app", appNotif);
    localStorage.setItem("notif-reminder", reminders);
    localStorage.setItem("notif-sound", sound);
  }, [emailNotif, appNotif, reminders, sound]);

  return (
    <>
      <div className="aside-top-bar">
        <button className="aside-top-back" onClick={onBack} aria-label="Volver"><ChevronLeft size={18} /></button>
        <span className="aside-top-title">Notificaciones</span>
        <div style={{ width: 34 }} />
      </div>
      <div className="aside-body">
        <div className="aside-group">
          <div className="aside-group-title"><BellRing size={15} /> Preferencias</div>
          <Toggle value={emailNotif} onChange={setEmailNotif} label="Notificaciones por email" />
          <Toggle value={appNotif} onChange={setAppNotif} label="Notificaciones en la app" />
          <Toggle value={sound} onChange={setSound} label="Sonido al recibir notificación" />
        </div>
        <div className="aside-group">
          <div className="aside-group-title"><Bell size={15} /> Recordatorios</div>
          <Toggle value={reminders} onChange={setReminders} label="Recordatorio de citas próximas" />
          <div className="aside-hint">Te avisaremos 24h antes de cada cita agendada</div>
        </div>
      </div>
    </>
  );
}

function CustomizeView({ onBack }) {
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("font-size") || "medium");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent-color") || "#39A900");

  useEffect(() => {
    localStorage.setItem("font-size", fontSize);
    document.documentElement.style.setProperty("--text-scale", fontSize === "small" ? "0.9" : fontSize === "large" ? "1.1" : "1");
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("accent-color", accent);
    document.documentElement.style.setProperty("--sena-green", accent);
  }, [accent]);

  return (
    <>
      <div className="aside-top-bar">
        <button className="aside-top-back" onClick={onBack} aria-label="Volver"><ChevronLeft size={18} /></button>
        <span className="aside-top-title">Personalizar</span>
        <div style={{ width: 34 }} />
      </div>
      <div className="aside-body">
        <div className="aside-group">
          <div className="aside-group-title"><Type size={15} /> Tamaño de fuente</div>
          <div className="radio-group">
            {["small", "medium", "large"].map((s) => (
              <button
                key={s}
                className={`radio-btn${fontSize === s ? " active" : ""}`}
                onClick={() => setFontSize(s)}
              >
                {s === "small" ? "Pequeño" : s === "medium" ? "Mediano" : "Grande"}
              </button>
            ))}
          </div>
        </div>
        <div className="aside-group">
          <div className="aside-group-title"><PaintBucket size={15} /> Color de acento</div>
          <div className="color-group">
            {ACCENTS.map((c) => (
              <button
                key={c.value}
                className={`color-btn${accent === c.value ? " active" : ""}`}
                style={{ background: c.value }}
                onClick={() => setAccent(c.value)}
                title={c.name}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>
        <div className="aside-group">
          <div className="aside-group-title"><Monitor size={15} /> Vista</div>
          <div className="radio-group">
            <button className="radio-btn active">Predeterminado</button>
          </div>
        </div>
      </div>
    </>
  );
}
