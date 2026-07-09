import { Modal } from "./Modal";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", variant = "danger" }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirm-modal-body">
        <div className={`confirm-icon ${variant}`}>
          {variant === "danger" ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className={`btn-${variant}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
