import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfirmModal } from "../ConfirmModal";

describe("ConfirmModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
  };

  it("should render when isOpen is true", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to proceed?")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Confirm Action")).not.toBeInTheDocument();
  });

  it("should render default button labels", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("should render custom button labels", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
      />
    );
    expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    expect(screen.getByText("No, keep")).toBeInTheDocument();
  });

  it("should call onConfirm and onClose when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    
    render(
      <ConfirmModal
        {...defaultProps}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    screen.getByText("Confirmar").click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    
    render(
      <ConfirmModal
        {...defaultProps}
        onClose={onClose}
      />
    );

    screen.getByText("Cancelar").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should render danger variant by default", () => {
    render(<ConfirmModal {...defaultProps} />);
    // Modal uses createPortal, so query from document.body
    const icon = document.querySelector(".confirm-icon");
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass("danger");
  });

  it("should render success variant when specified", () => {
    render(<ConfirmModal {...defaultProps} variant="success" />);
    const icon = document.querySelector(".confirm-icon");
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass("success");
  });
});
