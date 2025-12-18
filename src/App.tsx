import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BusinessProvider } from "@/contexts/BusinessContext";

// Screens
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { ConfirmNicheScreen } from "@/screens/ConfirmNicheScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { ProductFormScreen } from "@/screens/ProductFormScreen";
import { ProductsListScreen } from "@/screens/ProductsListScreen";
import { MovementsScreen } from "@/screens/MovementsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BusinessProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Onboarding Flow */}
            <Route path="/" element={<OnboardingScreen />} />
            <Route path="/confirm-niche" element={<ConfirmNicheScreen />} />
            
            {/* Main App */}
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/products" element={<ProductsListScreen />} />
            <Route path="/products/new" element={<ProductFormScreen />} />
            <Route path="/movements" element={<MovementsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            
            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BusinessProvider>
  </QueryClientProvider>
);

export default App;
