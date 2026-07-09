import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayAgenda } from "../DayAgenda";

const mockAppointments = [
  {
    id: "a1",
    scheduled_time: "08:00",
    status: "confirmed",
    profiles: { full_name: "Juan Pérez" },
    reason: "Control general",
  },
  {
    id: "a2",
    scheduled_time: "09:00",
    status: "pending",
    profiles: { full_name: "María Gómez" },
    reason: "Dolor de cabeza",
  },
];

describe("DayAgenda", () => {
  const defaultProps = {
    appointments: mockAppointments,
    selectedDate: "2025-06-15",
    onDateChange: vi.fn(),
    onConfirm: vi.fn(),
    onComplete: vi.fn(),
    onNoShow: vi.fn(),
    onAddNote: vi.fn(),
    isLoading: false,
  };

  it("should render the agenda with appointments", () => {
    render(<DayAgenda {...defaultProps} />);

    expect(screen.getByText("Juan Pérez")).toBeDefined();
    expect(screen.getByText("María Gómez")).toBeDefined();
    expect(screen.getByText("08:00")).toBeDefined();
    expect(screen.getByText("09:00")).toBeDefined();
  });

  it("should show date with day name", () => {
    render(<DayAgenda {...defaultProps} />);

    expect(screen.getByText(/Domingo/)).toBeDefined();
    expect(screen.getByText(/15\/06\/2025/)).toBeDefined();
  });

  it("should show loading state", () => {
    render(<DayAgenda {...defaultProps} isLoading={true} appointments={[]} />);

    expect(screen.getByText("Cargando agenda...")).toBeDefined();
  });

  it("should show empty state when no appointments", () => {
    render(<DayAgenda {...defaultProps} appointments={[]} />);

    expect(screen.getByText("Sin citas este día")).toBeDefined();
  });

  it("should show empty slots as Disponible", () => {
    render(<DayAgenda {...defaultProps} />);

    const disponibles = screen.getAllByText("Disponible");
    expect(disponibles.length).toBeGreaterThan(0);
  });

  it("should call onConfirm when confirm button clicked", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(<DayAgenda {...defaultProps} onConfirm={onConfirm} />);

    const confirmButtons = screen.getAllByText("Confirmar");
    await user.click(confirmButtons[0]);

    expect(onConfirm).toHaveBeenCalledWith("a2");
  });

  it("should call onNoShow when no-show button clicked", async () => {
    const onNoShow = vi.fn();
    const user = userEvent.setup();

    render(<DayAgenda {...defaultProps} onNoShow={onNoShow} />);

    const noShowButtons = screen.getAllByText("No asistió");
    await user.click(noShowButtons[0]);

    expect(onNoShow).toHaveBeenCalledWith("a2");
  });

  it("should show complete and note buttons for confirmed appointments", () => {
    render(<DayAgenda {...defaultProps} />);

    expect(screen.getByText("Completar")).toBeDefined();
    expect(screen.getByText("Nota")).toBeDefined();
  });

  it("should call onComplete when complete button clicked", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();

    render(<DayAgenda {...defaultProps} onComplete={onComplete} />);

    await user.click(screen.getByText("Completar"));
    expect(onComplete).toHaveBeenCalledWith("a1");
  });

  it("should have navigation buttons", () => {
    render(<DayAgenda {...defaultProps} />);

    expect(screen.getByTitle("Día anterior")).toBeDefined();
    expect(screen.getByTitle("Día siguiente")).toBeDefined();
    expect(screen.getByText("Hoy")).toBeDefined();
  });

  it("should call onDateChange when navigating", async () => {
    const onDateChange = vi.fn();
    const user = userEvent.setup();

    render(<DayAgenda {...defaultProps} onDateChange={onDateChange} />);

    await user.click(screen.getByTitle("Día siguiente"));
    expect(onDateChange).toHaveBeenCalled();

    await user.click(screen.getByTitle("Día anterior"));
    expect(onDateChange).toHaveBeenCalledTimes(2);
  });
});