import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTabKeyboardNav } from "../useTabKeyboardNav";

describe("useTabKeyboardNav", () => {
  it("should return a function", () => {
    const { result } = renderHook(() =>
      useTabKeyboardNav(["tab1", "tab2"], "tab1", vi.fn())
    );
    expect(typeof result.current).toBe("function");
  });

  it("should call setActiveTab with next tab on ArrowRight", () => {
    const setActiveTab = vi.fn();
    const { result } = renderHook(() =>
      useTabKeyboardNav(["tab1", "tab2", "tab3"], "tab1", setActiveTab)
    );

    result.current({ key: "ArrowRight", preventDefault: vi.fn() });
    expect(setActiveTab).toHaveBeenCalledWith("tab2");
  });

  it("should call setActiveTab with previous tab on ArrowLeft", () => {
    const setActiveTab = vi.fn();
    const { result } = renderHook(() =>
      useTabKeyboardNav(["tab1", "tab2", "tab3"], "tab2", setActiveTab)
    );

    result.current({ key: "ArrowLeft", preventDefault: vi.fn() });
    expect(setActiveTab).toHaveBeenCalledWith("tab1");
  });

  it("should wrap around to first tab when at end and pressing ArrowRight", () => {
    const setActiveTab = vi.fn();
    const { result } = renderHook(() =>
      useTabKeyboardNav(["tab1", "tab2", "tab3"], "tab3", setActiveTab)
    );

    result.current({ key: "ArrowRight", preventDefault: vi.fn() });
    expect(setActiveTab).toHaveBeenCalledWith("tab1");
  });

  it("should wrap around to last tab when at start and pressing ArrowLeft", () => {
    const setActiveTab = vi.fn();
    const { result } = renderHook(() =>
      useTabKeyboardNav(["tab1", "tab2", "tab3"], "tab1", setActiveTab)
    );

    result.current({ key: "ArrowLeft", preventDefault: vi.fn() });
    expect(setActiveTab).toHaveBeenCalledWith("tab3");
  });

  it("should not call setActiveTab for other keys", () => {
    const setActiveTab = vi.fn();
    const { result } = renderHook(() =>
      useTabKeyboardNav(["tab1", "tab2"], "tab1", setActiveTab)
    );

    result.current({ key: "Enter", preventDefault: vi.fn() });
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("should call preventDefault when arrow key is pressed", () => {
    const preventDefault = vi.fn();
    const { result } = renderHook(() =>
      useTabKeyboardNav(["tab1", "tab2"], "tab1", vi.fn())
    );

    result.current({ key: "ArrowRight", preventDefault });
    expect(preventDefault).toHaveBeenCalled();
  });
});
