import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { AuthContext, useAuth } from "../AuthContext";

describe("useAuth", () => {
  const mockContextValue = {
    user: { id: "123", email: "test@example.com" },
    profile: { full_name: "Test User", roles: { name: "APRENDIZ" } },
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    refreshProfile: vi.fn(),
    hasRole: vi.fn(),
    isAdmin: vi.fn(),
    isCoordination: vi.fn(),
    isProfessional: vi.fn(),
    isAprendiz: vi.fn(),
  };

  const wrapper = ({ children }) => (
    <AuthContext.Provider value={mockContextValue}>
      {children}
    </AuthContext.Provider>
  );

  it("should return context value when used inside AuthProvider", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.user).toEqual({ id: "123", email: "test@example.com" });
    expect(result.current.profile).toEqual({ full_name: "Test User", roles: { name: "APRENDIZ" } });
  });

  it("should throw error when used outside AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth debe usarse dentro de AuthProvider");
    
    consoleSpy.mockRestore();
  });

  it("should provide signIn function", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signIn).toBe("function");
  });

  it("should provide signOut function", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signOut).toBe("function");
  });

  it("should provide isAdmin function", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.isAdmin).toBe("function");
  });
});
