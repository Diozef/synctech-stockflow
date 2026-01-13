import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { renderWithProviders } from "@/test/test-utils";

/**
 * Mock do contexto de autenticação
 */
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    loading: false,
    business: { id: "business-1" },
  }),
}));

/**
 * Mock do hook de assinatura
 */
vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({
    subscription: { status: "active" },
    hasActiveAccess: true,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("ProtectedRoute", () => {
  it("permite acesso quando usuário está autenticado", () => {
    const { container } = renderWithProviders(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <Routes>
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(container.innerHTML).toContain("Dashboard");
  });
});
