import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="58" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="8 4" />
            <path d="M60 25 L65 45 L85 45 L70 57 L75 77 L60 65 L45 77 L50 57 L35 45 L55 45 Z" fill="var(--sena-green-light)" stroke="var(--sena-green)" strokeWidth="2" />
            <circle cx="45" cy="85" r="4" fill="var(--color-warning)" />
            <circle cx="75" cy="90" r="3" fill="var(--color-info)" />
            <circle cx="85" cy="75" r="2.5" fill="var(--color-success)" />
          </svg>
        </div>
        
        <div className="not-found-code">404</div>
        
        <h1 className="not-found-title">Parece que te perdiste</h1>
        
        <p className="not-found-description">
          La página que buscas no existe o fue movida a otro lugar.
          No te preocupes, podemos ayudarte a volver al camino.
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
        
        <div className="not-found-tips">
          <p>O prueba estas opciones:</p>
          <ul>
            <li>Verifica que la URL esté correcta</li>
            <li>Usa el menú de navegación</li>
            <li>Presiona <kbd>Ctrl</kbd> + <kbd>K</kbd> para buscar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
