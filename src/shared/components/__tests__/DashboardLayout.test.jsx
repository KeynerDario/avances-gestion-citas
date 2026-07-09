import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardLayout } from "../DashboardLayout";
import { AuthContext } from "../../../providers/AuthContext";
import { ThemeContext } from "../../../providers/ThemeContext";

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Menu: () => <div>Menu Icon</div>,
    X: () => <div>X Icon</div>,
    ChevronLeft: () => <div>ChevronLeft Icon</div>,
    ChevronRight: () => <div>ChevronRight Icon</div>,
    RefreshCw: () => <div>RefreshCw Icon</div>,
    Download: () => <div>Download Icon</div>,
    Calendar: () => <div>Calendar Icon</div>,
    Home: () => <div>Home Icon</div>,
    Users: () => <div>Users Icon</div>,
    Shield: () => <div>Shield Icon</div>,
    Clock: () => <div>Clock Icon</div>,
    CheckCircle: () => <div>CheckCircle Icon</div>,
    XCircle: () => <div>XCircle Icon</div>,
    Sun: () => <div>Sun Icon</div>,
    Moon: () => <div>Moon Icon</div>,
    Sunrise: () => <div>Sunrise Icon</div>,
    User: () => <div>User Icon</div>,
    UserCog: () => <div>UserCog Icon</div>,
    Building2: () => <div>Building2 Icon</div>,
    BarChart3: () => <div>BarChart3 Icon</div>,
    UserCircle: () => <div>UserCircle Icon</div>,
    List: () => <div>List Icon</div>,
    Settings: () => <div>Settings Icon</div>,
    Activity: () => <div>Activity Icon</div>,
    Command: () => <div>Command Icon</div>,
    Search: () => <div>Search Icon</div>,
    CalendarDays: () => <div>CalendarDays Icon</div>,
    LogOut: () => <div>LogOut Icon</div>,
    ChevronDown: () => <div>ChevronDown Icon</div>,
  };
});

const mockAuthValue = {
  user: { id: "user-1", email: "test@test.com" },
  profile: { full_name: "Test User", roles: { name: "APRENDIZ" } },
  loading: false,
  signOut: vi.fn(),
  hasRole: () => true,
  isAdmin: () => false,
  isCoordination: () => false,
  isProfessional: () => false,
  isAprendiz: () => true,
};

const mockThemeValue = {
  theme: "light",
  toggleTheme: vi.fn(),
};

function renderWithProviders(ui, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeContext.Provider value={mockThemeValue}>
        <AuthContext.Provider value={mockAuthValue}>
          {ui}
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </MemoryRouter>
  );
}

describe("DashboardLayout", () => {
  const defaultProps = {
    title: "Test Dashboard",
    breadcrumbs: ["Dashboard", "Test"],
    actions: [],
    userRole: "APRENDIZ",
    loading: false,
    empty: false,
    children: <div>Test Content</div>,
  };

  it("renders title", () => {
    renderWithProviders(<DashboardLayout {...defaultProps} />);
    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
  });

  it("renders children content", () => {
    renderWithProviders(<DashboardLayout {...defaultProps} />);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("toggles sidebar collapse on desktop", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1200,
    });
    renderWithProviders(<DashboardLayout {...defaultProps} />);
    const sidebarToggle = screen.getByRole("button", { name: /Contraer menú/i });
    fireEvent.click(sidebarToggle);
    expect(screen.getByRole("button", { name: /Expandir menú/i })).toBeInTheDocument();
  });

  it("shows actions buttons", () => {
    const actions = [
      {
        label: "Actualizar",
        onClick: vi.fn(),
        icon: <span>refresh</span>,
      },
      {
        label: "Exportar",
        onClick: vi.fn(),
        icon: <span>download</span>,
      },
    ];
    renderWithProviders(
      <DashboardLayout {...defaultProps} actions={actions} />
    );
    expect(screen.getByText("Actualizar")).toBeInTheDocument();
    expect(screen.getByText("Exportar")).toBeInTheDocument();
  });

  it("filters navigation items based on user role", () => {
    const { container } = renderWithProviders(
      <DashboardLayout {...defaultProps} userRole="APRENDIZ" />
    );
    const navItems = container.querySelectorAll(".nav-item");
    expect(navItems.length).toBeGreaterThan(0);
  });

  it("shows loading state when loading is true", () => {
    renderWithProviders(<DashboardLayout {...defaultProps} loading={true} />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("shows empty state when empty is true and no children", () => {
    renderWithProviders(<DashboardLayout {...defaultProps} empty={true} />);
    expect(screen.getByText("Sin datos aún")).toBeInTheDocument();
  });

  it("renders sidebar with proper ARIA labels", () => {
    renderWithProviders(<DashboardLayout {...defaultProps} />);
    expect(screen.getByLabelText("Navegación principal")).toBeInTheDocument();
  });
});
