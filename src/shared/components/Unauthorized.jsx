import { Link } from "react-router-dom";
import { ShieldOff, Home, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon unauthorized-icon">
          <ShieldOff size={80} strokeWidth={1.5} />
        </div>
        
        <div className="not-found-code">403</div>
        
        <h1 className="not-found-title">Acceso Denegado</h1>
        
        <p className="not-found-description">
          No tienes permisos para acceder a esta página.
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>
        
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={18} />
            Volver al Inicio
          </Link>
          <button 
            className="btn btn-secondary"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} />
            Volver Atrás
          </button>
        </div>
      </div>
    </div>
  );
}
