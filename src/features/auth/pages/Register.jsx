import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../providers/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import {
  Mail, Lock, User, CreditCard, Loader2, Eye, EyeOff,
  UserPlus, CheckCircle, GraduationCap, Briefcase, Users, Info, Shield,
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    document_number: "",
    role: "APRENDIZ",
    dependency_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [dependencies, setDependencies] = useState([]);

  const { signUp, error: authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("dependencies").select("*").order("name").then(({ data }) => {
      setDependencies(data || []);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.role === "PROFESIONAL" && !formData.dependency_id) {
      setValidationError("Selecciona una dependencia");
      return;
    }

    if (!/^\d{6,12}$/.test(formData.document_number)) {
      setValidationError("El número de documento debe tener entre 6 y 12 dígitos");
      return;
    }

    setLoading(true);
    const result = await signUp(formData.email, formData.password, {
      full_name: formData.full_name,
      document_number: formData.document_number,
      role: formData.role,
      dependency_id: formData.dependency_id || null,
    });
    setLoading(false);

    if (result.success) {
      toast.success("¡Registro exitoso! Ya puedes iniciar sesión.");
      navigate("/login");
    }
  };

  const errorMessage = validationError || authError;

  const passwordStrength = formData.password.length === 0 ? 0 :
    formData.password.length < 4 ? 1 :
    formData.password.length < 6 ? 2 :
    formData.password.length < 8 ? 3 : 4;

  const strengthLabels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  return (
    <div className="auth-page">
      <a href="#register-form" className="skip-link">Saltar al formulario</a>

      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <UserPlus size={36} strokeWidth={1.5} />
            </div>
            <h1>SENA Bienestar</h1>
            <p className="auth-brand-desc">
              Únete y agenda tus citas de bienestar
            </p>

            <div className="auth-cards">
              <div className="auth-feature-card">
                <div className="feature-icon"><UserPlus size={20} /></div>
                <div>
                  <strong>Rápido y fácil</strong>
                  <span>Regístrate en segundos</span>
                </div>
              </div>
              <div className="auth-feature-card">
                <div className="feature-icon"><CheckCircle size={20} /></div>
                <div>
                  <strong>Sin costos</strong>
                  <span>Servicio gratuito SENA</span>
                </div>
              </div>
              <div className="auth-feature-card">
                <div className="feature-icon"><Lock size={20} /></div>
                <div>
                  <strong>Datos seguros</strong>
                  <span>Protegemos tu información</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-card auth-card-wide">
          <div className="auth-logo">
            <div className="logo-icon">S</div>
          </div>

          <h2>Crear Cuenta</h2>
          <p className="auth-subtitle">
            Completa tus datos para registrarte en la plataforma
          </p>

          {errorMessage && (
            <div className="auth-error" role="alert" aria-live="polite">
              <span className="error-dot" />
              {errorMessage}
            </div>
          )}

          <form id="register-form" className="auth-form" onSubmit={handleSubmit}>
            <div className={`input-group ${focused === "name" ? "focused" : ""}`}>
              <User size={18} className="input-icon" />
              <input
                type="text"
                name="full_name"
                placeholder="Nombre completo"
                value={formData.full_name}
                onChange={handleChange}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="name"
              />
            </div>

            <div className={`input-group ${focused === "doc" ? "focused" : ""}`}>
              <CreditCard size={18} className="input-icon" />
              <input
                type="text"
                name="document_number"
                placeholder="Número de documento"
                value={formData.document_number}
                onChange={handleChange}
                onFocus={() => setFocused("doc")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="off"
              />
            </div>

            <div className="role-selector">
              <label className="role-label">
                <User size={16} />
                ¿Cómo te identificas?
              </label>
              <div className="role-options">
                <label className={`role-option ${formData.role === "APRENDIZ" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value="APRENDIZ"
                    checked={formData.role === "APRENDIZ"}
                    onChange={handleChange}
                  />
                  <div className="role-card">
                    <GraduationCap size={24} />
                    <span className="role-name">Aprendiz</span>
                    <span className="role-desc">Estudiante</span>
                  </div>
                </label>
                <label className={`role-option ${formData.role === "PROFESIONAL" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value="PROFESIONAL"
                    checked={formData.role === "PROFESIONAL"}
                    onChange={handleChange}
                  />
                  <div className="role-card">
                    <Briefcase size={24} />
                    <span className="role-name">Profesional</span>
                    <span className="role-desc">Del área de salud</span>
                  </div>
                </label>
                <label className={`role-option ${formData.role === "COORDINACION" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value="COORDINACION"
                    checked={formData.role === "COORDINACION"}
                    onChange={handleChange}
                  />
                  <div className="role-card">
                    <Users size={24} />
                    <span className="role-name">Coordinación</span>
                    <span className="role-desc">Coord. dependencia</span>
                  </div>
                </label>
              </div>

              {formData.role === "PROFESIONAL" && (
                <div className="dependency-selector">
                  <label className="role-label">
                    <Briefcase size={16} />
                    Selecciona tu dependencia
                  </label>
                  <div className="dependency-options">
                    {dependencies.length > 0 ? dependencies.map((dep) => (
                      <label key={dep.id} className={`dependency-option ${formData.dependency_id === String(dep.id) ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="dependency_id"
                          value={String(dep.id)}
                          checked={formData.dependency_id === String(dep.id)}
                          onChange={handleChange}
                        />
                        <div className="dependency-card">
                          <span className="dependency-dot" style={{ background: dep.color || "#6b7280" }} />
                          <span className="dependency-name">{dep.name}</span>
                        </div>
                      </label>
                    )) : (
                      <p className="text-muted">Cargando dependencias...</p>
                    )}
                  </div>
                </div>
              )}

              {formData.role !== "APRENDIZ" && (
                <div className="role-notice">
                  <Info size={16} />
                  <span>Tu cuenta será revisada por un administrador antes de ser activada.</span>
                </div>
              )}
            </div>

            <div className={`input-group ${focused === "email" ? "focused" : ""}`}>
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="email"
              />
            </div>

            <div className={`input-group ${focused === "pass" ? "focused" : ""}`}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
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

            {formData.password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="strength-bar"
                      style={{
                        background: i <= passwordStrength ? strengthColors[passwordStrength] : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strengthColors[passwordStrength] }}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}

            <div className={`input-group ${focused === "confirm" ? "focused" : ""}`}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocused("confirm")}
                onBlur={() => setFocused(null)}
                required
                autoComplete="new-password"
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <CheckCircle size={18} className="input-icon-right" style={{ color: "#10b981" }} />
              )}
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spin" size={18} />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <p className="auth-footer">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="auth-link">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
