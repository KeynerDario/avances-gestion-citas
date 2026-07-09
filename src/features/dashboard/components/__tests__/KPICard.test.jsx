import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICard } from "../KPICard";

describe("KPICard", () => {
  it("renders title and value", () => {
    render(<KPICard title="Total Citas" value={42} />);
    expect(screen.getByText("Total Citas")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<KPICard title="Test" value={10} subtitle="Subtitle text" />);
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("applies color as CSS variable", () => {
    const { container } = render(<KPICard title="Test" value={5} color="#ff0000" />);
    const card = container.firstChild;
    expect(card).toHaveStyle({ '--kpi-color': '#ff0000' });
  });

  it("renders positive trend", () => {
    render(<KPICard title="Test" value={10} trend={15} />);
    expect(screen.getByText(/15%/)).toBeInTheDocument();
  });

  it("renders negative trend", () => {
    render(<KPICard title="Test" value={10} trend={-10} />);
    expect(screen.getByText(/10%/)).toBeInTheDocument();
  });
});
