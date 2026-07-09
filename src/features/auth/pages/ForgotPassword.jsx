import { useState } from "react";
import { useAuth } from "../../../providers/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, Shield, Send, Lock } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);
  const { resetPassword, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    if (result.success) {
      setSent(true);
    }
  };

  return (
    <div className="auth-page">
      <a href="#forgot-form" className="skip-link">Saltar al formulario</a>
      <div className="auth-left">
        <div className="auth-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>

        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Shield size={36} strokeWidth={1.5} />
          </div>
          <h1>SENA Bienestar</h1>
          <p className="auth-brand-desc">
            Recupera el acceso a tu cuenta de forma segura
          </p>

          <div className="auth-cards">
            <div className="auth-feature-card">
              <div className="feature-icon"><Lock size={22} /></div>
              <div>
                <strong>Seguro y rápido</strong>
                <span>Protegemos tu información</span>
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="feature-icon"><Mail size={22} /></div>
              <div>
                <strong>Por correo</strong>
                <span>Recibirás un enlace de recuperación</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {!sent ? (
            <>
              <div className="auth-logo">
                <div className="logo-icon">S</div>
              </div>

              <h2>¿Olvidaste tu contraseña?</h2>
              <p className="auth-subtitle">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
              </p>

              {error && (
                <div className="auth-error" role="alert" aria-live="polite">
                  <span className="error-dot" />
                  {error}
                </div>
              )}

              <form id="forgot-form" className="auth-form" onSubmit={handleSubmit}>
                <div className={`input-group ${focused ? "focused" : ""}`}>
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="spin" size={18} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar enlace de recuperación
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="reset-success">
              <div className="reset-success-icon">
                <CheckCircle size={48} />
              </div>
              <h2>¡Correo enviado!</h2>
              <p className="auth-subtitle">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
              <div className="reset-tips">
                <p>¿No lo ves?</p>
                <ul>
                  <li>Revisa la carpeta de spam o correo no deseado</li>
                  <li>Verifica que el correo sea correcto</li>
                  <li>Espera unos minutos y revisa de nuevo</li>
                </ul>
              </div>
              <button className="btn-login" onClick={() => navigate("/login")}>
                <ArrowLeft size={18} />
                Volver al inicio de sesión
              </button>
            </div>
          )}

          <div className="auth-divider">
            <span>o</span>
          </div>

          <p className="auth-footer">
            <Link to="/login" className="auth-link">
              <ArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
