import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, className = "" }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const content = contentRef.current;
    if (!content) return;

    content.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = content.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    content.addEventListener("keydown", handleKeyDown);
    return () => content.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={contentRef}
        className={`modal-content ${className}`}
        tabIndex={-1}
      >
        {title && (
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
