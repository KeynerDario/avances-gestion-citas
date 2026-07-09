import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AppointmentForm } from "../AppointmentForm";
import { AuthContext } from "../../../../providers/AuthContext";
import { supabase } from "../../../../lib/supabase";
import { useAppointments } from "../../hooks/useAppointments";

vi.mock("../../../../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

vi.mock("../../hooks/useAppointments", () => ({
  useAppointments: vi.fn(),
}));

const mockDependencies = [
  { id: 1, name: "Psicología", color: "#FF5733" },
  { id: 2, name: "Nutrición", color: "#33FF57" },
];

const mockQuery = {
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: mockDependencies, error: null }),
};

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ user: { id: "user-1" }, profile: { dependency_id: 1 }, isAprendiz: () => true }}>
    {children}
  </AuthContext.Provider>
);

/**
 * Set a value on a date input and trigger react-hook-form's onChange.
 * jsdom doesn't handle native date inputs well, so we use the native setter.
 */
function setDateValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, "value"
  ).set;
  nativeInputValueSetter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Set a value on a select and trigger react-hook-form's onChange.
 */
function setSelectValue(input, value) {
  const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype, "value"
  ).set;
  nativeSelectValueSetter.call(input, value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function getNextWeekday() {
  const d = new Date();
  d.setDate(d.getDate() + 2); // +2 to be safe across timezones
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split("T")[0];
}

describe("AppointmentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.from.mockReturnValue(mockQuery);
    useAppointments.mockReturnValue({
      createAppointment: vi.fn().mockResolvedValue({ success: true }),
      isCreating: false,
    });
  });

  it("should render the form with all fields", () => {
    render(<AppointmentForm onSuccess={vi.fn()} />, { wrapper });

    expect(screen.getByText("Dependencia")).toBeDefined();
    expect(screen.getByText("Fecha")).toBeDefined();
    expect(screen.getByText("Hora")).toBeDefined();
    expect(screen.getByText("Motivo de consulta")).toBeDefined();
    expect(screen.getByText("Solicitar Cita")).toBeDefined();
  });

  it("should load dependencies on mount", async () => {
    render(<AppointmentForm onSuccess={vi.fn()} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Psicología")).toBeDefined();
      expect(screen.getByText("Nutrición")).toBeDefined();
    });
  });

  it("should show validation error when submitting with empty data", async () => {
    useAppointments.mockReturnValue({
      createAppointment: vi.fn(),
      isCreating: false,
    });

    render(<AppointmentForm onSuccess={vi.fn()} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Psicología")).toBeDefined();
    });

    screen.getByText("Solicitar Cita").closest("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      const errors = screen.queryAllByText(/selecciona|debe ser|inválido/i);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it("should call createAppointment on submit with valid data", async () => {
    const createMock = vi.fn().mockResolvedValue({ success: true });
    useAppointments.mockReturnValue({
      createAppointment: createMock,
      isCreating: false,
    });

    const onSuccess = vi.fn();
    const { container } = render(<AppointmentForm onSuccess={onSuccess} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Psicología")).toBeDefined();
    });

    // Select dependency
    const depSelect = container.querySelector('select[name="dependency_id"]');
    setSelectValue(depSelect, "1");

    // Set date — use native setter to bypass jsdom quirks
    const dateInput = container.querySelector('input[type="date"]');
    const dateStr = getNextWeekday();
    setDateValue(dateInput, dateStr);

    // Time defaults to "08:00" — valid

    // Fill reason (min 10 chars)
    const textarea = screen.getByPlaceholderText(/describe brevemente/i);
    const nativeTextAreaSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    ).set;
    nativeTextAreaSetter.call(textarea, "Consulta general de bienestar");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));

    // Submit the form
    screen.getByText("Solicitar Cita").closest("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      expect(createMock).toHaveBeenCalled();
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dependency_id: 1,
          scheduled_date: dateStr,
          reason: "Consulta general de bienestar",
        })
      );
    });
  });

  it("should disable submit button while creating", () => {
    useAppointments.mockReturnValue({
      createAppointment: vi.fn(),
      isCreating: true,
    });

    render(<AppointmentForm onSuccess={vi.fn()} />, { wrapper });

    expect(screen.getByText("Agendando...")).toBeDefined();
  });
});
