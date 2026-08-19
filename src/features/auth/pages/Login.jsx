import { useState } from "react";
import { useAuth } from "../../../providers/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff, ClipboardList, Stethoscope, BarChart3, ArrowRight, Shield, Check } from "lucide-react";
import logoSena from "../../../assets/logo-sena-verde.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const { signIn, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.success) navigate("/");
  };

  return (
    <div className="auth-page">
      <a href="#login-form" className="skip-link">Saltar al formulario</a>

      {/* LEFT — Branding */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Shield size={38} strokeWidth={1.5} />
            </div>
            <h1>SENA Bienestar</h1>
            <p className="auth-brand-desc">
              Plataforma integral de gestión de citas para el bienestar de la comunidad SENA
            </p>

            <div className="auth-cards">
              {[
                { icon: ClipboardList, title: "Agenda tus citas", desc: "Reserva en cualquier momento" },
                { icon: Stethoscope, title: "Profesionales", desc: "Psicología, Enfermería y más" },
                { icon: BarChart3, title: "Seguimiento", desc: "Monitorea tu progreso" },
              ].map(({ icon: Icon, title, desc }) => (
                <div className="auth-feature-card" key={title}>
                  <div className="feature-icon"><Icon size={20} /></div>
                  <div>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                  <Check size={14} className="feature-check" />
                </div>
              ))}
            </div>

            <div className="auth-brand-footer">
              Plataforma institucional SENA — Servicio de Bienestar
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">
            <img src={logoSena} alt="Logo SENA" className="auth-logo-img" />
          </div>

          <h2>Bienvenido de vuelta</h2>
          <p className="auth-subtitle">
            Ingresa tus credenciales para acceder al sistema
          </p>

          {error && (
            <div className="auth-error" role="alert" aria-live="polite">
              <span className="error-dot" />
              {error}
            </div>
          )}

          <form id="login-form" className="auth-form" onSubmit={handleSubmit}>
            <div className={`input-group ${focused === "email" ? "focused" : ""}`}>
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="email"
              />
            </div>

            <div className={`input-group ${focused === "password" ? "focused" : ""}`}>
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar" : "Mostrar"} tabIndex={-1}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="auth-options">
              <Link to="/forgot-password" className="auth-forgot">¿Olvidaste tu contraseña?</Link>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <><Loader2 className="spin" size={18} /> Entrando...</>
              ) : (
                <>Iniciar Sesión <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>o</span></div>

          <p className="auth-footer">
            ¿No tienes cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
