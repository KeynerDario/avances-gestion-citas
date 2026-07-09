import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboard } from "../useDashboard";
import { DashboardRepository } from "../../dashboard.repository";
import { toast } from "sonner";

vi.mock("../../dashboard.repository");
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("useDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.kpis).toBeNull();
    expect(result.current.byDependency).toEqual([]);
    expect(result.current.monthlyTrend).toEqual([]);
    expect(result.current.professionals).toEqual([]);
    expect(result.current.summary).toEqual({ totalUsers: 0, totalDeps: 0, totalProf: 0 });
    expect(result.current.loading).toBe(false);
  });

  it("should fetch all metrics successfully", async () => {
    const mockKPIs = [{ total_appointments: 100, completed_appointments: 80, pending_appointments: 10, no_show_count: 5, avg_wait_days: 3 }];
    const mockByDep = [{ name: "Psicología", total: 50, completed: 40 }];
    const mockTrend = [{ month: "Ene", total: 20, completed: 15 }];
    const mockProfessionals = [{ id: "p1", name: "Dr. López", total: 30, completed: 25 }];

    DashboardRepository.getKPIs.mockResolvedValue(mockKPIs);
    DashboardRepository.getAppointmentsByDependency.mockResolvedValue(mockByDep);
    DashboardRepository.getMonthlyTrend.mockResolvedValue(mockTrend);
    DashboardRepository.getProfessionalPerformance.mockResolvedValue(mockProfessionals);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.fetchAllMetrics({
        from: "2025-06-01",
        to: "2025-06-30",
      });
    });

    expect(result.current.kpis).toEqual(mockKPIs[0]);
    expect(result.current.byDependency).toEqual(mockByDep);
    expect(result.current.monthlyTrend).toEqual(mockTrend);
    expect(result.current.professionals).toEqual(mockProfessionals);
    expect(result.current.loading).toBe(false);
  });

  it("should handle fetch error gracefully", async () => {
    DashboardRepository.getKPIs.mockRejectedValue(new Error("KPI error"));

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.fetchAllMetrics({ from: "2025-06-01", to: "2025-06-30" });
    });

    expect(toast.error).toHaveBeenCalledWith("Error cargando métricas");
    expect(result.current.loading).toBe(false);
  });

  it("should fetch summary", async () => {
    DashboardRepository.getSummary.mockResolvedValue({
      totalUsers: 50, totalDeps: 5, totalProf: 10,
    });

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.fetchSummary();
    });

    expect(result.current.summary).toEqual({ totalUsers: 50, totalDeps: 5, totalProf: 10 });
  });

  it("should export CSV successfully", async () => {
    const mockData = [
      {
        id: "1",
        scheduled_date: "2025-06-15",
        scheduled_time: "10:00",
        dependencies: { name: "Psicología" },
        professional: { full_name: "Dr. López" },
        status: "completed",
        reason: "Consulta general",
        notes: "",
        created_at: "2025-06-10T00:00:00Z",
      },
    ];
    DashboardRepository.getRawDataForExport.mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboard());

    // Mock createElement and click for CSV download
    const mockClick = vi.fn();
    const mockLink = { href: "", download: "", click: mockClick };
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");

    await act(async () => {
      await result.current.exportToCSV({ from: "2025-06-01", to: "2025-06-30" });
    });

    expect(DashboardRepository.getRawDataForExport).toHaveBeenCalledWith({
      from: "2025-06-01",
      to: "2025-06-30",
    });
    expect(mockClick).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Reporte descargado");

    createElementSpy.mockRestore();
  });

  it("should show info toast when no data to export", async () => {
    DashboardRepository.getRawDataForExport.mockResolvedValue([]);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.exportToCSV({ from: "2025-06-01", to: "2025-06-30" });
    });

    expect(toast.info).toHaveBeenCalledWith("No hay datos para exportar");
  });
});