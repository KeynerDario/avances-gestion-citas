import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppointmentRepository } from "./appointments.repository";
import { logAuditAction } from "../../../shared/api/audit";

vi.mock("../../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
  enqueue: vi.fn((fn) => fn()),
}));

vi.mock("../../../shared/api/audit", () => ({
  logAuditAction: vi.fn(),
}));

const { supabase } = await import("../../../lib/supabase");

const mockAppointment = {
  id: "123",
  user_id: "user-1",
  dependency_id: "dep-1",
  professional_id: "prof-1",
  scheduled_date: "2025-01-15",
  scheduled_time: "10:00",
  status: "pending",
  reason: "Consulta general",
};

const mockEnrichedAppointment = {
  ...mockAppointment,
  dependencies: { name: "Odontología", color: "#FF5733" },
  profiles: { full_name: "Juan Pérez", document_number: "12345678" },
  professional: { full_name: "Dr. Carlos López" },
};

describe("AppointmentRepository", () => {
  let mockQuery;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn((resolve) => resolve({ data: [], error: null })),
    };
    supabase.from.mockReturnValue(mockQuery);
  });

  describe("create", () => {
    it("should create an appointment successfully", async () => {
      mockQuery.single.mockResolvedValue({
        data: mockAppointment,
        error: null,
      });

      const enrichSpy = vi
        .spyOn(AppointmentRepository, "enrichAppointment")
        .mockResolvedValue(mockEnrichedAppointment);

      const result = await AppointmentRepository.create(
        {
          dependency_id: "dep-1",
          professional_id: "prof-1",
          scheduled_date: "2025-01-15",
          scheduled_time: "10:00",
          reason: "Consulta general",
        },
        "user-1"
      );

      expect(supabase.from).toHaveBeenCalledWith("appointments");
      expect(mockQuery.insert).toHaveBeenCalled();
      expect(logAuditAction).toHaveBeenCalledWith({
        userId: "user-1",
        action: "CREATE_APPOINTMENT",
        entityType: "appointment",
        entityId: "123",
        newData: expect.objectContaining({
          dependency_id: "dep-1",
        }),
      });
      expect(result).toEqual(mockEnrichedAppointment);
      enrichSpy.mockRestore();
    });

    it("should throw error when creation fails", async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      await expect(
        AppointmentRepository.create(
          { dependency_id: "dep-1" },
          "user-1"
        )
      ).rejects.toThrow("Error creando cita: Database error");
    });
  });

  describe("fetch", () => {
    it("should fetch appointments with filters", async () => {
      mockQuery.then = vi.fn((resolve) =>
        resolve({ data: [mockAppointment], error: null })
      );

      const enrichSpy = vi
        .spyOn(AppointmentRepository, "enrichAppointment")
        .mockResolvedValue(mockEnrichedAppointment);

      const result = await AppointmentRepository.fetch({
        userId: "user-1",
        status: "pending",
      });

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "pending");
      expect(result).toHaveLength(1);
      enrichSpy.mockRestore();
    });

    it("should throw error when fetch fails", async () => {
      mockQuery.then = vi.fn((resolve) =>
        resolve({ data: null, error: { message: "Fetch error" } })
      );

      await expect(
        AppointmentRepository.fetch({ userId: "user-1" })
      ).rejects.toThrow("Error fetching citas: Fetch error");
    });
  });

  describe("checkAvailability", () => {
    it("should return true when slot is available", async () => {
      mockQuery.then = vi.fn((resolve) =>
        resolve({ data: [], error: null })
      );

      const result = await AppointmentRepository.checkAvailability(
        "dep-1",
        "2025-01-15",
        "10:00"
      );

      expect(result).toBe(true);
    });

    it("should return false when slot is occupied", async () => {
      mockQuery.then = vi.fn((resolve) =>
        resolve({ data: [{ id: "existing" }], error: null })
      );

      const result = await AppointmentRepository.checkAvailability(
        "dep-1",
        "2025-01-15",
        "10:00"
      );

      expect(result).toBe(false);
    });
  });

  describe("countPending", () => {
    it("should return pending count for user", async () => {
      mockQuery.then = vi.fn((resolve) =>
        resolve({ count: 2, error: null })
      );

      const result = await AppointmentRepository.countPending("user-1");

      expect(result).toBe(2);
    });
  });
});
