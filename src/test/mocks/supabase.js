import { vi } from "vitest";

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  neq: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
};

export const createMockSupabase = (overrides = {}) => {
  const mock = { ...mockSupabase, ...overrides };

  Object.keys(mock).forEach((key) => {
    if (typeof mock[key] === "function" && key !== "then") {
      vi.spyOn(mock, key).mockImplementation(() => mock);
    }
  });

  return mock;
};

export const mockSuccessResponse = (data) => ({
  data,
  error: null,
});

export const mockErrorResponse = (message) => ({
  data: null,
  error: { message, code: "ERROR" },
});
