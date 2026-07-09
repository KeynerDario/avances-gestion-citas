import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockRepoInstance = {
  getUsers: vi.fn(),
  getRoles: vi.fn(),
  getDependencies: vi.fn(),
  getUserCountsByRole: vi.fn(),
  getAuditLogs: vi.fn(),
  getConfig: vi.fn(),
  updateUserRole: vi.fn(),
  updateUserDependency: vi.fn(),
  toggleUserStatus: vi.fn(),
  updateConfig: vi.fn(),
  createDependency: vi.fn(),
  updateDependency: vi.fn(),
  deleteDependency: vi.fn(),
};

const MockAdminRepository = vi.hoisted(() => {
  return class {
    constructor() {
      return mockRepoInstance;
    }
  };
});

vi.mock("../../api/admin.repository", () => ({
  AdminRepository: MockAdminRepository,
}));

const { useAdmin } = await import("../useAdmin");

describe("useAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAdmin());

    expect(result.current.users).toEqual([]);
    expect(result.current.roles).toEqual([]);
    expect(result.current.dependencies).toEqual([]);
    expect(result.current.auditLogs).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should fetch roles successfully", async () => {
    const mockRoles = [
      { id: 1, name: "APRENDIZ" },
      { id: 2, name: "PROFESIONAL" },
    ];
    mockRepoInstance.getRoles.mockResolvedValue(mockRoles);

    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.fetchRoles();
    });

    expect(result.current.roles).toEqual(mockRoles);
  });

  it("should fetch users successfully", async () => {
    const mockUsers = { users: [{ id: "u1", full_name: "Juan" }], total: 1, page: 1, totalPages: 1 };
    mockRepoInstance.getUsers.mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.fetchUsers({ page: 1, limit: 20 });
    });

    expect(result.current.users).toEqual(mockUsers.users);
  });

  it("should fetch dependencies successfully", async () => {
    const mockDeps = [{ id: 1, name: "Psicología", color: "#FF5733" }];
    mockRepoInstance.getDependencies.mockResolvedValue(mockDeps);

    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.fetchDependencies();
    });

    expect(result.current.dependencies).toEqual(mockDeps);
  });

  it("should fetch audit logs", async () => {
    const mockLogs = { logs: [{ id: "l1", action: "CREATE_APPOINTMENT" }], total: 1 };
    mockRepoInstance.getAuditLogs.mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.fetchAuditLogs({ page: 1 });
    });

    expect(result.current.auditLogs).toEqual(mockLogs.logs);
  });

  it("should fetch user counts", async () => {
    const mockCounts = { APRENDIZ: 30, PROFESIONAL: 10, total: 50, inactive: 5 };
    mockRepoInstance.getUserCountsByRole.mockResolvedValue(mockCounts);

    const { result } = renderHook(() => useAdmin());

    let counts;
    await act(async () => {
      counts = await result.current.fetchUserCounts();
    });

    expect(counts).toEqual(mockCounts);
  });

  it("should handle fetch error", async () => {
    mockRepoInstance.getUsers.mockRejectedValue(new Error("Error DB"));

    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.fetchUsers({});
    });

    expect(result.current.error).toBe("Error DB");
  });

  it("should clear error", () => {
    const { result } = renderHook(() => useAdmin());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
