import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "../Modal";

describe("Modal", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("should not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not call onClose when content is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <button>Inside content</button>
      </Modal>
    );

    fireEvent.click(screen.getByText("Inside content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should call onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const modalContent = document.querySelector(".modal-content");
    fireEvent.keyDown(modalContent, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should set body overflow to hidden when open", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should reset body overflow when closed", () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
    
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("should have aria-modal attribute", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("should apply custom className", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" className="custom-modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole("dialog").querySelector(".modal-content")).toHaveClass("custom-modal");
  });
});
