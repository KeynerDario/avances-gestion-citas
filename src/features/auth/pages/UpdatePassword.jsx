import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { Lock, Loader2, Eye, EyeOff, CheckCircle, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "PASSWORD_RECOVERY") {
        navigate("/login", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      toast.error("Error al actualizar contraseña");
      return;
    }

    setDone(true);
    toast.success("Contraseña actualizada correctamente");
    setTimeout(() => navigate("/login"), 3000);
  };

  return (
    <div className="auth-page">
      <a href="#update-form" className="skip-link">Saltar al formulario</a>
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
          <p className="auth-brand-desc">Restablece tu contraseña de forma segura</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-icon">S</div>
          </div>

          {done ? (
            <div className="reset-success">
              <div className="reset-success-icon">
                <CheckCircle size={48} />
              </div>
              <h2>Contraseña actualizada</h2>
              <p className="auth-subtitle">
                Tu contraseña se ha restablecido correctamente. Serás redirigido al inicio de sesión.
              </p>
              <Link to="/login" className="btn-login" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <ArrowLeft size={18} />
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2>Nueva contraseña</h2>
              <p className="auth-subtitle">Ingresa tu nueva contraseña para restablecer el acceso</p>

              {error && (
                <div className="auth-error" role="alert" aria-live="polite">
                  <span className="error-dot" />
                  {error}
                </div>
              )}

              <form id="update-form" className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="input-group">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle size={18} className="input-icon-right" style={{ color: "#10b981" }} />
                  )}
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="spin" size={18} />
                      Actualizando...
                    </>
                  ) : (
                    "Restablecer contraseña"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
