import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <AlertTriangle size={48} className="error-icon" />
            <h2>Algo salió mal</h2>
            <p className="error-message">
              {this.state.error?.message || "Ocurrió un error inesperado"}
            </p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={this.handleReset}>
                <RefreshCw size={18} />
                Intentar de nuevo
              </button>
              <button className="btn btn-secondary" onClick={this.handleReload}>
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}