import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";
import { useState } from "react";

const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

function ConditionalThrower({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>Normal content</div>;
}

function WrapperWithState() {
  const [shouldThrow, setShouldThrow] = useState(true);
  return (
    <>
      <button onClick={() => setShouldThrow(false)}>Fix error</button>
      <ErrorBoundary>
        <ConditionalThrower shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </>
  );
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  it("should render children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <ConditionalThrower shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("should render error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ConditionalThrower shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should display default message when error has no message", () => {
    const NoMessageError = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <NoMessageError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Ocurrió un error inesperado")).toBeInTheDocument();
  });

  it("should call componentDidCatch and log error", () => {
    render(
      <ErrorBoundary>
        <ConditionalThrower shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should reset error state when 'Intentar de nuevo' is clicked", () => {
    render(<WrapperWithState />);

    // Initially throws, showing error UI
    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();

    // Fix the underlying issue first
    fireEvent.click(screen.getByText("Fix error"));

    // Now click reset - since child no longer throws, it should show normal content
    fireEvent.click(screen.getByText("Intentar de nuevo"));

    expect(screen.getByText("Normal content")).toBeInTheDocument();
    expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
  });

  it("should have correct structure", () => {
    render(
      <ErrorBoundary>
        <ConditionalThrower shouldThrow={true} />
      </ErrorBoundary>
    );
    const errorDiv = screen.getByText("Algo salió mal").closest(".error-boundary");
    expect(errorDiv).toBeInTheDocument();
  });
});
