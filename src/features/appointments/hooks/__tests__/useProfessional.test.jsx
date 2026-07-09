import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProfessional } from "../useProfessional";
import { AuthContext } from "../../../../providers/AuthContext";
import { ProfessionalRepository } from "../../api/professional.repository";
import { AppointmentRepository } from "../../api/appointments.repository";
import { toast } from "sonner";

vi.mock("../../api/professional.repository");
vi.mock("../../api/appointments.repository");
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUser = { id: "prof-1" };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ user: mockUser }}>
    {children}
  </AuthContext.Provider>
);

describe("useProfessional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useProfessional(), { wrapper });
    expect(result.current.schedules).toEqual([]);
    expect(result.current.dayAppointments).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.notes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch schedules successfully", async () => {
    const mockSchedules = [
      { id: "s1", day_of_week: 1, start_time: "08:00", end_time: "12:00", is_active: true },
    ];
    ProfessionalRepository.getSchedules.mockResolvedValue(mockSchedules);

    const { result } = renderHook(() => useProfessional(), { wrapper });

    await act(async () => {
      await result.current.fetchSchedules();
    });

    expect(result.current.schedules).toEqual(mockSchedules);
    expect(ProfessionalRepository.getSchedules).toHaveBeenCalledWith("prof-1");
  });

  it("should handle fetch schedules error gracefully", async () => {
    ProfessionalRepository.getSchedules.mockRejectedValue(new Error("DB error"));

    const { result } = renderHook(() => useProfessional(), { wrapper });

    await act(async () => {
      await result.current.fetchSchedules();
    });

    expect(result.current.schedules).toEqual([]);
  });

  it("should save schedule and refresh list", async () => {
    ProfessionalRepository.upsertSchedule.mockResolvedValue({ id: "s1" });
    ProfessionalRepository.getSchedules.mockResolvedValue([{ id: "s1" }]);

    const { result } = renderHook(() => useProfessional(), { wrapper });

    let saved;
    await act(async () => {
      saved = await result.current.saveSchedule({
        day_of_week: 1,
        start_time: "08:00",
        end_time: "12:00",
      });
    });

    expect(saved).toBe(true);
    expect(ProfessionalRepository.upsertSchedule).toHaveBeenCalledWith(
      { day_of_week: 1, start_time: "08:00", end_time: "12:00", professional_id: "prof-1" },
      "prof-1"
    );
    expect(toast.success).toHaveBeenCalledWith("Horario guardado");
  });

  it("should fetch day agenda", async () => {
    const mockAgenda = [{ id: "a1", status: "pending" }];
    ProfessionalRepository.getDayAgenda.mockResolvedValue(mockAgenda);

    const { result } = renderHook(() => useProfessional(), { wrapper });

    await act(async () => {
      await result.current.fetchDayAgenda("2025-06-15");
    });

    expect(result.current.dayAppointments).toEqual(mockAgenda);
    expect(ProfessionalRepository.getDayAgenda).toHaveBeenCalledWith("prof-1", "2025-06-15");
  });

  it("should fetch professional stats", async () => {
    const mockStats = {
      totalAppointments: 50,
      monthAppointments: 10,
      monthCompleted: 8,
      attendanceRate: 80,
    };
    ProfessionalRepository.getProfessionalStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useProfessional(), { wrapper });

    await act(async () => {
      await result.current.fetchStats();
    });

    expect(result.current.stats).toEqual(mockStats);
  });

  it("should create a clinical note", async () => {
    const mockNote = { id: "n1", content: "Paciente evoluciona bien" };
    ProfessionalRepository.createNote.mockResolvedValue(mockNote);

    const { result } = renderHook(() => useProfessional(), { wrapper });

    let note;
    await act(async () => {
      note = await result.current.createNote("a1", "Paciente evoluciona bien");
    });

    expect(note).toEqual(mockNote);
    expect(ProfessionalRepository.createNote).toHaveBeenCalledWith(
      { appointment_id: "a1", professional_id: "prof-1", content: "Paciente evoluciona bien" },
      "prof-1"
    );
    expect(toast.success).toHaveBeenCalledWith("Nota guardada");
  });

  it("should update appointment status", async () => {
    const mockUpdated = { id: "a1", status: "confirmed" };
    AppointmentRepository.update.mockResolvedValue(mockUpdated);

    const { result } = renderHook(() => useProfessional(), { wrapper });

    let updated;
    await act(async () => {
      updated = await result.current.updateAppointmentStatus("a1", "confirmed");
    });

    expect(updated).toEqual(mockUpdated);
    expect(AppointmentRepository.update).toHaveBeenCalledWith(
      "a1", { status: "confirmed" }, "prof-1"
    );
    expect(toast.success).toHaveBeenCalledWith("Cita confirmada");
  });
});