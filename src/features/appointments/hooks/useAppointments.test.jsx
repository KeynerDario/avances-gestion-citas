import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppointments } from "./useAppointments";
import { AuthContext } from "../../../providers/AuthContext";
import { AppointmentRepository } from "../api/appointments.repository";
import { toast } from "sonner";

vi.mock("../api/appointments.repository");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUser = { id: "user-1" };
const mockProfile = { dependency_id: "dep-1", roles: { name: "APRENDIZ" } };

const wrapper = ({ children }) => (
  <AuthContext.Provider
    value={{
      user: mockUser,
      profile: mockProfile,
      isAprendiz: () => true,
      isProfessional: () => false,
      isCoordination: () => false,
      isAdmin: () => false,
    }}
  >
    {children}
  </AuthContext.Provider>
);

describe("useAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    expect(result.current.appointments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should fetch appointments successfully", async () => {
    const mockAppointments = [
      { id: "1", status: "pending" },
      { id: "2", status: "confirmed" },
    ];

    AppointmentRepository.fetch.mockResolvedValue(mockAppointments);

    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await result.current.fetchAppointments();
    });

    expect(result.current.appointments).toEqual(mockAppointments);
    expect(AppointmentRepository.fetch).toHaveBeenCalledWith({
      userId: "user-1",
    });
  });

  it("should create appointment successfully", async () => {
    const newAppointment = {
      id: "3",
      status: "pending",
      scheduled_date: "2025-01-15",
    };

    AppointmentRepository.countPending.mockResolvedValue(1);
    AppointmentRepository.checkAvailability.mockResolvedValue(true);
    AppointmentRepository.create.mockResolvedValue(newAppointment);

    const { result } = renderHook(() => useAppointments(), { wrapper });

    let createResult;
    await act(async () => {
      createResult = await result.current.createAppointment({
        dependency_id: "dep-1",
        scheduled_date: "2025-01-15",
        scheduled_time: "10:00",
      });
    });

    expect(createResult.success).toBe(true);
    expect(result.current.appointments).toContain(newAppointment);
    expect(toast.success).toHaveBeenCalledWith("Cita agendada correctamente");
  });

  it("should reject creation when max pending appointments reached", async () => {
    AppointmentRepository.countPending.mockResolvedValue(2);

    const { result } = renderHook(() => useAppointments(), { wrapper });

    let createResult;
    await act(async () => {
      createResult = await result.current.createAppointment({
        dependency_id: "dep-1",
        scheduled_date: "2025-01-15",
        scheduled_time: "10:00",
      });
    });

    expect(createResult.success).toBe(false);
    expect(createResult.error).toContain("2 citas pendientes");
    expect(toast.error).toHaveBeenCalled();
  });

  it("should cancel pending appointment", async () => {
    const pendingAppointment = { id: "1", status: "pending" };
    const updatedAppointment = { id: "1", status: "cancelled" };

    AppointmentRepository.fetch.mockResolvedValue([pendingAppointment]);
    AppointmentRepository.update.mockResolvedValue(updatedAppointment);

    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await result.current.fetchAppointments();
    });

    await act(async () => {
      await result.current.cancelAppointment("1");
    });

    expect(AppointmentRepository.update).toHaveBeenCalledWith(
      "1",
      { status: "cancelled" },
      "user-1"
    );
  });

  it("should not cancel non-pending appointment", async () => {
    const confirmedAppointment = { id: "1", status: "confirmed" };

    AppointmentRepository.fetch.mockResolvedValue([confirmedAppointment]);

    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await result.current.fetchAppointments();
    });

    await act(async () => {
      await result.current.cancelAppointment("1");
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Solo puedes cancelar citas pendientes"
    );
    expect(AppointmentRepository.update).not.toHaveBeenCalled();
  });
});
