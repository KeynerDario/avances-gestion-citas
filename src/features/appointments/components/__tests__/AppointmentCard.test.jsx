import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppointmentCard } from "../AppointmentCard";

const baseAppointment = {
  id: "apt-1",
  scheduled_date: "2025-06-15",
  scheduled_time: "10:00",
  status: "pending",
  reason: "Consulta general",
  dependencies: { name: "Psicología", color: "#FF5733" },
  profiles: { full_name: "Juan Pérez", document_number: "12345678" },
  professional: { full_name: "Dr. López" },
};

describe("AppointmentCard", () => {
  it("should render appointment details for aprendiz", () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        isAprendiz={true}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Psicología")).toBeDefined();
    expect(screen.getByText("Pendiente")).toBeDefined();
    expect(screen.getByText("10:00")).toBeDefined();
    expect(screen.getByText(/Motivo:/)).toBeDefined();
    expect(screen.getByText(/Consulta general/)).toBeDefined();
    expect(screen.getByText(/Dr\(a\)\. Dr. López/)).toBeDefined();
    expect(screen.getByText("Cancelar")).toBeDefined();
  });

  it("should show cancel button only for pending appointments (aprendiz)", () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        isAprendiz={true}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Cancelar")).toBeDefined();
  });

  it("should not show cancel button for non-pending appointments", () => {
    render(
      <AppointmentCard
        appointment={{ ...baseAppointment, status: "confirmed" }}
        isAprendiz={true}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText("Cancelar")).toBeNull();
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <AppointmentCard
        appointment={baseAppointment}
        isAprendiz={true}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("should show professional name with Dr(a). prefix for aprendiz", () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        isAprendiz={true}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Dr\(a\)\. Dr. López/)).toBeDefined();
  });

  it("should show profile name for professional view", () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        isAprendiz={false}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Juan Pérez")).toBeDefined();
  });

  it("should render with minimal data gracefully", () => {
    render(
      <AppointmentCard
        appointment={{ id: "apt-1", scheduled_date: "invalid-date", scheduled_time: "10:00", status: "pending" }}
        isAprendiz={true}
        onCancel={vi.fn()}
      />
    );

    // Should fallback to raw scheduled_date
    expect(screen.getByText("invalid-date")).toBeDefined();
    expect(screen.getByText("Sin dependencia")).toBeDefined();
  });

  it("should display correct status labels for different statuses", () => {
    const statuses = [
      { status: "pending", label: "Pendiente" },
      { status: "confirmed", label: "Confirmada" },
      { status: "completed", label: "Completada" },
      { status: "cancelled", label: "Cancelada" },
      { status: "no_show", label: "No asistió" },
    ];

    statuses.forEach(({ status, label }) => {
      const { unmount } = render(
        <AppointmentCard
          appointment={{ ...baseAppointment, status }}
          isAprendiz={true}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText(label)).toBeDefined();
      unmount();
    });
  });
});