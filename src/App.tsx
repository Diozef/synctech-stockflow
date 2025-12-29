import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Screens
import AuthScreen from "@/screens/AuthScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { ConfirmNicheScreen } from "@/screens/ConfirmNicheScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { ProductFormScreen } from "@/screens/ProductFormScreen";
import { ProductsListScreen } from "@/screens/ProductsListScreen";
import { MovementsScreen } from "@/screens/MovementsScreen";
import { ReportsScreen } from "@/screens/ReportsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BusinessProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth */}
              <Route path="/" element={<AuthScreen />} />
              
              {/* Onboarding Flow */}
              <Route path="/app/onboarding" element={<OnboardingScreen />} />
              <Route path="/app/confirm-niche" element={<ConfirmNicheScreen />} />
              
              {/* Main App */}
              <Route path="/app/dashboard" element={<DashboardScreen />} />
              <Route path="/app/products" element={<ProductsListScreen />} />
              <Route path="/app/products/new" element={<ProductFormScreen />} />
              <Route path="/app/movements" element={<MovementsScreen />} />
              <Route path="/app/reports" element={<ReportsScreen />} />
              <Route path="/app/settings" element={<SettingsScreen />} />
              
              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BusinessProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
